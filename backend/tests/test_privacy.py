"""A statement with no source of its own cannot be proven safe, so the incoming member
never sees its text. These tests build the leak seen in the real run: a `missing` gap with
no source whose text names a lead-only location."""

import json

import pytest
from app.models import Question, Statement, StatementVersion
from tests.helpers import sign_in

LEAKY = "The contents of 'hr_private_notes paragraph 2' are not provided in the sources"
FORBIDDEN = ("hr_private_notes", "lead_private_chat", "paragraph 2", "salary", "Render account login")


def login(client, name):
    client.post("/auth/logout")
    sign_in(client, name)


@pytest.fixture
def leaky(client, loaded, db_session):
    """An approved handover with sourceless gaps that name restricted places, plus a normal one."""
    def add(kind, text, label, status, question=None):
        s = Statement(handover_id=loaded, kind=kind, text=text, label=label, status=status)
        db_session.add(s)
        db_session.flush()
        db_session.add(StatementVersion(statement_id=s.id, version=1, action="created", text=text, label=label))
        if question:
            db_session.add(Question(handover_id=loaded, gap_statement_id=s.id, text=question, risk=3))
        return s

    add("owner", LEAKY, "missing", "approved", question="What is in hr_private_notes paragraph 2?")
    add("contact", "lead_private_chat has the salary details", "missing", "accepted_gap")
    # a sourceless claim that is not a gap is never provable either
    add("decision", "Per hr_private_notes the salary is fixed", "unverified", "approved")
    db_session.commit()
    client.post(f"/handovers/{loaded}/approve")
    return loaded


def assert_clean(payload):
    blob = json.dumps(payload)
    for word in FORBIDDEN:
        assert word not in blob, word


def test_incoming_view_has_no_restricted_names(client, leaky):
    login(client, "Ravi")
    response = client.get(f"/handovers/{leaky}/handover-view")
    assert response.status_code == 200
    assert_clean(response.json())


def test_sourceless_gap_becomes_a_neutral_gap(client, leaky):
    login(client, "Ravi")
    view = client.get(f"/handovers/{leaky}/handover-view").json()
    texts = [q["text"] for q in view["open_questions"]]
    assert texts == ["Something is not documented here"] * 2
    assert all(q["sources"] == [] and q["label"] == "missing" for q in view["open_questions"])
    # the sourceless claim that is not a gap is hidden, not shown
    assert not any("salary" in json.dumps(s) for s in view["decisions"])


def test_lead_preview_matches_incoming(client, leaky):
    login(client, "Kishan")
    lead_view = client.get(f"/handovers/{leaky}/handover-view").json()
    assert_clean(lead_view)
    login(client, "Ravi")
    assert client.get(f"/handovers/{leaky}/handover-view").json() == lead_view


def test_incoming_member_receipt_is_clean(client, leaky):
    login(client, "Ravi")
    assert client.post(f"/handovers/{leaky}/receipt").status_code == 201
    assert_clean(client.get(f"/handovers/{leaky}/receipt").json())
    assert_clean(client.get(f"/handovers/{leaky}/handover-view").json())


def test_lead_sees_everything(client, leaky):
    login(client, "Kishan")
    statements = client.get(f"/handovers/{leaky}/statements").json()
    assert LEAKY in [s["text"] for s in statements]
    first = next(s for s in statements if s["text"] == LEAKY)
    versions = client.get(f"/statements/{first['id']}/versions").json()
    assert versions[0]["text"] == LEAKY
    questions = client.get(f"/handovers/{leaky}/questions").json()
    assert any("hr_private_notes" in q["text"] for q in questions)


def test_departing_member_sees_only_their_questions(client, leaky):
    login(client, "Asha")
    questions = client.get(f"/handovers/{leaky}/questions").json()
    # the sourceless question could name a restricted place, so it is not shown
    assert_clean(questions)
    assert all(q["evidence"] for q in questions)
    assert client.get(f"/handovers/{leaky}/statements").status_code == 403
    assert client.get(f"/handovers/{leaky}/handover-view").status_code == 403
    hidden = db_question_id(client, leaky)
    assert client.post(f"/questions/{hidden}/answer", json={"action": "answer", "text": "x"}).status_code == 403


def db_question_id(client, handover_id):
    login(client, "Kishan")
    questions = client.get(f"/handovers/{handover_id}/questions").json()
    login(client, "Asha")
    return next(q["id"] for q in questions if "hr_private_notes" in q["text"])


@pytest.mark.parametrize("path", ["statements", "questions"])
def test_incoming_member_cannot_use_lead_or_leaver_lists(client, leaky, path):
    login(client, "Ravi")
    assert client.get(f"/handovers/{leaky}/{path}").status_code == 403


def test_outsider_sees_nothing(client, leaky):
    login(client, "Outsider")
    assert client.get(f"/handovers/{leaky}/handover-view").status_code == 403
    assert client.get(f"/handovers/{leaky}/questions").status_code == 403
