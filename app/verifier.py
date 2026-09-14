"""
Fire-and-forget async verification of lower-tier responses.

Samples a fraction of tier-1/tier-2 requests, re-runs them on the
verifier model, and scores agreement. Results are logged to the DB.
"""

import asyncio
import logging
import random

from . import db

logger = logging.getLogger(__name__)


async def maybe_verify(
    prompt: str,
    original_response: str,
    tier: int,
    request_id: str,
    providers: dict,
    routing_config: dict,
) -> None:
    """
    Conditionally verify a response by re-running on the verifier model.

    This is designed to be called via asyncio.create_task() so it doesn't
    block the main response path.

    Args:
        prompt: The original user prompt.
        original_response: The response text from the primary model.
        tier: The classified tier (1, 2, or 3).
        request_id: UUID of the request for DB logging.
        providers: Dict of provider name -> provider instance.
        routing_config: The loaded routing.yaml config dict.
    """
    # Only verify tier 1 and 2
    if tier > 2:
        return

    # Sample based on configured rate
    sample_rate = routing_config.get("verification_sample_rate", 0.15)
    if random.random() > sample_rate:
        return

    try:
        verifier_cfg = routing_config["verifier_model"]
        provider_name = verifier_cfg["provider"]
        model = verifier_cfg["model"]

        provider = providers.get(provider_name)
        if provider is None:
            logger.warning(
                f"Verifier provider '{provider_name}' not available, skipping"
            )
            return

        # Ask the verifier model to rate the original response
        judge_prompt = f"""You are evaluating the quality and accuracy of an AI response.

Original question: {prompt}

AI response to evaluate: {original_response}

Rate the response on a scale of 1-5 where:
1 = Completely wrong or irrelevant
2 = Partially correct but has significant errors
3 = Acceptable but could be better
4 = Good and accurate
5 = Excellent and comprehensive

Respond with ONLY a single number (1-5) and nothing else."""

        result = await provider.generate(judge_prompt, model)

        # Parse score from response
        score_text = result.text.strip()
        try:
            score = float(score_text[0])  # Take first character in case of extra text
            score = max(1.0, min(5.0, score))
        except (ValueError, IndexError):
            logger.warning(f"Could not parse verification score: {score_text}")
            score = 3.0  # Default to neutral

        escalated = score < 3.0

        await db.log_verification(request_id, score, escalated)

        if escalated:
            logger.warning(
                f"Request {request_id} escalated: verification score {score}/5 "
                f"(tier {tier})"
            )
        else:
            logger.info(
                f"Request {request_id} verified: score {score}/5 (tier {tier})"
            )

    except Exception as e:
        logger.error(f"Verification failed for request {request_id}: {e}")
