# app/utils.py
from fastapi import HTTPException

def check_rows(rows, error_msg="Not found"):
    if not rows:
        raise HTTPException(status_code=404, detail=error_msg)
    return rows
