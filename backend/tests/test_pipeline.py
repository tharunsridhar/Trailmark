from types import SimpleNamespace

import pytest

from app.pipeline.analyze import Draft, Evidence, analyze, parse_json, quote_in_piece
from app.pipeline.llm import AnthropicClient, ChatCompletionsClient, LLMError, build_llm
from tests.helpers import FakeLLM


def piece(piece_id, content, locator="chat message 1"):
    return SimpleNamespace(id=piece_id, content=content, locator=locator, source=SimpleNamespace(name="Team chat"))


PIECES = [
    piece(1, "[t] Asha: Let's go with Render, the free tier is enough for now"),
    piece(2, "We host the backend on Heroku because it is simple", "design.md paragraph 1"),
]


def statement(**overrides):
    base = {
        "kind": "decision",
        "text": "Hosting is on Render",
        "relation": "supported",
        "evidence": [{"piece_id": 1, "quote": "go with Render"}],
    }
    return {**base, **overrides}


def verdict(*verdicts):
    return {"results": [{"id": i, "verdict": v} for i, v in enumerate(verdicts)]}


def test_quote_match_ignores_only_spacing():
    p = piece(1, "Asha:  go   with\nRender")
    assert quote_in_piece("go with Render", p)
    assert not quote_in_piece("go with render", p)
    assert not quote_in_piece("", p)


def test_supported_claim_with_real_quote_is_verified():
    llm = FakeLLM({"statements": [statement()], "gaps": []}, verdict("supported"))
    result = analyze(llm, PIECES)
    assert [(d.label, d.text) for d in result.drafts] == [("verified", "Hosting is on Render")]
    assert result.drafts[0].evidence[0].quote == "go with Render"
    assert result.dropped == 0


def test_claim_only_stays_unverified_and_skips_the_verifier():
    llm = FakeLLM({"statements": [statement(relation="claim_only")], "gaps": []})
    result = analyze(llm, PIECES)
    assert [(d.label, d.text) for d in result.drafts] == [("unverified", "Hosting is on Render")]
    # the claim never reaches the verifier: the second request is the top-up for the uncited paragraph
    assert not any("Claim:" in user for _, user in llm.prompts)


TWO_SOURCES = [
    SimpleNamespace(id=1, content="Asha: we go with Render", locator="chat message 1", source=SimpleNamespace(name="Chat")),
    SimpleNamespace(id=2, content="Bonus is tied to signoff", locator="notes paragraph 1", source=SimpleNamespace(name="Notes")),
]


def test_skipped_source_gets_its_own_second_request():
    first = {"statements": [statement(evidence=[{"piece_id": 1, "quote": "go with Render"}])], "gaps": []}
    second = {"statements": [statement(text="Bonus depends on signoff", relation="claim_only",
                                       evidence=[{"piece_id": 2, "quote": "tied to signoff"}])], "gaps": []}
    llm = FakeLLM(first, verdict("supported"), second)
    result = analyze(llm, TWO_SOURCES)
    assert [d.text for d in result.drafts] == ["Hosting is on Render", "Bonus depends on signoff"]
    # the second request only contains the source the first one skipped
    assert "Bonus is tied to signoff" in llm.prompts[2][1]
    assert "we go with Render" not in llm.prompts[2][1]


def test_uncited_document_paragraph_gets_its_own_request():
    first = {"statements": [statement()], "gaps": []}
    top_up = {"statements": [statement(text="Hosting is on Heroku", evidence=[{"piece_id": 2, "quote": "host the backend on Heroku"}])], "gaps": []}
    llm = FakeLLM(first, verdict("supported"), top_up, verdict("supported"))
    result = analyze(llm, PIECES)
    assert [d.text for d in result.drafts] == ["Hosting is on Render", "Hosting is on Heroku"]
    # only the paragraph nothing cited is sent again, not the chat message that was covered
    assert "We host the backend on Heroku" in llm.prompts[2][1]
    assert "go with Render" not in llm.prompts[2][1]


def test_failed_paragraph_request_keeps_the_first_results():
    first = {"statements": [statement()], "gaps": []}
    llm = FakeLLM(first, verdict("supported"), LLMError("down"))
    result = analyze(llm, PIECES)
    assert [d.text for d in result.drafts] == ["Hosting is on Render"]


