import pytest
from sqlalchemy import select

from app.models import Answer, Statement
from tests.helpers import FakeLLM, good_replies, piece_id, sign_in

# statement ids after the scripted analysis, in order
RENDER, CONFLICT, RETRY, T2_GAP, HR_GAP = 1, 2, 3, 4, 5
# question ids: the task gap (risk 3) first, then the HR gap
Q_T2, Q_HR = 1, 2


@pytest.fixture
def analysed(client, loaded, db_session, use_llm):
    """A finished analysis, signed in as the lead (Kishan)."""
    use_llm(FakeLLM(*good_replies(db_session)))
    assert client.post(f"/handovers/{loaded}/analyze").status_code == 202
    return loaded


def login(client, name):
    client.post("/auth/logout")
    sign_in(client, name)


def statement(db, statement_id):
    db.expire_all()
    return db.get(Statement, statement_id)


def resolve_and_approve(client, handover_id, db):
    """Reject the weak claim, resolve the conflict, then approve."""
    client.post(f"/statements/{RETRY}/reject", json={"reason": "Not backed by anything solid"})
    chosen = piece_id(db, "Team chat", "chat message 1")
    client.post(f"/statements/{CONFLICT}/resolve", json={
        "chosen_piece_id": chosen, "reason": "The chat is newer than the design notes",
        "text": "Hosting is on Render",
    })
    return client.post(f"/handovers/{handover_id}/approve")


# --- answering ---------------------------------------------------------------

def test_answer_becomes_an_unverified_statement(client, analysed, db_session):
    login(client, "Asha")
    response = client.post(f"/questions/{Q_T2}/answer", json={"action": "answer", "text": "Ravi should take it, due Friday"})
    assert response.status_code == 200
    assert response.json()["status"] == "answered"

    db_session.expire_all()
    answer = db_session.scalar(select(Statement).where(Statement.kind == "answer"))
    assert answer.label == "unverified" and answer.status == "draft"
    assert answer.text == "Ravi should take it, due Friday"
    # it inherits the evidence that raised the question
    assert [(l.piece.locator, l.quote) for l in answer.sources] == [("task T2", "owner: none")]
    assert answer.versions[0].editor.name == "Asha"
    assert db_session.scalar(select(Answer)).statement_id == answer.id

    # the gap it covers stops showing as open
    assert statement(db_session, T2_GAP).status == "answered"


def test_answer_needs_text(client, analysed):
    login(client, "Asha")
    assert client.post(f"/questions/{Q_T2}/answer", json={"action": "answer"}).status_code == 422
    assert client.post(f"/questions/{Q_T2}/answer", json={"action": "answer", "text": "   "}).status_code == 422
    assert client.post(f"/questions/{Q_T2}/answer", json={"action": "dance"}).status_code == 422


def test_skipped_and_unknown_questions_stay_open_gaps(client, analysed, db_session):
    login(client, "Asha")
    skipped = client.post(f"/questions/{Q_T2}/answer", json={"action": "skip"})
    assert skipped.json()["status"] == "skipped"
    assert statement(db_session, T2_GAP).status == "draft"
    assert db_session.scalars(select(Statement).where(Statement.kind == "answer")).all() == []

    unknown = client.post(f"/questions/{Q_T2}/answer", json={"action": "unknown"})
    assert unknown.json()["status"] == "unknown"


def test_a_question_can_be_updated(client, analysed):
    login(client, "Asha")
    first = client.post(f"/questions/{Q_T2}/answer", json={"action": "answer", "text": "first"})
    assert first.status_code == 200
    again = client.post(f"/questions/{Q_T2}/answer", json={"action": "answer", "text": "second"})
    assert again.status_code == 200
    assert again.json()["answer"] == "second"


@pytest.mark.parametrize("who", ["Kishan", "Ravi", "Outsider"])
def test_only_the_departing_member_answers(client, analysed, who):
    login(client, who)
    response = client.post(f"/questions/{Q_T2}/answer", json={"action": "answer", "text": "hi"})
    assert response.status_code == 403


def test_unknown_question_is_403(client, analysed):
    login(client, "Asha")
    assert client.post("/questions/999/answer", json={"action": "skip"}).status_code == 403


def test_cannot_answer_a_question_built_from_restricted_evidence(client, analysed):
    login(client, "Asha")
    assert client.post(f"/questions/{Q_HR}/answer", json={"action": "skip"}).status_code == 403


def test_answering_needs_sign_in(client, analysed):
    client.post("/auth/logout")
    assert client.post(f"/questions/{Q_T2}/answer", json={"action": "skip"}).status_code == 401


# --- review ------------------------------------------------------------------

