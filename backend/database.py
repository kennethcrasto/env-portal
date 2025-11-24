import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

_pool: asyncpg.pool.Pool | None = None


async def init_db_pool():
    global _pool
    if _pool is None:
        try:
            _pool = await asyncpg.create_pool(
                dsn=DATABASE_URL,
                min_size=1,
                max_size=10,
            )
            # test connection
            async with _pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
            print("Database connected successfully")
        except Exception as e:
            print("❌ Database connection failed:", e)
            raise


async def close_db_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


def get_pool() -> asyncpg.pool.Pool:
    if _pool is None:
        raise RuntimeError("Database pool not initialized. Did you call init_db_pool()?")
    return _pool


# helper functions
async def fetch(query: str, *args):
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *args)
        return [dict(r) for r in rows]


async def fetchrow(query: str, *args):
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(query, *args)
        return dict(row) if row else None


async def execute(query: str, *args):
    pool = get_pool()
    async with pool.acquire() as conn:
        return await conn.execute(query, *args)