def test_failed_second_request_keeps_the_first_results():
    first = {"statements": [statement(evidence=[{"piece_id": 1, "quote": "go with Render"}])], "gaps": []}
    llm = FakeLLM(first, verdict("supported"), LLMError("down"))
    result = analyze(llm, TWO_SOURCES)
    assert [d.text for d in result.drafts] == ["Hosting is on Render"]


def test_fabricated_quote_drops_the_claim():
    fake = statement(evidence=[{"piece_id": 1, "quote": "we deploy on Fly.io"}])
    llm = FakeLLM({"statements": [fake], "gaps": []}, verdict())
    result = analyze(llm, PIECES)
    assert result.drafts == []
    assert result.dropped == 1


def test_unknown_piece_id_drops_the_claim():
    fake = statement(evidence=[{"piece_id": 99, "quote": "go with Render"}])
    result = analyze(FakeLLM({"statements": [fake], "gaps": []}, verdict()), PIECES)
    assert result.drafts == [] and result.dropped == 1


def test_partly_or_not_supported_stays_unverified():
    two = [statement(), statement(text="Second claim")]
    llm = FakeLLM({"statements": two, "gaps": []}, verdict("partly_supported", "not_supported"))
    labels = [d.label for d in analyze(llm, PIECES).drafts]
    assert labels == ["unverified", "unverified"]


def test_missing_verdict_stays_unverified():
    llm = FakeLLM({"statements": [statement()], "gaps": []}, {"results": []})
    assert analyze(llm, PIECES).drafts[0].label == "unverified"


def test_conflict_needs_two_real_pieces():
    both = statement(
        relation="conflicting",
        evidence=[{"piece_id": 1, "quote": "go with Render"}, {"piece_id": 2, "quote": "host the backend on Heroku"}],
    )
    result = analyze(FakeLLM({"statements": [both], "gaps": []}, verdict()), PIECES)
    assert result.drafts[0].label == "conflicting"
    assert len(result.drafts[0].evidence) == 2


def test_one_sided_conflict_goes_through_the_verifier():
    one_sided = statement(relation="conflicting")
    result = analyze(FakeLLM({"statements": [one_sided], "gaps": []}, verdict("supported")), PIECES)
    assert result.drafts[0].label == "verified"


def test_gap_becomes_missing_with_a_question():
    gap = {
        "kind": "owner",
        "text": "Nobody owns the deploy guide",
        "question": "Who should own the deploy guide?",
        "risk": 3,
        "evidence": [{"piece_id": 1, "quote": "go with Render"}, {"piece_id": 1, "quote": "made up words"}],
    }
    result = analyze(FakeLLM({"statements": [], "gaps": [gap]}, verdict()), PIECES)
    draft = result.drafts[0]
    assert draft.label == "missing"
    assert draft.question == "Who should own the deploy guide?"
    assert draft.risk == 3
    # the bad quote is ignored, the gap itself is kept
    assert [e.piece_id for e in draft.evidence] == [1]


def test_gap_without_question_gets_a_plain_one_and_risk_is_clamped():
    gap = {"kind": "risk", "text": "Backups are unclear", "risk": 9, "evidence": []}
    draft = analyze(FakeLLM({"statements": [], "gaps": [gap]}, verdict()), PIECES).drafts[0]
    assert draft.question.startswith("Can you tell us more")
    assert draft.risk == 3


def test_unknown_kind_is_dropped():
    odd = statement(kind="gossip")
    result = analyze(FakeLLM({"statements": [odd], "gaps": []}, verdict()), PIECES)
    assert result.drafts == [] and result.dropped == 1


def test_extraction_cannot_make_answer_statements():
    answer = statement(kind="answer")
    assert analyze(FakeLLM({"statements": [answer], "gaps": []}, verdict()), PIECES).dropped == 1


@pytest.mark.parametrize("reply", ["no json here", "{broken", "[1, 2]"])
def test_bad_model_output_raises(reply):
    with pytest.raises(LLMError):
        analyze(FakeLLM(reply), PIECES)