def test_lead_lists_and_filters_statements(client, analysed):
    everything = client.get(f"/handovers/{analysed}/statements").json()
    assert len(everything) == 5
    first = everything[0]
    assert first["label"] == "verified" and first["status"] == "draft"
    assert first["sources"][0]["quote"].startswith("go with Render")
    assert first["sources"][0]["source_name"] == "Team chat"

    assert len(client.get(f"/handovers/{analysed}/statements?label=missing").json()) == 2
    assert len(client.get(f"/handovers/{analysed}/statements?kind=risk").json()) == 1
    assert client.get(f"/handovers/{analysed}/statements?status=rejected").json() == []


@pytest.mark.parametrize("who", ["Asha", "Ravi", "Outsider"])
def test_only_the_lead_reviews(client, analysed, who):
    login(client, who)
    assert client.get(f"/handovers/{analysed}/statements").status_code == 403
    assert client.get(f"/statements/{RENDER}").status_code == 403
    assert client.get(f"/statements/{RENDER}/versions").status_code == 403
    assert client.patch(f"/statements/{RENDER}", json={"text": "hacked"}).status_code == 403
    assert client.post(f"/statements/{RENDER}/reject", json={"reason": "x"}).status_code == 403
    assert client.post(f"/handovers/{analysed}/approve").status_code == 403


def test_edit_saves_a_version_with_the_editor(client, analysed):
    response = client.patch(f"/statements/{RENDER}", json={"text": "Hosting is on Render (free tier)", "reason": "Added the plan"})
    assert response.status_code == 200
    assert response.json()["text"] == "Hosting is on Render (free tier)"
    assert response.json()["current_version"] == 2

    versions = client.get(f"/statements/{RENDER}/versions").json()
    assert [(v["version"], v["action"], v["editor"]) for v in versions] == [(2, "edited", "Kishan"), (1, "created", None)]
    assert versions[0]["reason"] == "Added the plan"
    # the old wording is still there
    assert versions[1]["text"].startswith("Hosting is on Render because")


def test_reject_needs_a_reason_and_keeps_history(client, analysed):
    assert client.post(f"/statements/{RETRY}/reject", json={}).status_code == 422
    assert client.post(f"/statements/{RETRY}/reject", json={"reason": ""}).status_code == 422

    response = client.post(f"/statements/{RETRY}/reject", json={"reason": "Nothing backs it"})
    assert response.json()["status"] == "rejected"
    assert client.post(f"/statements/{RETRY}/reject", json={"reason": "again"}).status_code == 409
    assert client.patch(f"/statements/{RETRY}", json={"text": "x"}).status_code == 409
    assert client.get(f"/statements/{RETRY}/versions").json()[0]["action"] == "rejected"


def test_resolving_a_conflict_needs_a_reason_and_a_real_source(client, analysed, db_session):
    chosen = piece_id(db_session, "Team chat", "chat message 1")
    assert client.post(f"/statements/{CONFLICT}/resolve", json={"chosen_piece_id": chosen}).status_code == 422
    unrelated = piece_id(db_session, "Task list", "task T1")
    bad = client.post(f"/statements/{CONFLICT}/resolve", json={"chosen_piece_id": unrelated, "reason": "x"})
    assert bad.status_code == 422


def test_resolving_keeps_the_other_source_marked_not_chosen(client, analysed, db_session):
    chosen = piece_id(db_session, "Team chat", "chat message 1")
    response = client.post(f"/statements/{CONFLICT}/resolve", json={
        "chosen_piece_id": chosen, "reason": "The chat is newer", "text": "Hosting is on Render",
    })
    body = response.json()
    assert body["label"] == "verified"
    assert body["text"] == "Hosting is on Render"
    assert sorted((s["locator"], s["chosen"]) for s in body["sources"]) == [
        ("chat message 1", True), ("design.md paragraph 1", False),
    ]
    history = client.get(f"/statements/{CONFLICT}/versions").json()
    assert history[0]["action"] == "resolved" and history[0]["reason"] == "The chat is newer"
    # only an open conflict can be resolved
    again = client.post(f"/statements/{CONFLICT}/resolve", json={"chosen_piece_id": chosen, "reason": "twice"})
    assert again.status_code == 409
    not_a_conflict = client.post(f"/statements/{RENDER}/resolve", json={"chosen_piece_id": chosen, "reason": "x"})
    assert not_a_conflict.status_code == 409


def test_accept_gap_only_on_open_gaps(client, analysed):
    assert client.post(f"/statements/{RENDER}/accept-gap", json={"reason": "x"}).status_code == 409
    assert client.post(f"/statements/{T2_GAP}/accept-gap", json={}).status_code == 422

    response = client.post(f"/statements/{T2_GAP}/accept-gap", json={"reason": "We will find out while working"})
    assert response.json()["status"] == "accepted_gap"
    assert response.json()["label"] == "missing"
    assert client.post(f"/statements/{T2_GAP}/accept-gap", json={"reason": "again"}).status_code == 409


