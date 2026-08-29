import base64
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
        raw_class = classification["raw_class_name"]

        # 2. Get Advisory / Treatments
        advisory = recommender.get_advisory(raw_class, language=language)

        # 3. Calculate Yield Impact
        yield_impact = yield_engine.calculate_impact(
            class_idx=classification["class_index"],
            crop_name=advisory["crop"],
            severity_score=classification["severity_score"],
            season_code=season_code,
            farm_acres=farm_acres
        )

        # Image preview for history
        preview_base64 = f"data:image/jpeg;base64,{base64.b64encode(content).decode('utf-8')[:1500]}..."

        # Assemble unified diagnostic payload
        result = {
            "filename": file.filename,
            "pre_check": classification["pre_check"],
            "raw_class_name": raw_class,
            "crop": advisory["crop"],
            "condition": advisory["condition"],
            "disease_name": advisory["disease_name"],
            "cause": advisory["cause"],
            "confidence": classification["confidence"],
            "severity": classification["severity"],
            "severity_score": classification["severity_score"],
            "top3": classification["top3"],
            "yield_impact": yield_impact["yield_loss_pct"],
            "risk_level": yield_impact["risk_level"],
            "estimated_financial_loss": yield_impact["estimated_financial_loss_usd"],
            "economic_advice": yield_impact["economic_advice"],
            "treatment": advisory["treatment"],
            "prevention": advisory["prevention"],
            "field_name": field_name,
            "image_preview": preview_base64
        }

        # 4. Save to persistent DB
        record_id = save_prediction_record(result)
        result["id"] = record_id

        return result

    except Exception as e:
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
            raw_class = classification["raw_class_name"]
            advisory = recommender.get_advisory(raw_class, language=language)
            yield_impact = yield_engine.calculate_impact(
                class_idx=classification["class_index"],
                crop_name=advisory["crop"],
                severity_score=classification["severity_score"],
                season_code=season_code,
                farm_acres=farm_acres
            )

            preview_base64 = f"data:image/jpeg;base64,{base64.b64encode(content).decode('utf-8')[:1500]}..."

            item = {
                "filename": file.filename,
                "pre_check": classification["pre_check"],
                "raw_class_name": raw_class,
                "crop": advisory["crop"],
                "condition": advisory["condition"],
                "disease_name": advisory["disease_name"],
                "cause": advisory["cause"],
                "confidence": classification["confidence"],
                "severity": classification["severity"],
                "severity_score": classification["severity_score"],
                "top3": classification["top3"],
                "yield_impact": yield_impact["yield_loss_pct"],
                "risk_level": yield_impact["risk_level"],
                "estimated_financial_loss": yield_impact["estimated_financial_loss_usd"],
                "treatment": advisory["treatment"],
                "prevention": advisory["prevention"],
                "field_name": field_name,
                "image_preview": preview_base64
            }

            rec_id = save_prediction_record(item)
            item["id"] = rec_id
            results.append(item)
        except Exception as err:
            results.append({
                "filename": file.filename,
                "error": str(err)
            })

    return {"total_processed": len(results), "items": results}
