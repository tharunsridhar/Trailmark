from pathlib import Path

from app.importers import import_source

FIXTURES = Path(__file__).parent / "fixtures"


def load(source_type, name):
    return import_source(source_type, name, (FIXTURES / name).read_bytes())


def test_chat_json_one_piece_per_message():
    result = load("chat", "chat.json")
    assert result.status == "ok"
    assert len(result.pieces) == 3
    first = result.pieces[0]
    assert first.locator == "chat message 1"
    assert "Asha:" in first.content and "Render" in first.content
    assert first.meta["sender"] == "Asha"


def test_chat_plain_text_lines():
    result = import_source("chat", "chat.txt", b"Asha: hi\n\nRavi: hello\n")
    assert [p.locator for p in result.pieces] == ["chat line 1", "chat line 2"]


def test_tasks_keep_owner_and_status():
    result = load("tasks", "tasks.csv")
    assert result.status == "ok"
    assert [p.locator for p in result.pieces] == ["task T1", "task T2", "task T3"]
    unowned = result.pieces[1]
    assert unowned.meta["owner"] == ""
    assert "owner: none" in unowned.content


def test_tasks_header_only_is_empty():
    result = load("tasks", "empty_tasks.csv")
    assert result.status == "empty"
    assert result.pieces == []


def test_tasks_without_title_column_is_unreadable():
    result = import_source("tasks", "bad.csv", b"name,owner\nx,y\n")
    assert result.status == "unreadable"


def test_doc_splits_paragraphs_and_keeps_headings():
    result = load("doc", "design.md")
    assert result.status == "ok"
    assert len(result.pieces) == 2
    assert result.pieces[0].content.startswith("Hosting: We host the backend on Heroku")
    assert result.pieces[0].locator == "design.md paragraph 1"


def test_repo_commits_prs_and_issues():
    result = load("repo", "repo.json")
    assert result.status == "ok"
    assert [p.locator for p in result.pieces] == ["commit a3f9c21", "PR #4", "issue #7"]
    assert "rewrite payment retry" in result.pieces[0].content
    assert result.pieces[1].meta["state"] == "merged"
    assert "Comments: looks good" in result.pieces[1].content


def test_repo_empty_export():
    assert import_source("repo", "e.json", b"{}").status == "empty"


def test_broken_json_is_unreadable_not_a_crash():
    assert import_source("repo", "r.json", b"{not json").status == "unreadable"
    assert import_source("chat", "c.json", b'{"messages": [{"id": 1}]}').status == "unreadable"


def test_binary_file_is_unreadable():
    assert import_source("doc", "x.md", b"\xff\xfe\x00\x00bad").status == "unreadable"


def test_unknown_type_is_unreadable():
    assert import_source("video", "x", b"").status == "unreadable"
