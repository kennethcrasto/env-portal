import asyncpg
import asyncio

async def test():
    conn = await asyncpg.connect("postgresql://postgres:admin@localhost:5432/complaint_mgmt")
    rows = await conn.fetch("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
    print(rows)
    await conn.close()

asyncio.run(test())
