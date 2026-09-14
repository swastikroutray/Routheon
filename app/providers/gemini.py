"""
Google Gemini provider using raw HTTP (no SDK dependency).
"""

import time
import httpx
from .base import BaseLLMProvider, LLMResponse


class GeminiProvider(BaseLLMProvider):
    """Calls the Gemini REST API directly via httpx."""

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = httpx.AsyncClient(timeout=180.0)

    async def generate(self, prompt: str, model: str) -> LLMResponse:
        url = f"{self.BASE_URL}/models/{model}:generateContent"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
        }

        start = time.perf_counter()
        resp = await self.client.post(
            url,
            json=payload,
            params={"key": self.api_key},
        )
        latency_ms = (time.perf_counter() - start) * 1000

        if resp.status_code != 200:
            raise RuntimeError(
                f"Gemini API error {resp.status_code}: {resp.text}"
            )

        data = resp.json()

        # Extract text from response
        candidates = data.get("candidates", [])
        if not candidates:
            raise RuntimeError(f"Gemini returned no candidates: {data}")

        finish_reason = candidates[0].get("finishReason", "")
        parts = candidates[0].get("content", {}).get("parts", [])
        text = parts[0]["text"] if parts else ""

        if not text.strip():
            raise RuntimeError(
                f"Gemini returned empty text (finishReason={finish_reason}): {data}"
            )

        # Extract token counts from usageMetadata
        usage = data.get("usageMetadata", {})
        prompt_tokens = usage.get("promptTokenCount", 0)
        completion_tokens = usage.get("candidatesTokenCount", 0)

        return LLMResponse(
            text=text,
            model=model,
            provider="gemini",
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            latency_ms=round(latency_ms, 2),
        )

    async def close(self):
        await self.client.aclose()