def test_parse_json_handles_code_fences():
    assert parse_json('```json\n{"a": 1}\n```') == {"a": 1}


def test_wrong_shape_raises():
    with pytest.raises(LLMError):
        analyze(FakeLLM({"statements": "nope", "gaps": []}), PIECES)


class FakeResponse:
    def __init__(self, status_code, body=None, headers=None):
        self.status_code = status_code
        self._body = body or {}
        self.headers = headers or {}

    def json(self):
        return self._body


def ok(text):
    return FakeResponse(200, {"content": [{"type": "text", "text": text}]})


def test_client_retries_then_succeeds(monkeypatch):
    calls = []

    def fake_post(url, **kwargs):
        calls.append(kwargs["json"]["model"])
        return FakeResponse(529) if len(calls) == 1 else ok("fine")

    monkeypatch.setattr("app.pipeline.llm.httpx.post", fake_post)
    monkeypatch.setattr(AnthropicClient, "sleep", staticmethod(lambda s: None))
    assert AnthropicClient("key", ["main"]).complete("sys", "user") == "fine"
    assert calls == ["main", "main"]


def test_client_falls_back_to_second_model(monkeypatch):
    calls = []

    def fake_post(url, **kwargs):
        calls.append(kwargs["json"]["model"])
        return FakeResponse(500) if kwargs["json"]["model"] == "main" else ok("from backup")

    monkeypatch.setattr("app.pipeline.llm.httpx.post", fake_post)
    monkeypatch.setattr(AnthropicClient, "sleep", staticmethod(lambda s: None))
    assert AnthropicClient("key", ["main", "backup"]).complete("s", "u") == "from backup"
    assert calls == ["main", "main", "backup"]


def test_client_gives_up_with_llm_error(monkeypatch):
    monkeypatch.setattr("app.pipeline.llm.httpx.post", lambda url, **kw: FakeResponse(500))
    monkeypatch.setattr(AnthropicClient, "sleep", staticmethod(lambda s: None))
    with pytest.raises(LLMError):
        AnthropicClient("key", ["main"]).complete("s", "u")


def chat_reply(text):
    return FakeResponse(200, {"choices": [{"message": {"content": text}}]})


def test_groq_client_sends_chat_format_and_reads_reply(monkeypatch):
    seen = {}

    def fake_post(url, **kwargs):
        seen["url"] = url
        seen["headers"] = kwargs["headers"]
        seen["body"] = kwargs["json"]
        return chat_reply("hello")

    monkeypatch.setattr("app.pipeline.llm.httpx.post", fake_post)
    assert ChatCompletionsClient("gsk_test", ["main"]).complete("be brief", "hi") == "hello"
    assert seen["url"].endswith("/chat/completions")
    assert seen["headers"]["Authorization"] == "Bearer gsk_test"
    assert seen["body"]["messages"] == [
        {"role": "system", "content": "be brief"},
        {"role": "user", "content": "hi"},
    ]


def test_reasoning_effort_is_sent_only_when_set(monkeypatch):
    bodies = []

    def fake_post(url, **kwargs):
        bodies.append(kwargs["json"])
        return chat_reply("ok")

    monkeypatch.setattr("app.pipeline.llm.httpx.post", fake_post)
    ChatCompletionsClient("k", ["m"], reasoning_effort="low").complete("s", "u")
    ChatCompletionsClient("k", ["m"]).complete("s", "u")
    assert bodies[0]["reasoning_effort"] == "low"
    assert "reasoning_effort" not in bodies[1]


def test_groq_client_strips_reasoning_block(monkeypatch):
    monkeypatch.setattr(
        "app.pipeline.llm.httpx.post", lambda url, **kw: chat_reply("<think>let me see\nhmm</think>\n{\"a\": 1}")
    )
    assert ChatCompletionsClient("k", ["main"]).complete("s", "u") == '{"a": 1}'


def test_groq_client_waits_after_rate_limit_then_succeeds(monkeypatch):
    waits = []
    replies = [FakeResponse(429, headers={"retry-after": "7"}), chat_reply("fine")]
    monkeypatch.setattr("app.pipeline.llm.httpx.post", lambda url, **kw: replies.pop(0))
    monkeypatch.setattr(ChatCompletionsClient, "sleep", staticmethod(waits.append))
    assert ChatCompletionsClient("k", ["main"]).complete("s", "u") == "fine"
    assert waits == [7]


