from fastapi import APIRouter
from database import get_pool

router = APIRouter()

@router.get("/database")
async def database_dump():
    pool = await get_pool()
    async with pool.acquire() as conn:

        tables = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables
            WHERE table_schema='public' AND table_type='BASE TABLE'
            ORDER BY table_name
        """)

        result = {}
        for t in tables:
            name = t["table_name"]
            rows = await conn.fetch(f"SELECT * FROM {name} LIMIT 200")
            result[name] = rows

        return result
