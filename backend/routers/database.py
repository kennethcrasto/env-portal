from fastapi import APIRouter
from database import fetch
from typing import Dict, List, Any

router = APIRouter(tags=["Database"])

# Changed response_model to Dict to match frontend expectation
@router.get("/", response_model=Dict[str, List[Any]])
async def get_all_tables():
    """
    Returns a dictionary where keys are table names and values are lists of rows.
    Format:
    {
        "users": [{...}, {...}],
        "complaints": [{...}, {...}]
    }
    """
    # 1. Fetch all table names
    tables = await fetch("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE';
    """)

    result = {}

    # 2. Loop through tables and fetch rows
    for t in tables:
        table_name = t['table_name']
        # Limit 200 to prevent crashing the browser with too much data
        rows = await fetch(f"SELECT * FROM {table_name} LIMIT 200")
        result[table_name] = rows

    return result