def test_groq_rate_limit_wait_is_capped(monkeypatch):
    waits = []
    replies = [FakeResponse(429, headers={"retry-after": "600"}), chat_reply("fine")]
    monkeypatch.setattr("app.pipeline.llm.httpx.post", lambda url, **kw: replies.pop(0))
    monkeypatch.setattr(ChatCompletionsClient, "sleep", staticmethod(waits.append))
    ChatCompletionsClient("k", ["main"]).complete("s", "u")
    assert waits == [20]


def test_groq_client_odd_reply_shape_is_an_error(monkeypatch):
    monkeypatch.setattr("app.pipeline.llm.httpx.post", lambda url, **kw: FakeResponse(200, {"choices": []}))
    monkeypatch.setattr(ChatCompletionsClient, "sleep", staticmethod(lambda s: None))
    with pytest.raises(LLMError):
        ChatCompletionsClient("k", ["main"]).complete("s", "u")


def test_build_llm_picks_client_from_provider(monkeypatch):
    def settings(**overrides):
        base = dict(llm_api_key="k", llm_provider="anthropic", llm_model="m", llm_fallback_model="", llm_base_url="",
                    llm_reasoning_effort="low")
        return SimpleNamespace(**{**base, **overrides})

    monkeypatch.setattr("app.pipeline.llm.get_settings", lambda: settings(llm_provider="groq", llm_fallback_model="b"))
    client = build_llm()
    assert isinstance(client, ChatCompletionsClient) and client.models == ["m", "b"]
    assert client.base_url.startswith("https://api.groq.com")

    monkeypatch.setattr("app.pipeline.llm.get_settings", lambda: settings(llm_provider="gemini"))
    gemini = build_llm()
    assert isinstance(gemini, ChatCompletionsClient) and "generativelanguage.googleapis.com" in gemini.base_url

    monkeypatch.setattr("app.pipeline.llm.get_settings", lambda: settings())
    assert isinstance(build_llm(), AnthropicClient)

    monkeypatch.setattr("app.pipeline.llm.get_settings", lambda: settings(llm_api_key=""))
    assert build_llm() is None


def chat_piece(piece_id, sender, text):
    return SimpleNamespace(
        id=piece_id, content=f"[t] {sender}: {text}", locator=f"chat message {piece_id}",
        source=SimpleNamespace(name="Chat", type="chat"),
    )


def test_claim_only_the_leaver_makes_in_chat_cannot_be_verified():
    pieces = [chat_piece(1, "Asha", "I stress-tested the scanner to 5,000 scans a minute")]
    claim = statement(text="The scanner was stress-tested to 5,000 scans a minute",
                      evidence=[{"piece_id": 1, "quote": "stress-tested the scanner to 5,000 scans"}])
    result = analyze(FakeLLM({"statements": [claim], "gaps": []}, verdict("supported")), pieces, leavers=["Asha Menon"])
    assert result.drafts[0].label == "unverified"


def test_leaver_claim_backed_by_another_person_or_a_document_stays_verified():
    pieces = [
        chat_piece(1, "Asha", "We go with Render"),
        chat_piece(2, "Deepak", "Agreed, Render it is"),
        SimpleNamespace(id=3, content="Hosting is on Render", locator="notes paragraph 1",
                        source=SimpleNamespace(name="Notes", type="doc")),
    ]
    two_people = statement(evidence=[{"piece_id": 1, "quote": "go with Render"}, {"piece_id": 2, "quote": "Render it is"}])
    with_doc = statement(text="Hosting is on Render (doc)", evidence=[{"piece_id": 1, "quote": "go with Render"},
                                                                       {"piece_id": 3, "quote": "Hosting is on Render"}])
    llm = FakeLLM({"statements": [two_people, with_doc], "gaps": []}, verdict("supported", "supported"))
    result = analyze(llm, pieces, leavers=["Asha"])
    assert [d.label for d in result.drafts] == ["verified", "verified"]


