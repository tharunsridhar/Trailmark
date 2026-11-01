"""Turns an uploaded file into small pieces, each with a locator saying where it came from.

The formats are the ones described in data/README.md. A file that cannot be read
comes back as "unreadable" and one with nothing in it as "empty", nothing is guessed.
"""

import csv
import io
import json
from dataclasses import dataclass, field

from pypdf import PdfReader


@dataclass
class PieceData:
    locator: str
    content: str
    meta: dict | None = None


@dataclass
class ImportResult:
    status: str  # ok, empty or unreadable
    pieces: list[PieceData] = field(default_factory=list)
    note: str | None = None


def import_source(source_type: str, filename: str, data: bytes) -> ImportResult:
    readers = {"repo": read_repo, "doc": read_doc, "chat": read_chat, "tasks": read_tasks}
    reader = readers.get(source_type)
    if reader is None:
        return ImportResult("unreadable", note=f"Unknown source type {source_type}")

    try:
        pieces = reader(filename, data)
    except (ValueError, KeyError, TypeError, csv.Error) as error:
        return ImportResult("unreadable", note=f"Could not read the file: {error}")

    if not pieces:
        return ImportResult("empty", note="The file has no content to import")
    return ImportResult("ok", pieces)


def decode(data: bytes) -> str:
    # UnicodeDecodeError is a ValueError, so a binary file ends up as "unreadable"
    return data.decode("utf-8-sig")


def read_chat(filename: str, data: bytes) -> list[PieceData]:
    text = decode(data)
    if filename.lower().endswith(".json") or text.lstrip().startswith(("{", "[")):
        loaded = json.loads(text)
        messages = loaded["messages"] if isinstance(loaded, dict) else loaded
        pieces = []
        for index, message in enumerate(messages, start=1):
            number = message.get("id", index)
            sender = message.get("sender", "unknown")
            when = message.get("time", "")
            pieces.append(PieceData(
                locator=f"chat message {number}",
                content=f"[{when}] {sender}: {message['text']}",
                meta={"sender": sender, "time": when},
            ))
        return pieces

    # a plain text export, one message per line
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return [PieceData(f"chat line {n}", line) for n, line in enumerate(lines, start=1)]


def read_tasks(filename: str, data: bytes) -> list[PieceData]:
    reader = csv.DictReader(io.StringIO(decode(data)))
    if not reader.fieldnames:
        return []
    reader.fieldnames = [name.strip().lower() for name in reader.fieldnames]
    if "title" not in reader.fieldnames:
        raise ValueError("tasks file needs a 'title' column")

    pieces = []
    for number, row in enumerate(reader, start=1):
        row = {k: (v or "").strip() for k, v in row.items() if k}
        if not any(row.values()):
            continue
        task_id = row.get("id") or str(number)
        content = (
            f"Task {task_id}: {row['title']} | owner: {row.get('owner') or 'none'}"
            f" | status: {row.get('status') or 'unknown'} | due: {row.get('due') or 'none'}"
            f" | notes: {row.get('notes') or 'none'}"
        )
        pieces.append(PieceData(f"task {task_id}", content, meta=row))
    return pieces


def read_doc(filename: str, data: bytes) -> list[PieceData]:
    if filename.lower().endswith(".pdf"):
        reader = PdfReader(io.BytesIO(data))
        text = "\n\n".join(page.extract_text() or "" for page in reader.pages)
    else:
        text = decode(data)

    pieces = []
    heading = ""
    for block in text.replace("\r\n", "\n").split("\n\n"):
        block = block.strip()
        if not block:
            continue
        # a lone heading is attached to the paragraph after it
        if block.startswith("#") and "\n" not in block:
            heading = block.lstrip("# ").strip()
            continue
        content = f"{heading}: {block}" if heading else block
        pieces.append(PieceData(f"{filename} paragraph {len(pieces) + 1}", content, meta={"heading": heading}))
        heading = ""
    return pieces


def read_repo(filename: str, data: bytes) -> list[PieceData]:
    loaded = json.loads(decode(data))
    if not isinstance(loaded, dict):
        raise ValueError("repo export must be a JSON object")

    pieces = []
    for commit in loaded.get("commits", []):
        short = commit["sha"][:7]
        files = ", ".join(commit.get("files", []))
        content = f"Commit {short} by {commit.get('author', 'unknown')} on {commit.get('date', '')}: {commit['message']}"
        if files:
            content += f" (files: {files})"
        pieces.append(PieceData(
            f"commit {short}", content,
            meta={"kind": "commit", "author": commit.get("author"), "date": commit.get("date")},
        ))

    for kind, label, prefix in (("pull_requests", "Pull request", "PR"), ("issues", "Issue", "issue")):
        for item in loaded.get(kind, []):
            comments = " ".join(item.get("comments", []))
            content = (
                f"{label} #{item['number']} '{item['title']}' by {item.get('author', 'unknown')}"
                f" ({item.get('state', 'unknown')}): {item.get('body', '')}"
            )
            if comments:
                content += f" Comments: {comments}"
            pieces.append(PieceData(
                f"{prefix} #{item['number']}", content,
                meta={"kind": prefix, "author": item.get("author"), "state": item.get("state")},
            ))
    return pieces
