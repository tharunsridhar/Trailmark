"""Reconstruct, verify and find gaps.

The model proposes statements with quotes. We do not trust them: a quote that is not
in the cited piece throws the statement away, and only a separate check that sees just
the claim and the quote can make a statement "verified".
"""

import json
import re
from dataclasses import dataclass, field

from app.models import STATEMENT_KINDS
from app.pipeline.llm import LLMError
from app.pipeline.prompts import (
    CLAIMS_FOCUS,
    DOC_FOCUS,
    EXTRACT_SYSTEM,
    RECORD_FOCUS,
    VERIFY_SYSTEM,
    build_extract_prompt,
    build_verify_prompt,
)

# "answer" statements only come from the departing member, never from extraction
EXTRACTED_KINDS = tuple(k for k in STATEMENT_KINDS if k != "answer")


@dataclass
class Evidence:
    piece_id: int
    quote: str


@dataclass
class Draft:
    kind: str
    text: str
    label: str
    evidence: list[Evidence] = field(default_factory=list)
    question: str | None = None
    risk: int = 1


@dataclass
class AnalysisResult:
    drafts: list[Draft]
    dropped: int = 0


def squash(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def quote_in_piece(quote: str, piece) -> bool:
    """Word for word, ignoring only differences in spacing and line breaks."""
    quote = squash(quote)
    return bool(quote) and quote in squash(piece.content)


def parse_json(text: str) -> dict:
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end <= start:
        raise LLMError("the model did not return JSON")
    try:
        loaded = json.loads(text[start : end + 1])
    except json.JSONDecodeError as error:
        raise LLMError("the model returned broken JSON") from error
    if not isinstance(loaded, dict):
        raise LLMError("the model returned JSON of the wrong shape")
    return loaded


def check_evidence(raw_evidence, pieces_by_id) -> tuple[list[Evidence], int]:
    """Keeps only evidence whose piece exists and really contains the quote."""
    kept, rejected = [], 0
    seen = set()
    for item in raw_evidence if isinstance(raw_evidence, list) else []:
        try:
            piece = pieces_by_id[int(item["piece_id"])]
            quote = str(item["quote"])
        except (KeyError, TypeError, ValueError):
            rejected += 1
            continue
        if piece.id in seen:
            continue
        if quote_in_piece(quote, piece):
            kept.append(Evidence(piece.id, squash(quote)))
            seen.add(piece.id)
        else:
            rejected += 1
    return kept, rejected


def run_verifier(llm, candidates: list[Draft]) -> dict[int, str]:
    """Asks a separate model call whether each claim follows from its own quotes."""
    if not candidates:
        return {}
    items = [(i, d.text, [e.quote for e in d.evidence]) for i, d in enumerate(candidates)]
    reply = parse_json(llm.complete(VERIFY_SYSTEM, build_verify_prompt(items)))
    verdicts = {}
    for result in reply.get("results", []):
        try:
            verdicts[int(result["id"])] = str(result["verdict"])
        except (KeyError, TypeError, ValueError):
            continue
    return verdicts


def ask_for_statements(llm, pieces, focus: str | None = None) -> dict:
    system = EXTRACT_SYSTEM if focus is None else EXTRACT_SYSTEM + "\n\n" + focus
    raw = parse_json(llm.complete(system, build_extract_prompt(pieces)))
    if not isinstance(raw.get("statements", []), list) or not isinstance(raw.get("gaps", []), list):
        raise LLMError("the model returned JSON of the wrong shape")
    return raw


def chat_sender(piece) -> str | None:
    """Who wrote a chat message. Pieces from other kinds of source have no sender."""
    if getattr(piece.source, "type", None) != "chat":
        return None
    match = re.match(r"\[[^\]]*\]\s*([^:]+):", piece.content)
    return match.group(1).strip() if match else None


def is_one_of(sender: str, names: list[str]) -> bool:
    sender = sender.lower()
    return any(sender in name.lower() or name.lower() in sender for name in names if name)


def author_of(piece) -> str | None:
    """Who wrote a piece, where the piece says: a chat message has a sender, a task has an owner."""
    sender = chat_sender(piece)
    if sender:
        return sender
    if getattr(piece.source, "type", None) == "tasks":
        return (getattr(piece, "meta", None) or {}).get("owner") or None
    return None


def mark_leaver_only_claims(drafts: list[Draft], pieces_by_id: dict, leavers: list[str]) -> None:
    """Something only the departing person says in chat, with no code, document or other person
    behind it, is their word and nothing more, so it cannot be verified. A task they own is their
    own note, so it does not back up their chat message."""
    for draft in drafts:
        if draft.label != "verified" or not draft.evidence:
            continue
        pieces = [pieces_by_id[e.piece_id] for e in draft.evidence]
        authors = [author_of(p) for p in pieces]
        in_chat = any(chat_sender(p) for p in pieces)
        if in_chat and all(a and is_one_of(a, leavers) for a in authors):
            draft.label = "unverified"


def leaver_claims(llm, pieces, pieces_by_id: dict, drafts: list[Draft], leavers: list[str]):
    """The departing person's own chat messages get a request of their own, because a long
    request tends to skip them. A claim already covered by an earlier statement is not repeated."""
    mine = [p for p in pieces if (s := chat_sender(p)) and is_one_of(s, leavers)]
    if not mine:
        return [], 0
    try:
        raw = ask_for_statements(llm, mine, CLAIMS_FOCUS)
    except LLMError:
        return [], 0
    raw["gaps"] = []
    new, dropped = build_drafts(llm, raw, pieces_by_id)
    cited = {e.piece_id for d in drafts for e in d.evidence}
    fresh = [d for d in new if not all(e.piece_id in cited for e in d.evidence)]
    for draft in fresh:
        draft.label = "unverified"
    return fresh, dropped


# a result with fewer statements than this (for a project big enough to have this many) is asked for again
WEAK_BELOW = 15
SAME_TEXT = 0.75


def weak_threshold(pieces) -> int:
    return min(WEAK_BELOW, len(pieces) // 4)


def is_record(piece) -> bool:
    """Commits, pull requests, issues and tasks: one piece is one fact, so a piece nothing cites was skipped."""
    return getattr(piece.source, "type", None) in ("repo", "tasks")


def top_up(llm, wanted, pieces_by_id: dict, focus: str | None = None) -> tuple[list[Draft], int]:
    """A smaller second request for pieces the first one skipped. If it fails the first result is kept."""
    if not wanted:
        return [], 0
    try:
        return build_drafts(llm, ask_for_statements(llm, wanted, focus), pieces_by_id)
    except LLMError:
        return [], 0


def word_set(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]{3,}", text.lower()))


def merge_repeats(drafts: list[Draft]) -> list[Draft]:
    """Two statements of the same kind and label that say nearly the same thing about the same piece are
    one statement: the first one is kept and takes the other's evidence. The model repeats itself more
    when a piece is asked about twice, and the lead should not review the same thing twice."""
    kept: list[Draft] = []
    for draft in drafts:
        words_now = word_set(draft.text)
        twin = None
        for other in kept:
            if other.kind != draft.kind or other.label != draft.label or other.label == "conflicting":
                continue
            if not ({e.piece_id for e in other.evidence} & {e.piece_id for e in draft.evidence}):
                continue
            words_other = word_set(other.text)
            union = words_now | words_other
            if union and len(words_now & words_other) / len(union) >= SAME_TEXT:
                twin = other
                break
        if twin is None:
            kept.append(draft)
            continue
        have = {e.piece_id for e in twin.evidence}
        twin.evidence += [e for e in draft.evidence if e.piece_id not in have]
        twin.risk = max(twin.risk, draft.risk)
    return kept


def analyze(llm, pieces, leavers: list[str] | None = None) -> AnalysisResult:
    # the same sources always reach the model in the same order
    pieces = sorted(pieces, key=lambda p: p.id)
    pieces_by_id = {p.id: p for p in pieces}
    drafts, dropped = build_drafts(llm, ask_for_statements(llm, pieces), pieces_by_id)

    # a thin result means the model gave up early, so the whole request is made once more and merged
    if len(drafts) < weak_threshold(pieces):
        again, again_dropped = top_up(llm, pieces, pieces_by_id)
        drafts += again
        dropped += again_dropped

    # a long input makes the model skip whole sources, so those get a second, smaller request
    cited = {pieces_by_id[e.piece_id].source.name for d in drafts for e in d.evidence}
    skipped = {p.source.name for p in pieces} - cited
    more, more_dropped = top_up(llm, [p for p in pieces if p.source.name in skipped] if skipped else [], pieces_by_id)
    drafts += more
    dropped += more_dropped
    # a document paragraph nothing cites is usually a skipped decision or dependency, so those are asked again
    cited_pieces = {e.piece_id for d in drafts for e in d.evidence}
    loose = [p for p in pieces if "paragraph" in p.locator and p.id not in cited_pieces]
    more, more_dropped = top_up(llm, loose, pieces_by_id, DOC_FOCUS)
    drafts += more
    dropped += more_dropped
    # the same for commits, pull requests, issues and tasks; routine commits are expected to be left out
    cited_pieces = {e.piece_id for d in drafts for e in d.evidence}
    from app.pipeline.rules import is_routine_commit  # rules builds on this module, so it is imported late

    records = [p for p in pieces if is_record(p) and p.id not in cited_pieces and not is_routine_commit(p)]
    more, more_dropped = top_up(llm, records, pieces_by_id, RECORD_FOCUS)
    drafts += more
    dropped += more_dropped

    mark_leaver_only_claims(drafts, pieces_by_id, leavers or [])
    if leavers:
        claims, claims_dropped = leaver_claims(llm, pieces, pieces_by_id, drafts, leavers)
        drafts += claims
        dropped += claims_dropped
    return AnalysisResult(apply_rules(pieces, pieces_by_id, merge_repeats(drafts)), dropped)


def apply_rules(pieces, pieces_by_id: dict, drafts: list[Draft]) -> list[Draft]:
    """The checks that the sources alone can decide, so they do not depend on what the model said."""
    from app.pipeline import rules  # rules builds on this module, so it is imported late

    drafts = rules.drop_routine_commits(drafts, pieces_by_id)
    drafts += rules.find_conflicts(pieces, drafts)
    drafts = rules.settle_conflicted_statements(drafts)
    return rules.limit_questions(drafts + rules.unexplained_commits(pieces, drafts))


def build_drafts(llm, raw: dict, pieces_by_id: dict) -> tuple[list[Draft], int]:
    dropped = 0
    drafts: list[Draft] = []
    to_verify: list[Draft] = []

    for item in raw.get("statements", []):
        kind, text = item.get("kind"), str(item.get("text", "")).strip()
        if kind not in EXTRACTED_KINDS or not text:
            dropped += 1
            continue

        evidence, _ = check_evidence(item.get("evidence"), pieces_by_id)
        # no real support at all means the claim is thrown away, not shown as a guess
        if not evidence:
            dropped += 1
            continue

        draft = Draft(kind, text, "unverified", evidence)
        # a conflict needs two real pieces that disagree, one piece cannot conflict with itself
        if item.get("relation") == "conflicting" and len(evidence) >= 2:
            draft.label = "conflicting"
        elif item.get("relation") == "claim_only":
            # nobody but the person backs it up, so it stays unverified whatever the quote says
            pass
        else:
            to_verify.append(draft)
        drafts.append(draft)

    verdicts = run_verifier(llm, to_verify)
    for index, draft in enumerate(to_verify):
        # anything but a clear "supported" stays unverified
        if verdicts.get(index) == "supported":
            draft.label = "verified"

    for item in raw.get("gaps", []):
        kind, text = item.get("kind"), str(item.get("text", "")).strip()
        if kind not in EXTRACTED_KINDS or not text:
            dropped += 1
            continue
        evidence, _ = check_evidence(item.get("evidence"), pieces_by_id)
        question = str(item.get("question", "")).strip() or f"Can you tell us more about this: {text}"
        try:
            risk = min(3, max(1, int(item.get("risk", 1))))
        except (TypeError, ValueError):
            risk = 1
        drafts.append(Draft(kind, text, "missing", evidence, question=question, risk=risk))

    return drafts, dropped
