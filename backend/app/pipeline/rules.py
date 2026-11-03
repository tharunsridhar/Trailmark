"""Checks written in code that run after the model's statements are built.

Model output changes from run to run, so the things that can be decided from the sources alone
are decided here: facts that two sources state differently, commits nobody explains, routine
commits, and statements that repeat a reported conflict. Everything quoted here is copied from
a piece, so it passes the same word-for-word check as the model's evidence.
"""

import re
from dataclasses import dataclass

from app.pipeline.analyze import Draft, Evidence, chat_sender, quote_in_piece, squash

# ---- routine commits ----

ROUTINE_COMMIT = re.compile(
    r"\b(typos?|formatting|whitespace|lint(ing)?|pin(ned)?|bump|fixtures?|rename|clean ?up|readme|modal|dialog|button|spacing)\b",
    re.I,
)


def commit_message(piece) -> str:
    return piece.content.split(": ", 1)[-1]


def is_commit(piece) -> bool:
    return (getattr(piece, "meta", None) or {}).get("kind") == "commit" or piece.locator.startswith("commit ")


def is_routine_commit(piece) -> bool:
    return is_commit(piece) and bool(ROUTINE_COMMIT.search(commit_message(piece)))


def drop_routine_commits(drafts: list[Draft], pieces_by_id: dict) -> list[Draft]:
    """A decision that only cites routine commits (typo, version pin, small screen) records work
    done, not a choice, so it is left off the lead's review list."""
    def routine(draft: Draft) -> bool:
        return (
            draft.kind == "decision" and draft.label in ("verified", "unverified") and bool(draft.evidence)
            and all(is_routine_commit(pieces_by_id[e.piece_id]) for e in draft.evidence)
        )

    return [d for d in drafts if not routine(d)]


# ---- facts two sources state differently ----

SENTENCE = re.compile(r"(?<=[.!?])\s+|\n+")


@dataclass
class Probe:
    name: str
    topic: re.Pattern
    value: callable  # sentence -> normalised value or None


def lifetime_value(sentence: str) -> str | None:
    if not re.search(r"\b(token|jwt|session)s?\b", sentence, re.I) or not re.search(r"expir|lifetime", sentence, re.I):
        return None
    match = re.search(r"EXPIRE_MINUTES\s*=\s*(\d+)", sentence)
    if match:
        return f"{int(match.group(1))} minutes"
    match = re.search(r"(\d+)\s*(minutes?|mins?|hours?|hrs?)\b", sentence, re.I)
    if not match:
        return None
    number = int(match.group(1)) * (60 if match.group(2).lower().startswith(("h")) else 1)
    return f"{number} minutes"


def capacity_value(sentence: str) -> str | None:
    if not re.search(r"auditorium", sentence, re.I):
        return None
    match = re.search(r"(\d[\d,]*)\s*(?:seats|attendees|people)", sentence, re.I) or re.search(
        r"capacity[^0-9.]{0,40}(\d[\d,]*)", sentence, re.I
    )
    return f"{int(match.group(1).replace(',', ''))} seats or attendees" if match else None


def qr_value(sentence: str) -> str | None:
    if not re.search(r"\bQR\b", sentence):
        return None
    found = {name for name, pattern in (("a UUID", r"uuid"), ("a signed HMAC token", r"hmac")) if re.search(pattern, sentence, re.I)}
    # a sentence naming both formats is a person pointing out the disagreement, not a side of it
    return found.pop() if len(found) == 1 else None


PROBES = [
    Probe("token lifetime", re.compile(r"expir|lifetime", re.I), lifetime_value),
    Probe("auditorium capacity", re.compile(r"auditorium", re.I), capacity_value),
    Probe("ticket QR format", re.compile(r"\bQR\b"), qr_value),
]


def sides(probe: Probe, pieces) -> dict[str, list[tuple]]:
    """For each value the sources give, the pieces that state it with the sentence each one uses."""
    found: dict[str, list[tuple]] = {}
    for piece in pieces:
        if not probe.topic.search(piece.content):
            continue
        hits = {}
        for sentence in SENTENCE.split(piece.content):
            value = probe.value(sentence)
            if value:
                hits.setdefault(value, sentence.strip())
        # a piece that states two different values is a discussion of the conflict, not one side of it
        if len(hits) == 1:
            value, quote = next(iter(hits.items()))
            found.setdefault(value, []).append((piece, quote))
    return found


def piece_name(piece) -> str:
    return f"{piece.source.name}, {piece.locator}"