def test_without_a_known_leaver_nothing_is_downgraded():
    pieces = [chat_piece(1, "Asha", "We go with Render")]
    claim = statement(evidence=[{"piece_id": 1, "quote": "go with Render"}])
    result = analyze(FakeLLM({"statements": [claim], "gaps": []}, verdict("supported")), pieces)
    assert result.drafts[0].label == "verified"


def test_leaver_chat_messages_get_their_own_request_and_stay_unverified():
    pieces = [
        chat_piece(1, "Asha", "I stress-tested the scanner to 5,000 scans a minute"),
        chat_piece(2, "Deepak", "Please remember to renew the domain"),
    ]
    main = {"statements": [], "gaps": []}
    claims = {"statements": [statement(text="The scanner was stress-tested to 5,000 scans a minute", relation="claim_only",
                                       evidence=[{"piece_id": 1, "quote": "stress-tested the scanner"}])], "gaps": []}
    # the main request found nothing, so the skipped source is asked again before the claims request
    llm = FakeLLM(main, {"statements": [], "gaps": []}, claims)
    result = analyze(llm, pieces, leavers=["Asha"])
    assert [(d.label, d.text) for d in result.drafts] == [("unverified", "The scanner was stress-tested to 5,000 scans a minute")]
    # only the leaver's own message is sent in the claims request
    assert "stress-tested the scanner" in llm.prompts[2][1] and "renew the domain" not in llm.prompts[2][1]


def test_claim_already_covered_is_not_repeated_and_a_failed_claims_request_is_ignored():
    pieces = [chat_piece(1, "Asha", "I stress-tested the scanner to 5,000 scans a minute")]
    covered = statement(text="Scanner stress test", evidence=[{"piece_id": 1, "quote": "stress-tested the scanner"}])
    again = statement(text="Stress-tested the scanner", relation="claim_only",
                      evidence=[{"piece_id": 1, "quote": "stress-tested the scanner"}])
    llm = FakeLLM({"statements": [covered], "gaps": []}, verdict("supported"), {"statements": [again], "gaps": []})
    assert len(analyze(llm, pieces, leavers=["Asha"]).drafts) == 1

    failing = FakeLLM({"statements": [covered], "gaps": []}, verdict("supported"), LLMError("down"))
    assert len(analyze(failing, pieces, leavers=["Asha"]).drafts) == 1


# ---- rules in code (rules.py) ----


def repo_piece(piece_id, sha, message, author="Asha"):
    return SimpleNamespace(
        id=piece_id, content=f"Commit {sha} by {author} on 2026-08-01: {message}", locator=f"commit {sha}",
        meta={"kind": "commit", "author": author}, source=SimpleNamespace(name="Repo", type="repo"),
    )


def run_rules(pieces, drafts=()):
    from app.pipeline.analyze import apply_rules

    return apply_rules(pieces, {p.id: p for p in pieces}, list(drafts))


def test_token_lifetime_values_that_differ_become_a_conflict_with_both_sources():
    pieces = [
        repo_piece(1, "c18d402", "Set ACCESS_TOKEN_EXPIRE_MINUTES = 60 for student sessions"),
        chat_piece(2, "Deepak", "Wait, all student JWT tokens must strictly expire after 15 minutes."),
    ]
    conflicts = [d for d in run_rules(pieces) if d.label == "conflicting"]
    assert len(conflicts) == 1
    assert {e.piece_id for e in conflicts[0].evidence} == {1, 2}
    assert all(quote_in_piece(e.quote, pieces[e.piece_id - 1]) for e in conflicts[0].evidence)
    assert "60 minutes" in conflicts[0].text and "15 minutes" in conflicts[0].text


def test_same_value_in_two_sources_and_one_message_naming_both_are_not_conflicts():
    same = [chat_piece(1, "A", "Tokens expire after 60 minutes."), chat_piece(2, "B", "JWT lifetime is 1 hours.")]
    assert not [d for d in run_rules(same) if d.label == "conflicting"]
    discussion = [
        SimpleNamespace(id=3, content="[t] B: T08 says the QR is a UUID but the doc says QR is an HMAC token",
                        locator="chat message 3", meta={}, source=SimpleNamespace(name="Chat", type="chat")),
        SimpleNamespace(id=4, content="QR codes use UUID v4 strings", locator="task T08", meta={},
                        source=SimpleNamespace(name="Tasks", type="tasks")),
    ]
    assert not [d for d in run_rules(discussion) if d.label == "conflicting"]


