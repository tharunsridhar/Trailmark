import pytest
from sqlalchemy import select

from app.models import AnalysisRun, Question, Statement
from app.pipeline.llm import LLMError
from tests.helpers import FakeLLM, good_replies, sign_in, upload


def statements(db):
    db.expire_all()
    return {s.text: s for s in db.scalars(select(Statement)).all()}


def test_analysis_before_any_run(client, loaded):
    assert client.get(f"/handovers/{loaded}/analysis").json() == {
        "status": "not_started", "mode": None, "notice": None, "counts": None,
        "dropped": 0, "started_at": None, "finished_at": None,
    }


def test_ai_run_labels_and_drops(client, loaded, db_session, use_llm):
    use_llm(FakeLLM(*good_replies(db_session)))
    response = client.post(f"/handovers/{loaded}/analyze")
    assert response.status_code == 202

    run = client.get(f"/handovers/{loaded}/analysis").json()
    assert run["status"] == "done"
    assert run["mode"] == "ai"
    assert run["notice"] is None
    assert run["counts"] == {"verified": 1, "unverified": 1, "missing": 2, "conflicting": 1}
    # the Fly.io claim cited words that are not in the source
    assert run["dropped"] == 1

    found = statements(db_session)
    assert found["Hosting is on Render because the free tier is enough"].label == "verified"
    assert found["Payment retry keeps timing out"].label == "unverified"
    assert found["Sources disagree on the host"].label == "conflicting"
    assert "Deploys go to Fly.io" not in found
    # every statement starts as a draft with a first version
    assert {s.status for s in found.values()} == {"draft"}
    assert all(len(s.versions) == 1 and s.versions[0].action == "created" for s in found.values())
    assert all(s.sources for s in found.values() if s.label != "missing" or s.text == "Task T2 has no owner")


def test_gaps_become_questions_highest_risk_first(client, loaded, db_session, use_llm):
    use_llm(FakeLLM(*good_replies(db_session)))
    client.post(f"/handovers/{loaded}/analyze")

    questions = client.get(f"/handovers/{loaded}/questions").json()
    assert [q["text"] for q in questions] == ["Who owns the deploy guide (T2)?", "Who holds the Render login?"]
    first = questions[0]
    assert first["risk"] == 3 and first["status"] == "open"
    assert first["evidence"][0]["locator"] == "task T2"
    assert first["evidence"][0]["quote"] == "owner: none"


def test_departing_member_never_sees_restricted_evidence(client, loaded, db_session, use_llm):
    use_llm(FakeLLM(*good_replies(db_session)))
    client.post(f"/handovers/{loaded}/analyze")

    client.post("/auth/logout")
    sign_in(client, "Asha")
    questions = client.get(f"/handovers/{loaded}/questions").json()
    # the question built from the lead-only HR chat is hidden, along with its evidence
    assert [q["text"] for q in questions] == ["Who owns the deploy guide (T2)?"]
    assert "Render account login" not in str(questions)


def test_incoming_member_cannot_list_questions(client, loaded, db_session, use_llm):
    use_llm(FakeLLM(*good_replies(db_session)))
    client.post(f"/handovers/{loaded}/analyze")
    client.post("/auth/logout")
    sign_in(client, "Ravi")
    assert client.get(f"/handovers/{loaded}/questions").status_code == 403
    assert client.get(f"/handovers/{loaded}/analysis").status_code == 403


def test_only_the_lead_can_start_an_analysis(client, loaded):
    client.post("/auth/logout")
    sign_in(client, "Asha")
    assert client.post(f"/handovers/{loaded}/analyze").status_code == 403


def test_no_ai_and_no_saved_results_gives_basic_listing(client, loaded, db_session, use_llm):
    use_llm(None)
    client.post(f"/handovers/{loaded}/analyze")

    run = client.get(f"/handovers/{loaded}/analysis").json()
    assert run["status"] == "done" and run["mode"] == "basic"
    assert "AI unavailable" in run["notice"]

    found = statements(db_session)
    assert found["Asha owns task T1: Fix payment retry"].label == "verified"
    assert found["Task T1 'Fix payment retry' is not finished (status: in progress)"].kind == "unfinished"
    gap = found["Task T2 'Write deploy guide' has no owner recorded"]
    assert gap.label == "missing"
    # a finished task is not listed as unfinished
    assert not any("T3" in text and "not finished" in text for text in found)

    questions = db_session.scalars(select(Question)).all()
    assert any("Who should own task T2" in q.text for q in questions)


def test_ai_failure_falls_back_to_saved_results(client, loaded, db_session, use_llm):
    use_llm(FakeLLM(*good_replies(db_session)))
    client.post(f"/handovers/{loaded}/analyze")

    use_llm(FakeLLM(LLMError("service down")))
    client.post(f"/handovers/{loaded}/analyze")

    run = client.get(f"/handovers/{loaded}/analysis").json()
    assert run["mode"] == "saved"
    assert "saved results" in run["notice"]
    assert run["counts"] == {"verified": 1, "unverified": 1, "missing": 2, "conflicting": 1}
    assert statements(db_session)["Sources disagree on the host"].label == "conflicting"


def test_garbage_from_the_model_also_falls_back(client, loaded, db_session, use_llm):
    use_llm(FakeLLM("sorry, I cannot help with that"))
    client.post(f"/handovers/{loaded}/analyze")
    assert client.get(f"/handovers/{loaded}/analysis").json()["mode"] == "basic"


def test_rerun_replaces_the_previous_draft(client, loaded, db_session, use_llm):
    use_llm(FakeLLM(*good_replies(db_session)))
    client.post(f"/handovers/{loaded}/analyze")
    assert len(statements(db_session)) == 5

    use_llm(FakeLLM(*good_replies(db_session)))
    client.post(f"/handovers/{loaded}/analyze")

    # five again, not ten: the old draft was cleared, along with its questions
    assert len(statements(db_session)) == 5
    assert len(db_session.scalars(select(Question)).all()) == 2


def test_needs_a_readable_source(client, team):
    sign_in(client, "Kishan")
    assert client.post(f"/handovers/{team}/analyze").status_code == 409
    upload(client, team, "tasks", "empty_tasks.csv")
    assert client.post(f"/handovers/{team}/analyze").status_code == 409


def test_second_run_is_refused_while_one_is_running(client, loaded, db_session):
    db_session.add(AnalysisRun(handover_id=loaded, status="running"))
    db_session.commit()
    assert client.post(f"/handovers/{loaded}/analyze").status_code == 409


def test_approved_handover_cannot_be_reanalysed(client, loaded, db_session):
    from app.models import Handover

    db_session.get(Handover, loaded).status = "approved"
    db_session.commit()
    assert client.post(f"/handovers/{loaded}/analyze").status_code == 409
