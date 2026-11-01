import pytest

from tests.helpers import create_team, make_user, sign_in


@pytest.fixture
def team(client):
    return create_team(client)


def test_creator_becomes_lead(client):
    make_user(client, "Kishan")
    sign_in(client, "Kishan")
    response = client.post("/handovers", json={"title": "Asha leaves", "project_name": "Campus App"})
    assert response.status_code == 201
    assert response.json()["my_role"] == "lead"
    assert response.json()["status"] == "draft"


def test_requires_sign_in(client):
    assert client.get("/handovers").status_code == 401
    assert client.post("/handovers", json={"title": "x", "project_name": "y"}).status_code == 401
    assert client.get("/handovers/1").status_code == 401


def test_list_shows_only_my_handovers(client, team):
    sign_in(client, "Asha")
    mine = client.get("/handovers").json()
    assert [h["id"] for h in mine] == [team]
    assert mine[0]["my_role"] == "departing"

    client.post("/auth/logout")
    sign_in(client, "Outsider")
    assert client.get("/handovers").json() == []


def test_outsider_gets_403(client, team):
    sign_in(client, "Outsider")
    assert client.get(f"/handovers/{team}").status_code == 403


def test_unknown_handover_looks_the_same_as_someone_elses(client, team):
    sign_in(client, "Outsider")
    assert client.get("/handovers/9999").status_code == 403


def test_member_can_read_handover(client, team):
    sign_in(client, "Ravi")
    response = client.get(f"/handovers/{team}")
    assert response.status_code == 200
    assert response.json()["my_role"] == "incoming"


def test_only_lead_can_list_or_add_members(client, team):
    sign_in(client, "Ravi")
    assert client.get(f"/handovers/{team}/members").status_code == 403
    add = client.post(f"/handovers/{team}/members", json={"email": "outsider@example.com", "role": "incoming"})
    assert add.status_code == 403


def test_lead_lists_members(client, team):
    sign_in(client, "Kishan")
    members = client.get(f"/handovers/{team}/members").json()
    assert [(m["name"], m["role"]) for m in members] == [
        ("Kishan", "lead"),
        ("Asha", "departing"),
        ("Ravi", "incoming"),
    ]


def test_add_member_unknown_email_is_404(client, team):
    sign_in(client, "Kishan")
    response = client.post(f"/handovers/{team}/members", json={"email": "ghost@example.com", "role": "incoming"})
    assert response.status_code == 404


def test_add_member_twice_is_409(client, team):
    sign_in(client, "Kishan")
    response = client.post(f"/handovers/{team}/members", json={"email": "ravi@example.com", "role": "incoming"})
    assert response.status_code == 409


def test_add_member_rejects_bad_role(client, team):
    sign_in(client, "Kishan")
    response = client.post(f"/handovers/{team}/members", json={"email": "outsider@example.com", "role": "admin"})
    assert response.status_code == 422
