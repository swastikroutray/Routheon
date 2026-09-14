"""
Groq provider using their OpenAI-compatible REST API.
"""

import time
import httpx
from .base import BaseLLMProvider, LLMResponse


class GroqProvider(BaseLLMProvider):
    """Calls the Groq API (OpenAI-compatible chat completions)."""

    BASE_URL = "https://api.groq.com/openai/v1/chat/completions"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = httpx.AsyncClient(timeout=60.0)

    async def generate(self, prompt: str, model: str) -> LLMResponse:
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 2048,
            "reasoning_effort": "low",
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        start = time.perf_counter()
        resp = await self.client.post(
            self.BASE_URL,
            json=payload,
            headers=headers,
        )
        latency_ms = (time.perf_counter() - start) * 1000

        if resp.status_code != 200:
            raise RuntimeError(
                f"Groq API error {resp.status_code}: {resp.text}"
            )

        data = resp.json()

        message = data["choices"][0]["message"]
        text = message.get("content") or ""
        if not text.strip():
            # gpt-oss reasoning models sometimes only populate "reasoning"
            # when they run out of budget before writing a final answer
            text = message.get("reasoning", "")
        usage = data.get("usage", {})
        prompt_tokens = usage.get("prompt_tokens", 0)
        completion_tokens = usage.get("completion_tokens", 0)

        return LLMResponse(
            text=text,
            model=model,
            provider="groq",
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            latency_ms=round(latency_ms, 2),
        )

    async def close(self):
        await self.client.aclose()
