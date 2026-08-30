import base64
import traceback
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Optional
from services.classifier import classifier
from services.recommender import recommender
from services.yield_engine import yield_engine
from database.db import save_prediction_record

router = APIRouter(prefix="/api", tags=["Prediction"])

@router.post("/predict")
async def predict_single(
    file: UploadFile = File(...),
    farm_acres: float = Form(1.0),
    season_code: int = Form(1),
    language: str = Form("en"),
    field_name: str = Form("Main Field")
):
    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        # 1. Run ML Classifier
        classification = classifier.predict(content)
        raw_class = classification.get("raw_class_name") or classification.get("raw_class") or "Tomato___healthy"
        class_idx = classification.get("class_index") if classification.get("class_index") is not None else classification.get("disease_code", 0)
        severity_score = classification.get("severity_score", 1)

        # 2. Get Advisory / Treatments
        advisory = recommender.get_advisory(raw_class, language=language)

        # 3. Calculate Yield Impact
        yield_impact = yield_engine.calculate_impact(
            class_idx=class_idx,
            crop_name=advisory.get("crop", classification.get("crop", "Crop")),
            severity_score=severity_score,
            season_code=season_code,
            farm_acres=farm_acres
        )

        # Image preview for history
        try:
            preview_base64 = f"data:image/jpeg;base64,{base64.b64encode(content).decode('utf-8')[:1500]}..."
        except Exception:
            preview_base64 = ""

        # Assemble unified diagnostic payload
        result = {
            "filename": file.filename or "leaf.jpg",
            "pre_check": classification.get("pre_check", "Diseased"),
            "raw_class_name": raw_class,
            "crop": advisory.get("crop", classification.get("crop", "Crop")),
            "condition": advisory.get("condition", "Healthy"),
            "disease_name": advisory.get("disease_name", classification.get("disease_name", "Leaf Condition")),
            "cause": advisory.get("cause", "Plant health diagnostic."),
            "confidence": classification.get("confidence", 90.0),
            "severity": classification.get("severity", "Moderate"),
            "severity_score": severity_score,
            "top3": classification.get("top3", []),
            "yield_impact": yield_impact.get("yield_loss_pct", 0.0),
            "risk_level": yield_impact.get("risk_level", "Low"),
            "estimated_financial_loss": yield_impact.get("estimated_financial_loss_usd", 0.0),
            "economic_advice": yield_impact.get("economic_advice", ""),
            "treatment": advisory.get("treatment", []),
            "prevention": advisory.get("prevention", ""),
            "field_name": field_name,
            "image_preview": preview_base64
        }

        # 4. Save to persistent DB
        try:
            record_id = save_prediction_record(result)
            result["id"] = record_id
        except Exception as dbe:
            print(f"DB save warning: {dbe}")
            result["id"] = None

        return result

    except Exception as e:
        print(f"Prediction Pipeline Error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@router.post("/predict-batch")
async def predict_batch(
    files: List[UploadFile] = File(...),
    farm_acres: float = Form(1.0),
    season_code: int = Form(1),
    language: str = Form("en"),
    field_name: str = Form("Main Field")
):
    results = []
    for file in files:
        try:
            content = await file.read()
            if len(content) == 0:
                continue

            classification = classifier.predict(content)
            raw_class = classification.get("raw_class_name") or classification.get("raw_class") or "Tomato___healthy"
            class_idx = classification.get("class_index") if classification.get("class_index") is not None else classification.get("disease_code", 0)
            severity_score = classification.get("severity_score", 1)

            advisory = recommender.get_advisory(raw_class, language=language)
            yield_impact = yield_engine.calculate_impact(
                class_idx=class_idx,
                crop_name=advisory.get("crop", classification.get("crop", "Crop")),
                severity_score=severity_score,
                season_code=season_code,
                farm_acres=farm_acres
            )

            res = {
                "filename": file.filename,
                "pre_check": classification.get("pre_check", "Diseased"),
                "raw_class_name": raw_class,
                "crop": advisory.get("crop", classification.get("crop", "Crop")),
                "condition": advisory.get("condition", "Healthy"),
                "disease_name": advisory.get("disease_name", classification.get("disease_name", "Leaf Condition")),
                "cause": advisory.get("cause", ""),
                "confidence": classification.get("confidence", 90.0),
                "severity": classification.get("severity", "Moderate"),
                "severity_score": severity_score,
                "top3": classification.get("top3", []),
                "yield_impact": yield_impact.get("yield_loss_pct", 0.0),
                "risk_level": yield_impact.get("risk_level", "Low"),
                "estimated_financial_loss": yield_impact.get("estimated_financial_loss_usd", 0.0),
                "economic_advice": yield_impact.get("economic_advice", ""),
                "treatment": advisory.get("treatment", []),
                "prevention": advisory.get("prevention", ""),
                "field_name": field_name
            }

            try:
                rec_id = save_prediction_record(res)
                res["id"] = rec_id
            except Exception:
                res["id"] = None

            results.append(res)
        except Exception as e:
            print(f"Batch item error on {file.filename}: {e}")

    return {
        "total_processed": len(results),
        "items": results
    }
