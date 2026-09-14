"""
SQLite database module for request logging and statistics.

Uses aiosqlite for async access. All functions are safe to call
concurrently from FastAPI's async handlers.
"""

import aiosqlite
from app.config import DATABASE_PATH

_db_path = DATABASE_PATH


async def init_db() -> None:
    """Create the requests table if it doesn't exist."""
    async with aiosqlite.connect(_db_path) as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS requests (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                prompt TEXT NOT NULL,
                response TEXT NOT NULL,
                tier INTEGER NOT NULL,
                provider TEXT NOT NULL,
                model TEXT NOT NULL,
                latency_ms REAL NOT NULL,
                prompt_tokens INTEGER DEFAULT 0,
                completion_tokens INTEGER DEFAULT 0,
                verified INTEGER DEFAULT 0,
                verification_score REAL,
                escalated INTEGER DEFAULT 0
            )
        """)
        await conn.commit()


async def log_request(
    request_id: str,
    timestamp: str,
    prompt: str,
    response: str,
    tier: int,
    provider: str,
    model: str,
    latency_ms: float,
    prompt_tokens: int,
    completion_tokens: int,
) -> None:
    """Insert a new request record."""
    async with aiosqlite.connect(_db_path) as conn:
        await conn.execute(
            """
            INSERT INTO requests
                (id, timestamp, prompt, response, tier, provider, model,
                 latency_ms, prompt_tokens, completion_tokens)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                request_id, timestamp, prompt, response,
                tier, provider, model, latency_ms,
                prompt_tokens, completion_tokens,
            ),
        )
        await conn.commit()


async def log_verification(
    request_id: str,
    score: float,
    escalated: bool,
) -> None:
    """Update a request record with verification results."""
    async with aiosqlite.connect(_db_path) as conn:
        await conn.execute(
            """
            UPDATE requests
            SET verified = 1,
                verification_score = ?,
                escalated = ?
            WHERE id = ?
            """,
            (score, int(escalated), request_id),
        )
        await conn.commit()


async def get_stats() -> dict:
    """
    Compute and return dashboard statistics.

    Returns a dict with:
        - total_requests
        - requests_per_tier
        - requests_per_provider
        - avg_latency_per_tier
        - verification_count
        - avg_verification_score
        - escalation_count
        - escalation_rate
        - tier1_pct (% of requests that used cheapest tier = quota saved)
    """
    async with aiosqlite.connect(_db_path) as conn:
        conn.row_factory = aiosqlite.Row

        # Total requests
        cursor = await conn.execute("SELECT COUNT(*) as cnt FROM requests")
        row = await cursor.fetchone()
        total = row[0] if row else 0

        if total == 0:
            return {
                "total_requests": 0,
                "requests_per_tier": {},
                "requests_per_provider": {},
                "avg_latency_per_tier": {},
                "verification_count": 0,
                "avg_verification_score": None,
                "escalation_count": 0,
                "escalation_rate": 0.0,
                "tier1_pct": 0.0,
            }

        # Requests per tier
        cursor = await conn.execute(
            "SELECT tier, COUNT(*) as cnt FROM requests GROUP BY tier"
        )
        rows = await cursor.fetchall()
        per_tier = {str(r[0]): r[1] for r in rows}

        # Requests per provider
        cursor = await conn.execute(
            "SELECT provider, COUNT(*) as cnt FROM requests GROUP BY provider"
        )
        rows = await cursor.fetchall()
        per_provider = {r[0]: r[1] for r in rows}

        # Avg latency per tier
        cursor = await conn.execute(
            "SELECT tier, AVG(latency_ms) as avg_lat FROM requests GROUP BY tier"
        )
        rows = await cursor.fetchall()
        avg_latency = {str(r[0]): round(r[1], 2) for r in rows}

        # Verification stats
        cursor = await conn.execute(
            "SELECT COUNT(*) FROM requests WHERE verified = 1"
        )
        row = await cursor.fetchone()
        verification_count = row[0] if row else 0

        cursor = await conn.execute(
            "SELECT AVG(verification_score) FROM requests WHERE verified = 1"
        )
        row = await cursor.fetchone()
        avg_score = round(row[0], 2) if row and row[0] is not None else None

        cursor = await conn.execute(
            "SELECT COUNT(*) FROM requests WHERE escalated = 1"
        )
        row = await cursor.fetchone()
        escalation_count = row[0] if row else 0

        escalation_rate = (
            round(escalation_count / verification_count, 4)
            if verification_count > 0 else 0.0
        )

        # Tier 1 percentage = "quota saved"
        tier1_count = per_tier.get("1", 0)
        tier1_pct = round((tier1_count / total) * 100, 1) if total > 0 else 0.0

        return {
            "total_requests": total,
            "requests_per_tier": per_tier,
            "requests_per_provider": per_provider,
            "avg_latency_per_tier": avg_latency,
            "verification_count": verification_count,
            "avg_verification_score": avg_score,
            "escalation_count": escalation_count,
            "escalation_rate": escalation_rate,
            "tier1_pct": tier1_pct,
        }
