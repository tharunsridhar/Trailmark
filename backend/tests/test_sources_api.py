import json

import pytest

from tests.helpers import create_team, sign_in, upload


@pytest.fixture
def team(client):
    return create_team(client)


def test_lead_uploads_a_source(client, team):
    sign_in(client, "Kishan")
    response = upload(client, team, "chat", "chat.json", name="Team chat")
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Team chat"
    assert body["status"] == "ok"
    assert body["piece_count"] == 3
    assert body["allowed_roles"] == ["lead", "departing", "incoming"]


def test_list_sources_shows_counts_and_status(client, team):
    sign_in(client, "Kishan")
    upload(client, team, "tasks", "tasks.csv")
    upload(client, team, "tasks", "empty_tasks.csv", name="Empty list")
    listed = client.get(f"/handovers/{team}/sources").json()
    assert [(s["name"], s["status"], s["piece_count"]) for s in listed] == [
        ("tasks.csv", "ok", 3),
        ("Empty list", "empty", 0),
    ]
    assert listed[1]["note"]


def test_unreadable_file_is_reported_not_guessed(client, team):
    sign_in(client, "Kishan")
    response = client.post(
        f"/handovers/{team}/sources",
        data={"type": "repo", "name": "broken", "allowed_roles": json.dumps(["lead"])},
        files={"file": ("r.json", b"{not json")},
    )
    assert response.status_code == 201
    assert response.json()["status"] == "unreadable"
    assert response.json()["piece_count"] == 0


def test_only_lead_can_upload_or_list(client, team):
    sign_in(client, "Asha")
    assert upload(client, team, "chat", "chat.json").status_code == 403
    assert client.get(f"/handovers/{team}/sources").status_code == 403


def test_upload_needs_sign_in(client, team):
    assert upload(client, team, "chat", "chat.json").status_code == 401


def test_bad_type_and_bad_roles_are_rejected(client, team):
    sign_in(client, "Kishan")
    assert upload(client, team, "video", "chat.json").status_code == 422
    assert upload(client, team, "chat", "chat.json", roles=("admin",)).status_code == 422
    assert upload(client, team, "chat", "chat.json", roles=()).status_code == 422


def test_pieces_inherit_source_access_level(client, team):
    sign_in(client, "Kishan")
    open_id = upload(client, team, "doc", "design.md", roles=("lead", "departing", "incoming")).json()["id"]
    hr = upload(client, team, "chat", "chat.json", name="HR chat", roles=("lead",)).json()

    # ids are handed out in order, pieces of the open doc come first
    open_piece, hr_piece = 1, 3
    assert client.get(f"/pieces/{open_piece}").status_code == 200
    assert client.get(f"/pieces/{hr_piece}").status_code == 200  # the lead sees everything
    assert open_id == 1 and hr["id"] == 2

    client.post("/auth/logout")
    sign_in(client, "Ravi")
    seen = client.get(f"/pieces/{open_piece}")
    assert seen.status_code == 200
    assert seen.json()["source_name"] == "design.md"
    assert "Heroku" in seen.json()["content"]
    assert client.get(f"/pieces/{hr_piece}").status_code == 403


def test_outsider_cannot_open_a_piece(client, team):
    sign_in(client, "Kishan")
    upload(client, team, "doc", "design.md")
    client.post("/auth/logout")
    sign_in(client, "Outsider")
    assert client.get("/pieces/1").status_code == 403


def test_missing_piece_is_404(client, team):
    sign_in(client, "Kishan")
    assert client.get("/pieces/999").status_code == 404


def test_upload_after_approval_is_blocked(client, team, db_session):
    from app.models import Handover

    handover = db_session.get(Handover, team)
    handover.status = "approved"
    db_session.commit()

    sign_in(client, "Kishan")
    assert upload(client, team, "chat", "chat.json").status_code == 409
