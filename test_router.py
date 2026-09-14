#!/usr/bin/env python3
"""
Test script: sends 10 varied prompts through /v1/chat and prints
which tier/provider/model handled each one, plus latency.
"""

import httpx
import sys

API_URL = "http://localhost:8000/v1/chat"

PROMPTS = [
    # Tier 1 — simple
    ("What is 2+2?", "Tier 1 expected"),
    ("Hi there", "Tier 1 expected"),
    ("What's the capital of France?", "Tier 1 expected"),
    # Tier 2 — moderate
    (
        "Summarize the key differences between Python and JavaScript "
        "in terms of typing, performance, and typical use cases.",
        "Tier 2 expected",
    ),
    (
        "Compare and contrast REST and GraphQL APIs. List the main "
        "advantages and disadvantages of each approach for building web services.",
        "Tier 2 expected",
    ),
    (
        "Extract the main themes from this text: The industrial revolution "
        "transformed society by introducing mechanized manufacturing, which "
        "led to urbanization, new social classes, and significant changes "
        "in labor practices and economic structures across Europe and "
        "North America during the 18th and 19th centuries.",
        "Tier 2 expected",
    ),
    # Tier 3 — complex
    (
        "Analyze the pros and cons of microservices architecture vs "
        "monolithic design, considering scalability, developer experience, "
        "and operational complexity. Provide a step by step migration "
        "strategy for moving from a monolith to microservices.",
        "Tier 3 expected",
    ),
    ("Write a story about a robot learning to paint", "Tier 3 expected"),
    (
        "Debug this Python code and explain what's wrong step by step: "
        "def fib(n): return fib(n-1) + fib(n-2)",
        "Tier 3 expected",
    ),
    (
        "Design a database schema for a social media platform. What "
        "tables would you need? How would you handle the relationship "
        "between users and posts? What about comments and likes? "
        "What indexes would you add for performance?",
        "Tier 3 expected",
    ),
]


def main():
    print("=" * 80)
    print("LLM Router Test — 10 Prompts")
    print("=" * 80)
    print()

    with httpx.Client(timeout=60.0) as client:
        for i, (prompt, expectation) in enumerate(PROMPTS, 1):
            print(f"[{i:2d}/10] Sending: {prompt[:60]}...")
            try:
                resp = client.post(API_URL, json={"message": prompt})
                resp.raise_for_status()
                data = resp.json()

                tier = data["tier"]
                provider = data["provider"]
                model = data["model"]
                latency = data["latency_ms"]
                tokens = data.get("tokens", {})
                reply_preview = data["reply"][:80].replace("\n", " ")

                # Color-code tier match
                match_str = "✓" if f"Tier {tier}" in expectation else "✗"

                print(f"       {match_str} Tier {tier} | {provider}/{model}")
                print(f"         Latency: {latency:.0f}ms | "
                      f"Tokens: {tokens.get('prompt', '?')}→{tokens.get('completion', '?')}")
                print(f"         Reply: {reply_preview}...")
                print(f"         ({expectation})")
                print()

            except httpx.HTTPStatusError as e:
                print(f"       ✗ HTTP Error: {e.response.status_code}")
                print(f"         {e.response.text[:200]}")
                print()
            except httpx.ConnectError:
                print("       ✗ Connection refused — is the server running?")
                print("         Start it with: uvicorn app.main:app --reload")
                sys.exit(1)
            except Exception as e:
                print(f"       ✗ Error: {e}")
                print()

    print("=" * 80)
    print("Test complete. Check /v1/stats for aggregate metrics.")
    print("=" * 80)


if __name__ == "__main__":
    main()