# --- approval ----------------------------------------------------------------

def test_cannot_approve_before_an_analysis(client, team):
    sign_in(client, "Kishan")
    assert client.post(f"/handovers/{team}/approve").status_code == 409


def test_open_conflicts_block_approval(client, analysed):
    blocked = client.post(f"/handovers/{analysed}/approve")
    assert blocked.status_code == 409
    assert "1 conflict" in blocked.json()["detail"]
    assert client.get(f"/handovers/{analysed}").json()["status"] == "draft"


def test_rejecting_the_conflict_also_clears_the_block(client, analysed):
    client.post(f"/statements/{CONFLICT}/reject", json={"reason": "Not worth sharing"})
    assert client.post(f"/handovers/{analysed}/approve").status_code == 200


def test_approval_shares_the_kept_statements(client, analysed, db_session):
    response = resolve_and_approve(client, analysed, db_session)
    assert response.status_code == 200
    assert response.json()["status"] == "approved"
    assert response.json()["approved_at"] is not None

    assert statement(db_session, RENDER).status == "approved"
    assert statement(db_session, CONFLICT).status == "approved"
    assert statement(db_session, RETRY).status == "rejected"
    assert statement(db_session, RENDER).versions[-1].action == "approved"

    assert client.post(f"/handovers/{analysed}/approve").status_code == 409


def test_nothing_changes_after_approval(client, analysed, db_session):
    resolve_and_approve(client, analysed, db_session)
    assert client.patch(f"/statements/{RENDER}", json={"text": "late edit"}).status_code == 409
    assert client.post(f"/statements/{T2_GAP}/accept-gap", json={"reason": "late"}).status_code == 409
    login(client, "Asha")
    assert client.post(f"/questions/{Q_T2}/answer", json={"action": "skip"}).status_code == 409
    # the lead can still read the history
    login(client, "Kishan")
    assert client.get(f"/statements/{RENDER}/versions").status_code == 200


# --- the incoming member's view ------------------------------------------------

def test_view_is_blocked_until_approval(client, analysed):
    login(client, "Ravi")
    assert client.get(f"/handovers/{analysed}/handover-view").status_code == 409


def test_incoming_member_gets_only_what_they_may_see(client, analysed, db_session):
    login(client, "Asha")
    client.post(f"/questions/{Q_T2}/answer", json={"action": "answer", "text": "Ravi should take it, due Friday"})
    login(client, "Kishan")
    resolve_and_approve(client, analysed, db_session)

    login(client, "Ravi")
    view = client.get(f"/handovers/{analysed}/handover-view").json()
    assert view["handover"]["title"] == "Asha leaves"

    assert [d["text"] for d in view["decisions"]] == [
        "Hosting is on Render because the free tier is enough",
        "Hosting is on Render",
    ]
    # the claim the lead rejected is not shared
    assert view["risks"] == []
    # the leaver's own word is shared, and marked as unverified
    assert [(a["text"], a["label"]) for a in view["from_departing_member"]] == [
        ("Ravi should take it, due Friday", "unverified"),
    ]
    # the answered gap is no longer open, and the gap built from the lead-only HR chat is hidden
    assert view["open_questions"] == []
    assert "Render account login" not in str(view)

    # in a resolved conflict only the chosen source is shown
    resolved = view["decisions"][1]
    assert [(s["locator"], s["chosen"]) for s in resolved["sources"]] == [("chat message 1", True)]
    assert "Heroku" not in str(view)


def test_unanswered_gaps_show_as_open_questions(client, analysed, db_session):
    client.post(f"/statements/{T2_GAP}/accept-gap", json={"reason": "Will be found out later"})
    resolve_and_approve(client, analysed, db_session)

    login(client, "Ravi")
    view = client.get(f"/handovers/{analysed}/handover-view").json()
    assert [(q["text"], q["status"]) for q in view["open_questions"]] == [
        ("Task T2 has no owner", "accepted_gap"),
    ]


def test_skipped_gap_is_still_shown_as_open(client, analysed, db_session):
    login(client, "Asha")
    client.post(f"/questions/{Q_T2}/answer", json={"action": "skip"})
    login(client, "Kishan")
    resolve_and_approve(client, analysed, db_session)

    login(client, "Ravi")
    view = client.get(f"/handovers/{analysed}/handover-view").json()
    assert [(q["text"], q["status"]) for q in view["open_questions"]] == [("Task T2 has no owner", "approved")]


def test_lead_preview_matches_what_the_incoming_member_gets(client, analysed, db_session):
    resolve_and_approve(client, analysed, db_session)
    lead_view = client.get(f"/handovers/{analysed}/handover-view").json()
    login(client, "Ravi")
    incoming_view = client.get(f"/handovers/{analysed}/handover-view").json()
    assert lead_view == incoming_view
    assert "Render account login" not in str(lead_view)