def test_capacity_and_qr_format_conflicts_are_found_and_not_repeated_when_the_model_found_them():
    pieces = [
        SimpleNamespace(id=1, content="Pull request #5 'Auditorium limit' (open): Limits auditorium bookings to 350 seats.",
                        locator="PR #5", meta={}, source=SimpleNamespace(name="Repo", type="repo")),
        SimpleNamespace(id=2, content="The auditorium capacity is hard-capped at 500 attendees.",
                        locator="architecture.md paragraph 2", meta={}, source=SimpleNamespace(name="Docs", type="doc")),
    ]
    found = [d for d in run_rules(pieces) if d.label == "conflicting"]
    assert len(found) == 1 and "350" in found[0].text and "500" in found[0].text
    model_made = Draft("decision", "Capacity differs", "conflicting",
                       [Evidence(1, "Limits auditorium bookings to 350 seats"), Evidence(2, "hard-capped at 500 attendees")])
    assert len([d for d in run_rules(pieces, [model_made]) if d.label == "conflicting"]) == 1


def test_unexplained_commit_becomes_a_missing_gap_with_a_question():
    pieces = [
        repo_piece(1, "f710a34", "Import campus_sms_sdk for automated SMS ticket dispatch"),
        chat_piece(2, "Asha", "Imported campus_sms_sdk in commit f710a34 to dispatch SMS."),
        chat_piece(3, "Ravi", "Where are the keys for campus_sms_sdk? It is failing in staging."),
    ]
    gaps = [d for d in run_rules(pieces) if d.label == "missing"]
    assert len(gaps) == 1
    assert gaps[0].question and "f710a34" in gaps[0].question
    assert [e.piece_id for e in gaps[0].evidence] == [1] and gaps[0].risk == 3


def test_commit_explained_by_another_source_or_already_a_gap_is_not_flagged_again():
    commit = repo_piece(1, "e4b1029", "Store JWT in HTTP-only cookies instead of localStorage to prevent credential theft")
    pr = SimpleNamespace(id=2, content="Pull request #3 (merged): Replaces localStorage token storage with HTTP-only cookies to protect credential theft",
                         locator="PR #3", meta={"kind": "PR"}, source=SimpleNamespace(name="Repo", type="repo"))
    assert not [d for d in run_rules([commit, pr]) if d.label == "missing"]
    named_by_colleague = [repo_piece(1, "b1b1b1b", "Tweak scanner retry"), chat_piece(2, "Ravi", "b1b1b1b made the scanner retry, fine by me")]
    assert not [d for d in run_rules(named_by_colleague) if d.label == "missing"]
    already = Draft("risk", "SMS", "missing", [Evidence(1, "Import campus_sms_sdk")], question="Why?")
    alone = [repo_piece(1, "f710a34", "Import campus_sms_sdk for automated SMS ticket dispatch")]
    assert len([d for d in run_rules(alone, [already]) if d.label == "missing"]) == 1


def test_statement_citing_a_conflict_source_is_merged_or_no_longer_verified():
    pieces = [
        SimpleNamespace(id=1, content="Pull request #5: Limits auditorium bookings to 350 seats.", locator="PR #5", meta={},
                        source=SimpleNamespace(name="Repo", type="repo")),
        SimpleNamespace(id=2, content="The auditorium capacity is hard-capped at 500 attendees. Doors open at 9.",
                        locator="architecture.md paragraph 2", meta={}, source=SimpleNamespace(name="Docs", type="doc")),
        SimpleNamespace(id=3, content="Ops runbook: doors open at 9", locator="runbook paragraph 1", meta={},
                        source=SimpleNamespace(name="Docs", type="doc")),
    ]
    repeat = Draft("decision", "The conflict, restated", "verified", [Evidence(1, "350 seats"), Evidence(2, "500 attendees")])
    one_side = Draft("decision", "Doors open at 9", "verified", [Evidence(2, "Doors open at 9"), Evidence(3, "doors open at 9")])
    unrelated = Draft("decision", "Doors", "verified", [Evidence(3, "doors open at 9")])
    out = run_rules(pieces, [repeat, one_side, unrelated])
    assert [(d.text, d.label) for d in out if d.label != "conflicting"] == [("Doors open at 9", "unverified"), ("Doors", "verified")]


