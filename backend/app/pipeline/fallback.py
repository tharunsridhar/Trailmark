"""What the product shows when the AI service is not available.

First choice is the results saved from an earlier good run. If there are none, a basic
listing built only from structured fields (task owners, open pull requests, commit
authors). Nothing here invents anything.
"""

import json
import re
from datetime import datetime, timezone
from pathlib import Path

from app.pipeline.analyze import Draft, Evidence, quote_in_piece

DONE_STATUSES = ("done", "closed", "complete", "completed", "merged")


def results_path(directory: str, project_name: str) -> Path:
    slug = re.sub(r"[^a-z0-9]+", "-", project_name.lower()).strip("-") or "project"
    return Path(directory) / f"{slug}.json"


def save_results(directory: str, project_name: str, drafts: list[Draft], pieces) -> None:
    pieces_by_id = {p.id: p for p in pieces}
    saved = []
    for draft in drafts:
        saved.append({
            "kind": draft.kind,
            "text": draft.text,
            "label": draft.label,
            "question": draft.question,
            "risk": draft.risk,
            # piece ids change between imports, so evidence is kept by source name and locator
            "evidence": [
                {
                    "source": pieces_by_id[e.piece_id].source.name,
                    "locator": pieces_by_id[e.piece_id].locator,
                    "quote": e.quote,
                }
                for e in draft.evidence
            ],
        })
    path = results_path(directory, project_name)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps({"saved_at": datetime.now(timezone.utc).isoformat(), "drafts": saved}, indent=2),
        encoding="utf-8",
    )


def load_results(directory: str, project_name: str, pieces) -> list[Draft] | None:
    path = results_path(directory, project_name)
    if not path.exists():
        return None
    try:
        saved = json.loads(path.read_text(encoding="utf-8"))["drafts"]
    except (ValueError, KeyError, OSError):
        return None

    by_location = {(p.source.name, p.locator): p for p in pieces}
    drafts = []
    for item in saved:
        evidence = []
        for e in item.get("evidence", []):
            piece = by_location.get((e["source"], e["locator"]))
            if piece and quote_in_piece(e["quote"], piece):
                evidence.append(Evidence(piece.id, e["quote"]))
        # a saved claim whose sources are gone cannot be shown as supported
        if item["label"] != "missing" and not evidence:
            continue
        drafts.append(Draft(item["kind"], item["text"], item["label"], evidence, item.get("question"), item.get("risk", 1)))
    return drafts or None


def basic_listing(pieces) -> list[Draft]:
    drafts: list[Draft] = []
    authors_seen = set()

    for piece in pieces:
        meta = piece.meta or {}
        source_type = piece.source.type

        if source_type == "tasks":
            owner = meta.get("owner", "")
            status = meta.get("status", "")
            title = meta.get("title", "")
            task_id = meta.get("id") or piece.locator
            finished = status.lower() in DONE_STATUSES
            if owner:
                drafts.append(checked(piece, Draft(
                    "owner", f"{owner} owns task {task_id}: {title}", "verified"), f"owner: {owner}"))
                if not finished:
                    drafts.append(checked(piece, Draft(
                        "unfinished", f"Task {task_id} '{title}' is not finished (status: {status})", "verified"),
                        f"status: {status}"))
            elif not finished:
                drafts.append(checked(piece, Draft(
                    "owner", f"Task {task_id} '{title}' has no owner recorded", "missing",
                    question=f"Who should own task {task_id} '{title}', and what state is it in?", risk=3),
                    "owner: none"))

        elif source_type == "repo":
            if meta.get("kind") in ("PR", "issue") and (meta.get("state") or "").lower() == "open":
                drafts.append(checked(piece, Draft(
                    "unfinished", f"{piece.locator} is still open", "verified"), f"({meta['state']})"))
            author = meta.get("author")
            if meta.get("kind") == "commit" and author and author not in authors_seen:
                authors_seen.add(author)
                drafts.append(checked(piece, Draft(
                    "contact", f"{author} has committed to this repository", "verified"), f"by {author}"))

    return [d for d in drafts if d is not None]


def checked(piece, draft: Draft, quote: str) -> Draft | None:
    """Attaches the piece as evidence only if the quote really is in it."""
    if quote_in_piece(quote, piece):
        draft.evidence = [Evidence(piece.id, quote)]
        return draft
    # the structured field and the text disagree, so say nothing rather than guess
    return None
