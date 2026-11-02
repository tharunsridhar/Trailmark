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
    EXTRACT_SYSTEM,
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


def ask_for_statements(llm, pieces) -> dict:
    raw = parse_json(llm.complete(EXTRACT_SYSTEM, build_extract_prompt(pieces)))
    if not isinstance(raw.get("statements", []), list) or not isinstance(raw.get("gaps", []), list):
        raise LLMError("the model returned JSON of the wrong shape")
    return raw


def analyze(llm, pieces) -> AnalysisResult:
    pieces_by_id = {p.id: p for p in pieces}
    drafts, dropped = build_drafts(llm, ask_for_statements(llm, pieces), pieces_by_id)

    # a long input makes the model skip whole sources, so those get a second, smaller request
    cited = {pieces_by_id[e.piece_id].source.name for d in drafts for e in d.evidence}
    skipped = {p.source.name for p in pieces} - cited
    if skipped:
        try:
            raw = ask_for_statements(llm, [p for p in pieces if p.source.name in skipped])
            more, more_dropped = build_drafts(llm, raw, pieces_by_id)
        except LLMError:
            # the first pass already worked, a failed top-up should not throw it away
            more, more_dropped = [], 0
        drafts += more
        dropped += more_dropped
    return AnalysisResult(drafts, dropped)


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