def test_routine_commits_are_not_listed_as_decisions_but_real_choices_stay():
    pieces = [
        repo_piece(1, "5be7c10", "Fix typo in registration confirmation email template"),
        repo_piece(2, "a90d3e4", "Pin celery version in requirements"),
        repo_piece(3, "e08b5c9", "Switch the session store to Redis"),
    ]
    drafts = [Draft("decision", f"Decision {i}", "verified", [Evidence(i, pieces[i - 1].content)]) for i in (1, 2, 3)]
    kept = [d.text for d in run_rules(pieces, drafts) if d.kind == "decision"]
    assert kept == ["Decision 3"]


def test_rules_never_make_a_statement_verified_or_touch_leaver_only_claims():
    pieces = [chat_piece(1, "Asha", "I stress-tested the scanner to 5,000 scans a minute")]
    claim = Draft("decision", "Stress tested", "unverified", [Evidence(1, "stress-tested the scanner")])
    assert [d.label for d in run_rules(pieces, [claim])] == ["unverified"]


def test_task_owned_by_the_leaver_does_not_back_up_their_chat_message():
    task = SimpleNamespace(id=2, content="T06 Integrate student email verification endpoint, owner: Asha, status: done",
                           locator="task T06", meta={"owner": "Asha"}, source=SimpleNamespace(name="Tasks", type="tasks"))
    chat = chat_piece(1, "Asha", "The Google OAuth client secret was locked to campus domains")
    claim = statement(text="OAuth is locked to campus domains",
                      evidence=[{"piece_id": 1, "quote": "OAuth client secret was locked"}, {"piece_id": 2, "quote": "status: done"}])
    result = analyze(FakeLLM({"statements": [claim], "gaps": []}, verdict("supported")), [chat, task], leavers=["Asha"])
    assert result.drafts[0].label == "unverified"
    other_owner = SimpleNamespace(**{**task.__dict__, "meta": {"owner": "Ravi"}})
    result = analyze(FakeLLM({"statements": [claim], "gaps": []}, verdict("supported")), [chat, other_owner], leavers=["Asha"])
    assert result.drafts[0].label == "verified"


def test_conflict_shows_up_to_two_pieces_on_each_side():
    pieces = [
        repo_piece(1, "993c10a", "Implement QR code encoding using UUID v4 identifier"),
        SimpleNamespace(id=2, content="T08 QR codes use UUID v4 strings", locator="task T08", meta={"owner": "Asha"},
                        source=SimpleNamespace(name="Tasks", type="tasks")),
        SimpleNamespace(id=3, content="All ticket QR codes encode a signed HMAC-SHA256 JSON token.", locator="a.md paragraph 3",
                        meta={}, source=SimpleNamespace(name="Docs", type="doc")),
    ]
    conflict = [d for d in run_rules(pieces) if d.label == "conflicting"][0]
    assert [e.piece_id for e in conflict.evidence] == [1, 2, 3]


# ---- less variance between runs ----


def test_both_clients_ask_for_temperature_zero(monkeypatch):
    bodies = []

    def fake_post(url, **kwargs):
        bodies.append(kwargs["json"])
        return ok("x") if "messages" in url else chat_reply("x")

    monkeypatch.setattr("app.pipeline.llm.httpx.post", fake_post)
    AnthropicClient("k", ["m"]).complete("s", "u")
    ChatCompletionsClient("k", ["m"]).complete("s", "u")
    assert [b["temperature"] for b in bodies] == [0, 0]


def test_pieces_reach_the_model_in_the_same_order_whatever_order_they_arrive_in():
    pieces = [chat_piece(3, "Ravi", "third"), chat_piece(1, "Asha", "first"), chat_piece(2, "Ravi", "second")]
    llm = FakeLLM({"statements": [], "gaps": []})
    analyze(llm, pieces)
    prompt = llm.prompts[0][1]
    assert prompt.index("first") < prompt.index("second") < prompt.index("third")


