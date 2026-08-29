from fastapi import APIRouter, HTTPException
from database.db import get_history_records, get_record_by_id, delete_record_by_id

router = APIRouter(prefix="/api", tags=["History"])

@router.get("/history")
async def fetch_history(limit: int = 50):
    records = get_history_records(limit=limit)
    return {"status": "success", "count": len(records), "data": records}

@router.get("/history/{record_id}")
async def fetch_single_history(record_id: str):
    record = get_record_by_id(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Prediction record not found.")
    return record

@router.delete("/history/{record_id}")
async def remove_history(record_id: str):
    success = delete_record_by_id(record_id)
    if not success:
        raise HTTPException(status_code=404, detail="Record not found or already deleted.")
    return {"status": "success", "deleted_id": record_id}
