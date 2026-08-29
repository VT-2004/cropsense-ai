import os
import pickle
from typing import Dict, Any

SERVICE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(os.path.dirname(SERVICE_DIR), "models")
YIELD_MODEL_PATH = os.path.join(MODELS_DIR, "yield_model.pkl")

# Average harvest revenue per acre (USD / INR baseline)
AVG_ACRE_VALUE = {
    "Tomato": 3500,
    "Potato": 2800,
    "Corn": 1200,
    "Apple": 6000,
    "Grape": 5500,
    "Peach": 4800,
    "Cherry": 7000,
    "Pepper": 3200,
    "Strawberry": 8500,
    "Soybean": 900
}

class YieldEngine:
    def __init__(self):
        self.model = None
        if os.path.exists(YIELD_MODEL_PATH):
            try:
                with open(YIELD_MODEL_PATH, "rb") as f:
                    self.model = pickle.load(f)
            except Exception as e:
                print(f"Error loading yield model: {e}")

    def calculate_impact(self, class_idx: int, crop_name: str, severity_score: int, season_code: int = 1, farm_acres: float = 1.0) -> Dict[str, Any]:
        if "healthy" in crop_name.lower() or severity_score == 0:
            return {
                "yield_loss_pct": 0.0,
                "risk_level": "Safe (No Impact)",
                "estimated_financial_loss_usd": 0.0,
                "economic_advice": "No yield reduction expected. Maintain optimal harvesting conditions."
            }

        # Predict yield loss percentage using Random Forest
        if self.model is not None:
            try:
                pred = self.model.predict([[severity_score, class_idx, season_code]])[0]
                loss_pct = round(float(pred) * 100, 1)
            except Exception:
                loss_pct = round(severity_score * 12.5, 1)
        else:
            loss_pct = round(severity_score * 12.5, 1)

        loss_pct = max(0.0, min(95.0, loss_pct))

        # Risk classification
        if loss_pct >= 50.0:
            risk_level = "Severe Yield Threat"
            econ_advice = "Immediate chemical or biological intervention needed to prevent total plot loss."
        elif loss_pct >= 25.0:
            risk_level = "Moderate Economic Concern"
            econ_advice = "Targeted treatment within 48 hours recommended to salvage crop yield."
        else:
            risk_level = "Low Impact (Manageable)"
            econ_advice = "Monitor leaf progression and practice preventative spraying."

        # Financial estimate
        clean_crop = crop_name.split()[0]
        per_acre_val = AVG_ACRE_VALUE.get(clean_crop, 2500)
        total_plot_val = per_acre_val * max(0.1, farm_acres)
        financial_loss = round((loss_pct / 100.0) * total_plot_val, 2)

        return {
            "yield_loss_pct": loss_pct,
            "risk_level": risk_level,
            "estimated_financial_loss_usd": financial_loss,
            "economic_advice": econ_advice,
            "farm_acres": farm_acres
        }

yield_engine = YieldEngine()
