"""
FastAPI application — LLM routing proxy.

Exposes:
    POST /v1beta/models/{model}:generateContent  — Gemini-compatible endpoint
    POST /v1/chat                                 — Simple JSON for the frontend
    GET  /v1/stats                                — Dashboard statistics
    GET  /health                                  — Health check
"""

import asyncio
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path
from contextlib import asynccontextmanager

import yaml
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from app import config, db
from app.classifier import classify
from app.translator import parse_gemini_request, build_gemini_response
from app.verifier import maybe_verify
from app.providers.gemini import GeminiProvider
from app.providers.groq import GroqProvider
from app.providers.openrouter import OpenRouterProvider

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Global state ─────────────────────────────────────────────────────

routing_config: dict = {}
providers: dict = {}  # name -> provider instance


def load_routing_config() -> dict:
    """Load the routing.yaml configuration file."""
    config_path = Path(__file__).parent / "routing.yaml"
    with open(config_path) as f:
        return yaml.safe_load(f)


def init_providers() -> dict:
    """Instantiate available providers based on configured API keys."""
    p = {}
    if config.GEMINI_API_KEY:
        p["gemini"] = GeminiProvider(config.GEMINI_API_KEY)
        logger.info("✓ Gemini provider initialized")
    else:
        logger.warning("⚠ GEMINI_API_KEY not set — Gemini provider unavailable")

    if config.GROQ_API_KEY:
        p["groq"] = GroqProvider(config.GROQ_API_KEY)
        logger.info("✓ Groq provider initialized")
    else:
        logger.warning("⚠ GROQ_API_KEY not set — Groq provider unavailable")

    if config.OPENROUTER_API_KEY:
        p["openrouter"] = OpenRouterProvider(config.OPENROUTER_API_KEY)
        logger.info("✓ OpenRouter provider initialized")
    else:
        logger.warning("⚠ OPENROUTER_API_KEY not set — OpenRouter provider unavailable")

    return p


# ── Core routing pipeline ────────────────────────────────────────────

async def route_prompt(prompt: str) -> dict:
    """
    Core pipeline: classify → route → call provider → log → schedule verify.

    Returns a dict with all fields needed by both endpoints.
    """
    request_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()

    # 1. Classify
    tier, signals = classify(prompt)
    logger.info(f"[{request_id[:8]}] Classified as tier {tier}: {signals}")

    # 2. Resolve provider and model from routing config
    tier_config = routing_config["tiers"][tier]
    target_provider = tier_config["provider"]
    target_model = tier_config["model"]

    # 3. Fallback if configured provider isn't available
    provider = providers.get(target_provider)
    if provider is None:
        # Try fallback providers in order: gemini → groq → openrouter
        for fallback_name in ["gemini", "groq", "openrouter"]:
            if fallback_name in providers:
                provider = providers[fallback_name]
                target_provider = fallback_name
                # Use a default model for the fallback provider
                if fallback_name == "gemini":
                    target_model = "gemini-3.1-flash-lite"
                elif fallback_name == "groq":
                    target_model = "openai/gpt-oss-20b"
                elif fallback_name == "openrouter":
                    target_model = "meta-llama/llama-3.1-8b-instruct:free"
                logger.warning(
                    f"[{request_id[:8]}] Falling back to {fallback_name}/{target_model}"
                )
                break

    if provider is None:
        raise HTTPException(
            status_code=503,
            detail="No LLM providers available. Check your API keys in .env",
        )

    # 4. Call provider
    try:
        result = await provider.generate(prompt, target_model)
    except Exception as e:
        error_detail = f"{type(e).__name__}: {e}" if str(e) else f"{type(e).__name__} (no message — likely a timeout)"
        logger.error(f"[{request_id[:8]}] Provider error: {error_detail}", exc_info=True)
        raise HTTPException(status_code=502, detail=f"Provider error: {error_detail}")

    # 5. Log to database
    try:
        await db.log_request(
            request_id=request_id,
            timestamp=timestamp,
            prompt=prompt,
            response=result.text,
            tier=tier,
            provider=result.provider,
            model=result.model,
            latency_ms=result.latency_ms,
            prompt_tokens=result.prompt_tokens,
            completion_tokens=result.completion_tokens,
        )
    except Exception as e:
        logger.error(f"[{request_id[:8]}] DB logging error: {e}")

    # 6. Fire-and-forget verification
    asyncio.create_task(
        maybe_verify(
            prompt=prompt,
            original_response=result.text,
            tier=tier,
            request_id=request_id,
            providers=providers,
            routing_config=routing_config,
        )
    )

    return {
        "request_id": request_id,
        "text": result.text,
        "tier": tier,
        "signals": signals,
        "provider": result.provider,
        "model": result.model,
        "latency_ms": result.latency_ms,
        "prompt_tokens": result.prompt_tokens,
        "completion_tokens": result.completion_tokens,
    }


# ── App lifecycle ────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    global routing_config, providers
    routing_config = load_routing_config()
    providers = init_providers()
    await db.init_db()
    logger.info("LLM Router started")
    yield
    # Shutdown: close provider HTTP clients
    for p in providers.values():
        if hasattr(p, "close"):
            await p.close()
    logger.info("LLM Router shut down")


app = FastAPI(
    title="LLM Router",
    description="Zero-cost multi-provider LLM routing proxy with Gemini-compatible API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Endpoints ────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "providers": list(providers.keys()),
        "tiers_configured": list(routing_config.get("tiers", {}).keys()),
    }


@app.post("/v1beta/models/{model}:generateContent")
async def gemini_generate_content(model: str, request: Request):
    """
    Gemini-compatible generateContent endpoint.

    Accepts the exact same request body as Google's Gemini API.
    Routes based on prompt complexity, not the requested model name.
    """
    body = await request.json()

    try:
        prompt = parse_gemini_request(body)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    result = await route_prompt(prompt)

    return build_gemini_response(
        text=result["text"],
        model=result["model"],
        prompt_tokens=result["prompt_tokens"],
        completion_tokens=result["completion_tokens"],
    )


@app.post("/v1/chat")
async def chat(request: Request):
    """
    Simple JSON chat endpoint for the frontend.

    Request:  {"message": "...", "history": [...]}
    Response: {"reply": "...", "tier": 1-3, "provider": "...", ...}
    """
    body = await request.json()
    message = body.get("message", "").strip()

    if not message:
        raise HTTPException(status_code=400, detail="'message' field is required")

    # Build prompt from history + current message
    history = body.get("history", [])
    if history:
        # Format history into a conversation context
        context_parts = []
        for msg in history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "user":
                context_parts.append(f"User: {content}")
            else:
                context_parts.append(f"Assistant: {content}")
        context_parts.append(f"User: {message}")
        full_prompt = "\n".join(context_parts)
    else:
        full_prompt = message

    result = await route_prompt(full_prompt)

    return {
        "reply": result["text"],
        "tier": result["tier"],
        "provider": result["provider"],
        "model": result["model"],
        "latency_ms": result["latency_ms"],
        "tokens": {
            "prompt": result["prompt_tokens"],
            "completion": result["completion_tokens"],
        },
        "verified": False,  # Verification is async, always false initially
        "request_id": result["request_id"],
    }


@app.get("/v1/stats")
async def stats():
    """Dashboard statistics endpoint."""
    return await db.get_stats()
