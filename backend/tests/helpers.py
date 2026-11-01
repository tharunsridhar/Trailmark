from pathlib import Path

PASSWORD = "correct-horse"
FIXTURES = Path(__file__).parent / "fixtures"


def make_user(client, name):
    email = f"{name.lower()}@example.com"
    client.post("/auth/register", json={"email": email, "name": name, "password": PASSWORD})
    client.post("/auth/logout")
    return email


def sign_in(client, name):
    email = f"{name.lower()}@example.com"
    response = client.post("/auth/login", json={"email": email, "password": PASSWORD})
    assert response.status_code == 200


def create_team(client):
    """Kishan leads a handover, Asha is leaving, Ravi is taking over. Returns the handover id."""
    for name in ("Kishan", "Asha", "Ravi", "Outsider"):
        make_user(client, name)

    sign_in(client, "Kishan")
    created = client.post("/handovers", json={"title": "Asha leaves", "project_name": "Campus App"})
    handover_id = created.json()["id"]
    client.post(f"/handovers/{handover_id}/members", json={"email": "asha@example.com", "role": "departing"})
    client.post(f"/handovers/{handover_id}/members", json={"email": "ravi@example.com", "role": "incoming"})
    client.post("/auth/logout")
    return handover_id


def upload(client, handover_id, source_type, filename, name=None, roles=("lead", "departing", "incoming")):
    """Uploads a fixture file as a source. Must be signed in as the lead."""
    import json

    return client.post(
        f"/handovers/{handover_id}/sources",
        data={"type": source_type, "name": name or filename, "allowed_roles": json.dumps(list(roles))},
        files={"file": (filename, (FIXTURES / filename).read_bytes())},
    )


class FakeLLM:
    """Plays back scripted replies in order: the extraction first, then the verifier.
    A reply that is an Exception is raised instead, to test failures."""

    def __init__(self, *replies):
        self.replies = list(replies)
        self.prompts = []

    def complete(self, system, user):
        import json

        self.prompts.append((system, user))
        reply = self.replies.pop(0)
        if isinstance(reply, Exception):
            raise reply
        return reply if isinstance(reply, str) else json.dumps(reply)


def piece_id(db, source_name, locator):
    from sqlalchemy import select

    from app.models import Source, SourcePiece

    return db.scalar(
        select(SourcePiece.id)
        .join(Source, Source.id == SourcePiece.source_id)
        .where(Source.name == source_name, SourcePiece.locator == locator)
    )


def good_replies(db):
    render = piece_id(db, "Team chat", "chat message 1")
    heroku = piece_id(db, "Design notes", "design.md paragraph 1")
    retry = piece_id(db, "Team chat", "chat message 3")
    t2 = piece_id(db, "Task list", "task T2")
    hr = piece_id(db, "HR chat", "chat message 2")

    extraction = {
        "statements": [
            {"kind": "decision", "text": "Hosting is on Render because the free tier is enough", "relation": "supported",
             "evidence": [{"piece_id": render, "quote": "go with Render, the free tier is enough"}]},
            {"kind": "decision", "text": "Sources disagree on the host", "relation": "conflicting",
             "evidence": [{"piece_id": render, "quote": "go with Render"},
                          {"piece_id": heroku, "quote": "We host the backend on Heroku"}]},
            {"kind": "risk", "text": "Payment retry keeps timing out", "relation": "supported",
             "evidence": [{"piece_id": retry, "quote": "keeps timing out"}]},
            {"kind": "decision", "text": "Deploys go to Fly.io", "relation": "supported",
             "evidence": [{"piece_id": render, "quote": "we deploy to Fly.io"}]},
        ],
        "gaps": [
            {"kind": "owner", "text": "Task T2 has no owner", "question": "Who owns the deploy guide (T2)?", "risk": 3,
             "evidence": [{"piece_id": t2, "quote": "owner: none"}]},
            {"kind": "contact", "text": "Who has the Render login is only in the HR chat", "risk": 2,
             "question": "Who holds the Render login?",
             "evidence": [{"piece_id": hr, "quote": "I have the Render account login"}]},
        ],
    }
    verifier = {"results": [{"id": 0, "verdict": "supported"}, {"id": 1, "verdict": "partly_supported"}]}
    return extraction, verifier