def test_departing_member_and_outsiders_cannot_open_the_view(client, analysed, db_session):
    resolve_and_approve(client, analysed, db_session)
    for who in ("Asha", "Outsider"):
        login(client, who)
        assert client.get(f"/handovers/{analysed}/handover-view").status_code == 403


def test_view_sections_and_next_actions(client, loaded, db_session, use_llm):
    render = piece_id(db_session, "Team chat", "chat message 1")
    t1 = piece_id(db_session, "Task list", "task T1")
    ravi = piece_id(db_session, "Team chat", "chat message 2")

    def item(kind, text, piece, quote):
        return {"kind": kind, "text": text, "relation": "supported", "evidence": [{"piece_id": piece, "quote": quote}]}

    extraction = {"statements": [
        item("owner", "Asha owns the payment retry task", t1, "owner: Asha"),
        item("unfinished", "The payment retry fix is half done", t1, "notes: half done"),
        item("dependency", "Deploys depend on the Render account", ravi, "Render account login"),
        item("contact", "Ravi holds the Render login", ravi, "I have the Render account login"),
        item("next_action", "Finish the payment retry fix", t1, "Fix payment retry"),
        item("next_action", "Ask Ravi for the Render login", ravi, "Render account login"),
        item("blocker", "Retries time out on the free tier", render, "free tier"),
    ], "gaps": []}
    use_llm(FakeLLM(extraction, {"results": [{"id": i, "verdict": "supported"} for i in range(7)]}))
    client.post(f"/handovers/{loaded}/analyze")
    assert client.post(f"/handovers/{loaded}/approve").status_code == 200

    login(client, "Ravi")
    view = client.get(f"/handovers/{loaded}/handover-view").json()
    assert [s["text"] for s in view["owns"]] == ["Asha owns the payment retry task"]
    assert [s["text"] for s in view["unfinished"]] == ["The payment retry fix is half done"]
    assert [s["text"] for s in view["dependencies"]] == ["Deploys depend on the Render account"]
    assert [s["text"] for s in view["contacts"]] == ["Ravi holds the Render login"]
    assert [s["text"] for s in view["risks"]] == ["Retries time out on the free tier"]
    assert [(n["order"], n["text"]) for n in view["next_actions"]] == [
        (1, "Finish the payment retry fix"), (2, "Ask Ravi for the Render login"),
    ]
    assert view["next_actions"][0]["sources"][0]["locator"] == "task T1"
    assert view["receipt"] is None


def test_secrets_and_contact_details_are_redacted_for_the_incoming_member(client, analysed, db_session):
    note = "Reach ravi@campus.edu or +91 98765 43210, the password is hunter2"
    client.patch(f"/statements/{RENDER}", json={"text": note})
    resolve_and_approve(client, analysed, db_session)

    # the lead still sees the real text
    assert client.get(f"/statements/{RENDER}").json()["text"] == note

    login(client, "Ravi")
    shown = client.get(f"/handovers/{analysed}/handover-view").json()["decisions"][0]["text"]
    assert shown == "Reach [redacted email] or [redacted phone], the password is [redacted]"


# --- receipt -----------------------------------------------------------------

def test_receipt_flow(client, analysed, db_session):
    login(client, "Ravi")
    assert client.post(f"/handovers/{analysed}/receipt").status_code == 409
    assert client.get(f"/handovers/{analysed}/receipt").status_code == 404

    login(client, "Kishan")
    resolve_and_approve(client, analysed, db_session)
    assert client.get(f"/handovers/{analysed}/receipt").status_code == 404

    login(client, "Ravi")
    confirmed = client.post(f"/handovers/{analysed}/receipt")
    assert confirmed.status_code == 201
    assert confirmed.json()["user_name"] == "Ravi"
    assert client.post(f"/handovers/{analysed}/receipt").status_code == 409
    assert client.get(f"/handovers/{analysed}/receipt").json()["user_name"] == "Ravi"
    assert client.get(f"/handovers/{analysed}/handover-view").json()["receipt"]["user_name"] == "Ravi"

    login(client, "Kishan")
    assert client.get(f"/handovers/{analysed}/receipt").json()["user_name"] == "Ravi"


@pytest.mark.parametrize("who", ["Kishan", "Asha", "Outsider"])
def test_only_the_incoming_member_confirms_receipt(client, analysed, db_session, who):
    resolve_and_approve(client, analysed, db_session)
    login(client, who)
    assert client.post(f"/handovers/{analysed}/receipt").status_code == 403


def test_departing_member_cannot_read_the_receipt(client, analysed, db_session):
    resolve_and_approve(client, analysed, db_session)
    login(client, "Asha")
    assert client.get(f"/handovers/{analysed}/receipt").status_code == 403
