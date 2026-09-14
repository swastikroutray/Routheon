"""
Translates between Google Gemini API schema and internal representations.
"""


def parse_gemini_request(body: dict) -> str:
    """
    Extract the user prompt text from a Gemini-shaped request body.

    Expected format:
        {"contents": [{"parts": [{"text": "..."}], "role": "user"}]}

    Concatenates all text parts from the last user message.
    """
    contents = body.get("contents", [])
    if not contents:
        raise ValueError("Request body missing 'contents' field")

    # Take the last content entry (the latest user message)
    last_content = contents[-1]
    parts = last_content.get("parts", [])
    if not parts:
        raise ValueError("Content entry missing 'parts' field")

    texts = [part["text"] for part in parts if "text" in part]
    if not texts:
        raise ValueError("No text parts found in request")

    return " ".join(texts)


def build_gemini_response(
    text: str,
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
) -> dict:
    """
    Build a Gemini-shaped response matching Google's documented schema.

    Returns a dict with candidates, usageMetadata, and modelVersion.
    """
    return {
        "candidates": [
            {
                "content": {
                    "parts": [{"text": text}],
                    "role": "model",
                },
                "finishReason": "STOP",
                "index": 0,
            }
        ],
        "usageMetadata": {
            "promptTokenCount": prompt_tokens,
            "candidatesTokenCount": completion_tokens,
            "totalTokenCount": prompt_tokens + completion_tokens,
        },
        "modelVersion": model,
    }
