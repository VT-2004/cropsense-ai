import sqlite3
import json
import os
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(DB_DIR, "cropsense.db")

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Predictions log table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS predictions (
        id TEXT PRIMARY KEY,
        filename TEXT,
        image_preview TEXT,
        pre_check TEXT,
        disease_name TEXT,
        crop_type TEXT,
        condition TEXT,
        confidence REAL,
        severity TEXT,
        severity_score INTEGER,
        yield_impact REAL,
        estimated_financial_loss REAL,
        treatment_json TEXT,
        prevention TEXT,
        field_name TEXT DEFAULT 'Main Field',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Field notes / tracking table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS field_notes (
        id TEXT PRIMARY KEY,
        field_name TEXT,
        note TEXT,
        action_taken TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()
    conn.close()

init_db()

def save_prediction_record(data: Dict[str, Any]) -> str:
    conn = get_connection()
    cursor = conn.cursor()
    record_id = data.get("id", str(uuid.uuid4()))
    
    treatment_str = json.dumps(data.get("treatment", []))
    
    cursor.execute("""
    INSERT INTO predictions (
        id, filename, image_preview, pre_check, disease_name, crop_type,
        condition, confidence, severity, severity_score, yield_impact,
        estimated_financial_loss, treatment_json, prevention, field_name, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        record_id,
        data.get("filename", "leaf.jpg"),
        data.get("image_preview", ""),
        data.get("pre_check", "Unknown"),
        data.get("disease_name", "Unknown"),
        data.get("crop_type", "General Crop"),
        data.get("condition", "Unknown"),
        data.get("confidence", 0.0),
        data.get("severity", "Moderate"),
        data.get("severity_score", 3),
        data.get("yield_impact", 0.0),
        data.get("estimated_financial_loss", 0.0),
        treatment_str,
        data.get("prevention", ""),
        data.get("field_name", "Main Field"),
        datetime.utcnow().isoformat()
    ))
    conn.commit()
    conn.close()
    return record_id

def get_history_records(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM predictions ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    
    results = []
    for r in rows:
        item = dict(r)
        try:
            item["treatment"] = json.loads(item["treatment_json"])
        except Exception:
            item["treatment"] = []
        results.append(item)
        
    conn.close()
    return results

def get_record_by_id(record_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM predictions WHERE id = ?", (record_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    item = dict(row)
    try:
        item["treatment"] = json.loads(item["treatment_json"])
    except Exception:
        item["treatment"] = []
    return item

def delete_record_by_id(record_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM predictions WHERE id = ?", (record_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted
