import time

import httpx

from app.config import get_settings


class LLMError(Exception):
    """The AI service failed or returned something we cannot use."""


class AnthropicClient:
    """Minimal Messages API client with retries and an optional second model."""

    attempts_per_model = 2
    sleep = staticmethod(time.sleep)

    def __init__(self, api_key: str, models: list[str], base_url: str = "https://api.anthropic.com"):
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
                        self.sleep(2 ** attempt)
        raise LLMError(last_error)

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


def build_llm() -> AnthropicClient | None:
    settings = get_settings()
    if not settings.llm_api_key:
        return None
    models = [settings.llm_model]
    if settings.llm_fallback_model:
        models.append(settings.llm_fallback_model)
    return AnthropicClient(settings.llm_api_key, models, settings.llm_base_url)
