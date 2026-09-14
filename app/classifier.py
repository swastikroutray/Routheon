"""
Rule-based prompt classifier that assigns a complexity tier (1-3).

Tier 1 (simple):  Short prompts (<40 words), no multi-step or analytical keywords.
Tier 2 (moderate): Summarization/classification keywords, 40-150 words.
Tier 3 (complex):  Reasoning/creative keywords, 150+ words, or multiple questions.
"""

import re

# Keywords that signal moderate complexity (tier 2)
TIER2_KEYWORDS = [
    "summarize", "summary", "classify", "classification",
    "extract", "compare", "comparison", "list", "translate",
    "translation", "describe", "define", "outline", "categorize",
    "identify", "convert", "paraphrase", "rewrite",
]

# Keywords that signal high complexity (tier 3)
TIER3_KEYWORDS = [
    "analyze", "analysis", "design", "step by step", "step-by-step",
    "write a story", "write a poem", "write an essay",
    "debug", "architecture", "architect", "explain in detail",
    "pros and cons", "evaluate", "critique", "implement",
    "create a plan", "develop", "build", "refactor",
    "optimize", "trade-offs", "tradeoffs", "reasoning",
    "brainstorm", "strategy", "comprehensive", "prove", "proof", "derive", "derivation", "algorithm",
    "verify", "verification", "correctness", "compute",
]


def classify(prompt: str) -> tuple[int, list[str]]:
    """
    Classify a prompt into a tier (1, 2, or 3) with matched signals.

    Returns:
        (tier, signals): tier is 1-3, signals is a list of human-readable
        strings explaining why the tier was chosen.
    """
    signals: list[str] = []
    prompt_lower = prompt.lower().strip()
    word_count = len(prompt.split())

    # Count distinct questions (question marks)
    question_count = prompt.count("?")
    numbered_items = len(re.findall(r"(?:^|\n|\s)\d+\.\s", prompt))

    # Check for tier 3 keywords
    tier3_matches = [kw for kw in TIER3_KEYWORDS if kw in prompt_lower]
    # Check for tier 2 keywords
    tier2_matches = [kw for kw in TIER2_KEYWORDS if kw in prompt_lower]

    # --- Tier 3 checks ---
    if tier3_matches:
        signals.append(f"complex keywords: {', '.join(tier3_matches)}")

    if word_count > 150:
        signals.append(f"long prompt ({word_count} words)")

    if question_count >= 3:
        signals.append(f"multiple questions ({question_count} question marks)")

    if numbered_items >= 3:
        signals.append(f"multi-part structured request ({numbered_items} numbered items)")

    if tier3_matches or word_count > 150 or question_count >= 3 or numbered_items >= 3:
        return 3, signals

    # --- Tier 2 checks ---
    if tier2_matches:
        signals.append(f"moderate keywords: {', '.join(tier2_matches)}")

    if 40 <= word_count <= 150:
        signals.append(f"moderate length ({word_count} words)")

    if tier2_matches or (40 <= word_count <= 150):
        return 2, signals

    # --- Tier 1 (default / simple) ---
    signals.append(f"simple prompt ({word_count} words)")
    return 1, signals