def task_piece(piece_id, text):
    return SimpleNamespace(id=piece_id, content=text, locator=f"task T{piece_id}", meta={"owner": "Ravi"},
                           source=SimpleNamespace(name="Tasks", type="tasks"))


def test_uncited_tasks_prs_and_non_routine_commits_get_their_own_request():
    pieces = [
        task_piece(1, "T1 Write the deploy guide, owner: Ravi, status: open"),
        task_piece(2, "T2 Renew the domain, owner: Ravi, status: open"),
        repo_piece(3, "aaaaaa1", "Fix typo in the readme"),
        repo_piece(4, "aaaaaa2", "Move sessions to Redis"),
    ]
    first = {"statements": [statement(text="Deploy guide is open", relation="claim_only",
                                       evidence=[{"piece_id": 1, "quote": "Write the deploy guide"}])], "gaps": []}
    second = {"statements": [statement(text="Sessions move to Redis", relation="claim_only",
                                        evidence=[{"piece_id": 4, "quote": "Move sessions to Redis"}]),
                             statement(text="Domain renewal is open", relation="claim_only",
                                        evidence=[{"piece_id": 2, "quote": "Renew the domain"}])], "gaps": []}
    llm = FakeLLM(first, {"statements": [], "gaps": []}, second)
    result = analyze(llm, pieces)
    asked = [u for _, u in llm.prompts if "[id=" in u]
    record_request = [u for u in asked if "[id=2]" in u and "[id=1]" not in u][0]
    assert "[id=4]" in record_request and "[id=3]" not in record_request  # the typo commit is not asked about
    assert {d.text for d in result.drafts} >= {"Sessions move to Redis", "Domain renewal is open"}


def test_thin_result_for_a_big_project_is_asked_for_once_more_and_small_ones_are_not():
    pieces = [chat_piece(i, "Ravi", f"message number {i}") for i in range(1, 41)]
    one = {"statements": [statement(text="First", relation="claim_only", evidence=[{"piece_id": 1, "quote": "message number 1"}])], "gaps": []}
    two = {"statements": [statement(text="Second", relation="claim_only", evidence=[{"piece_id": 2, "quote": "message number 2"}])], "gaps": []}
    llm = FakeLLM(one, two)
    result = analyze(llm, pieces)
    assert [d.text for d in result.drafts] == ["First", "Second"]
    assert len(llm.prompts) == 2 and "message number 40" in llm.prompts[1][1]

    small = FakeLLM(one)
    analyze(small, pieces[:3])
    assert len(small.prompts) == 1


def test_near_identical_statements_about_the_same_piece_are_merged_and_keep_all_evidence():
    pieces = [chat_piece(1, "Ravi", "We chose Render for hosting"), chat_piece(2, "Neha", "Render hosting it is")]
    a = statement(text="The team chose Render for hosting", relation="claim_only", evidence=[{"piece_id": 1, "quote": "chose Render"}])
    b = statement(text="The team chose Render for hosting.", relation="claim_only",
                  evidence=[{"piece_id": 1, "quote": "chose Render"}, {"piece_id": 2, "quote": "Render hosting"}])
    different = statement(text="Backups are nightly", relation="claim_only", evidence=[{"piece_id": 1, "quote": "chose Render"}])
    result = analyze(FakeLLM({"statements": [a, b, different], "gaps": []}), pieces)
    assert [d.text for d in result.drafts] == ["The team chose Render for hosting", "Backups are nightly"]
    assert [e.piece_id for e in result.drafts[0].evidence] == [1, 2]


def test_merging_never_joins_different_labels():
    pieces = [chat_piece(1, "Ravi", "We chose Render for hosting")]
    supported = statement(text="We chose Render for hosting", evidence=[{"piece_id": 1, "quote": "chose Render"}])
    claim = statement(text="We chose Render for hosting", relation="claim_only", evidence=[{"piece_id": 1, "quote": "chose Render"}])
    result = analyze(FakeLLM({"statements": [supported, claim], "gaps": []}, verdict("supported")), pieces)
    assert sorted(d.label for d in result.drafts) == ["unverified", "verified"]