def find_conflicts(pieces, drafts: list[Draft]) -> list[Draft]:
    """Two sources that give different values for the same fact are reported as a conflict with
    both quotes, unless a conflict covering both sides is already reported."""
    reported = [d for d in drafts if d.label == "conflicting"]
    found = []
    for probe in PROBES:
        values = sides(probe, pieces)
        if len(values) < 2:
            continue
        (first_value, first_side), (second_value, second_side) = list(values.items())[:2]
        cited = [{e.piece_id for e in d.evidence} for d in reported]
        if any(
            ids & {p.id for p, _ in first_side} and ids & {p.id for p, _ in second_side} for ids in cited
        ):
            continue
        (first, _), (second, _) = first_side[0], second_side[0]
        chosen = first_side[:2] + second_side[:2]
        evidence = [Evidence(p.id, squash(q)) for p, q in chosen]
        if not all(quote_in_piece(e.quote, p) for e, (p, _) in zip(evidence, chosen)):
            continue
        text = (
            f"Sources disagree on the {probe.name}: {first_value} ({piece_name(first)}) "
            f"against {second_value} ({piece_name(second)})."
        )
        found.append(Draft("decision", text, "conflicting", evidence))
    return found


def settle_conflicted_statements(drafts: list[Draft]) -> list[Draft]:
    """A statement built on a source that is part of a reported conflict cannot stay verified: it is
    one side of that conflict. One that only repeats the conflict is merged into it, one that also
    cites other sources is relabelled unverified."""
    conflicted = {e.piece_id for d in drafts if d.label == "conflicting" for e in d.evidence}
    kept = []
    for draft in drafts:
        cited = {e.piece_id for e in draft.evidence}
        if draft.label == "verified" and cited & conflicted:
            if cited <= conflicted:
                continue
            draft.label = "unverified"
        kept.append(draft)
    return kept


# ---- commits nobody explains ----

STOPWORDS = {
    "implement", "update", "setup", "initial", "should", "would", "could", "about", "which", "their", "there",
    "after", "before", "using", "commit", "files", "project", "student", "students", "campus", "ticket", "tickets",
}


# a commit that brings in a service, secret or outside package is likelier to need something unwritten
NEEDS_SETUP = re.compile(r"(?<![a-z])(import|sdk|webhook|secret|credential|api|payment|sms|env)(?![a-z])|requirements|pyproject", re.I)


def words(text: str) -> set[str]:
    return {w for w in re.findall(r"[a-z][a-z0-9_]{4,}", text.lower()) if w not in STOPWORDS}


def identifiers(text: str) -> set[str]:
    """Names that only mean one thing: snake_case, UPPER_CASE, file names and paths."""
    return {t.lower() for t in re.findall(r"[A-Za-z0-9]+(?:[_./][A-Za-z0-9]+)+|[A-Z][A-Z0-9]{3,}", text)}


def explains(commit, other) -> bool:
    """Another source that talks about this commit: it names the commit, one of its files or names,
    or shares at least three content words with it. A question is not an explanation, and the commit
    author describing their own commit in chat is the same person's word, not a second source."""
    if "?" in other.content:
        return False
    author = (getattr(commit, "meta", None) or {}).get("author")
    sender = chat_sender(other)
    if sender and author and sender.lower() == author.lower():
        return False
    sha = commit.locator.split(" ", 1)[1]
    if sha in other.content:
        return True
    own = identifiers(commit.content) - {sha}
    names = own | {i.split("/")[-1] for i in own if "/" in i}
    text = other.content.lower()
    if any(name in text for name in names):
        return True
    return len(words(commit_message(commit)) & words(other.content)) >= 3


def unexplained_commits(pieces, drafts: list[Draft]) -> list[Draft]:
    """A commit that no issue, pull request, document, task or other person's chat message explains
    becomes a gap with a question for the person leaving, whatever the model said about it."""
    others = [p for p in pieces if not is_commit(p)]
    # a commit already in a gap or a conflict has been dealt with there
    asked = {e.piece_id for d in drafts if d.label in ("missing", "conflicting") for e in d.evidence}

    gaps = []
    for commit in pieces:
        if not is_commit(commit) or is_routine_commit(commit) or commit.id in asked:
            continue
        if any(explains(commit, other) for other in others):
            continue
        message = commit_message(commit)
        gaps.append(Draft(
            "risk",
            f"Nothing in the sources explains why {commit.locator} was made: {message}",
            "missing",
            [Evidence(commit.id, squash(commit.content))],
            question=(
                f"Why was {commit.locator} made ('{message}'), and is anything needed to run it, "
                "such as credentials, settings or instructions that are not written down?"
            ),
            risk=3 if NEEDS_SETUP.search(commit.content) else 1,
        ))
    return gaps
