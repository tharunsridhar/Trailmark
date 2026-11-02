import re
import time

import httpx

from app.config import get_settings

ANTHROPIC_URL = "https://api.anthropic.com"
GROQ_URL = "https://api.groq.com/openai/v1"
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai"


class LLMError(Exception):
    """The AI service failed or returned something we cannot use."""

    def __init__(self, message: str, retry_after: float | None = None):
        super().__init__(message)
        self.retry_after = retry_after


class LLMClient:
    """Retries and an optional second model. Subclasses only know how to make one call."""

    attempts_per_model = 2
    sleep = staticmethod(time.sleep)

    def __init__(self, api_key: str, models: list[str], base_url: str):
        self.api_key = api_key
        self.models = models
        self.base_url = base_url.rstrip("/")

    def complete(self, system: str, user: str) -> str:
        last_error = "no model configured"
        for model in self.models:
            for attempt in range(self.attempts_per_model):
                try:
                    return self._call(model, system, user)
                except LLMError as error:
                    last_error = str(error)
                    if attempt + 1 < self.attempts_per_model:
                        # a rate limit tells us how long to wait, otherwise back off a little
                        self.sleep(error.retry_after or 2**attempt)
        raise LLMError(last_error)

    def _call(self, model: str, system: str, user: str) -> str:
        raise NotImplementedError


class AnthropicClient(LLMClient):
    """Minimal Messages API client."""

    def __init__(self, api_key: str, models: list[str], base_url: str = ANTHROPIC_URL):
        super().__init__(api_key, models, base_url)

    def _call(self, model: str, system: str, user: str) -> str:
        try:
            response = httpx.post(
                f"{self.base_url}/v1/messages",
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": model,
                    "max_tokens": 8000,
                    "system": system,
                    "messages": [{"role": "user", "content": user}],
                },
                timeout=120,
            )
        except httpx.HTTPError as error:
            raise LLMError(f"request failed: {error}") from error

        if response.status_code != 200:
            raise LLMError(f"{model} returned {response.status_code}")
        try:
            blocks = response.json()["content"]
        except (ValueError, KeyError) as error:
            raise LLMError("unexpected response shape") from error
        return "".join(b.get("text", "") for b in blocks if b.get("type") == "text")


class ChatCompletionsClient(LLMClient):
    """The OpenAI chat completions format, which Groq and Gemini both speak."""

    def __init__(self, api_key: str, models: list[str], base_url: str = GROQ_URL):
        super().__init__(api_key, models, base_url)

    def _call(self, model: str, system: str, user: str) -> str:
        try:
            response = httpx.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}", "content-type": "application/json"},
                json={
                    "model": model,
                    "max_completion_tokens": 8000,
                    "temperature": 0,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                },
                timeout=120,
            )
        except httpx.HTTPError as error:
            raise LLMError(f"request failed: {error}") from error

        if response.status_code == 429:
            raise LLMError(f"{model} is rate limited", retry_after=retry_seconds(response))
        if response.status_code != 200:
            raise LLMError(f"{model} returned {response.status_code}")
        try:
            text = response.json()["choices"][0]["message"]["content"] or ""
        except (ValueError, KeyError, IndexError, TypeError) as error:
            raise LLMError("unexpected response shape") from error
        # some models print their reasoning first, it is not part of the answer
        return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()


def retry_seconds(response: httpx.Response) -> float | None:
    try:
        # never sleep long inside a request, saved results are the fallback anyway
        return min(float(response.headers["retry-after"]), 20)
    except (KeyError, ValueError):
        return None


def build_llm() -> LLMClient | None:
    settings = get_settings()
    if not settings.llm_api_key:
        return None
    models = [settings.llm_model]
    if settings.llm_fallback_model:
        models.append(settings.llm_fallback_model)
    chat_urls = {"groq": GROQ_URL, "gemini": GEMINI_URL}
    if settings.llm_provider in chat_urls:
        base_url = settings.llm_base_url or chat_urls[settings.llm_provider]
        return ChatCompletionsClient(settings.llm_api_key, models, base_url)
    return AnthropicClient(settings.llm_api_key, models, settings.llm_base_url or ANTHROPIC_URL)
