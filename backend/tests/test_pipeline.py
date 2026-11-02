from types import SimpleNamespace

import pytest

from app.pipeline.analyze import analyze, parse_json, quote_in_piece
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
    assert len(llm.prompts) == 1


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
        base = dict(llm_api_key="k", llm_provider="anthropic", llm_model="m", llm_fallback_model="", llm_base_url="")
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
