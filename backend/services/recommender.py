import os
import json
from typing import Dict, Any, List

SERVICE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(os.path.dirname(SERVICE_DIR), "models")
KB_PATH = os.path.join(MODELS_DIR, "treatments_kb.json")

# Hindi translations for common agricultural conditions & crops
HINDI_CROP_MAP = {
    "Apple": "सेब (Apple)",
    "Blueberry": "ब्लूबेरी (Blueberry)",
    "Cherry": "चेरी (Cherry)",
    "Corn": "मक्का (Corn / Maize)",
    "Grape": "अंगूर (Grape)",
    "Orange": "संतरा (Orange / Citrus)",
    "Peach": "आड़ू (Peach)",
    "Pepper": "शिमला मिर्च (Pepper / Bell Pepper)",
    "Potato": "आलू (Potato)",
    "Raspberry": "रास्पबेरी (Raspberry)",
    "Soybean": "सोयाबीन (Soybean)",
    "Squash": "कद्दू / तोरी (Squash)",
    "Strawberry": "स्ट्रॉबेरी (Strawberry)",
    "Tomato": "टमाटर (Tomato)"
}

HINDI_CONDITION_MAP = {
    "Apple scab": "सेब का पपड़ी रोग (Apple Scab)",
    "Black rot": "काला सड़न रोग (Black Rot)",
    "Cedar apple rust": "देवदार सेब रतुआ (Cedar Apple Rust)",
    "healthy": "स्वस्थ पत्ती (Healthy)",
    "Powdery mildew": "चूर्णी फफूंद (Powdery Mildew)",
    "Cercospora leaf spot Gray leaf spot": "सर्कॉस्पोरा धब्बा रोग (Gray Leaf Spot)",
    "Common rust": "सामान्य रतुआ (Common Rust)",
    "Northern Leaf Blight": "उत्तरी पत्ती झुलसा रोग (Northern Leaf Blight)",
    "Early blight": "अगेती झुलसा (Early Blight)",
    "Late blight": "पछेती झुलसा (Late Blight)",
    "Leaf scorch": "पत्ती झुलस (Leaf Scorch)",
    "Bacterial spot": "जीवाणु धब्बा रोग (Bacterial Spot)",
    "Target Spot": "लक्ष्य धब्बा (Target Spot)",
    "Yellow Leaf Curl Virus": "पीली पत्ती मरोड़िया वायरस (Yellow Leaf Curl Virus)",
    "mosaic virus": "मोज़ेक वायरस (Mosaic Virus)",
    "Two-spotted spider mite": "लाल मकड़ी कीट (Spider Mites)",
    "Leaf Mold": "पत्ती फफूंद (Leaf Mold)",
    "Septoria leaf spot": "सेप्टोरिया पत्ती धब्बा (Septoria Leaf Spot)",
    "Citrus greening": "सिट्रस ग्रीनिंग रोग (Citrus Greening / Huanglongbing)"
}

class TreatmentRecommender:
    def __init__(self):
        self.kb = {}
        if os.path.exists(KB_PATH):
            try:
                with open(KB_PATH, "r", encoding="utf-8") as f:
                    self.kb = json.load(f)
            except Exception as e:
                print(f"Error loading treatment KB: {e}")

    def get_advisory(self, raw_class_name: str, language: str = "en") -> Dict[str, Any]:
        info = self.kb.get(raw_class_name, {})
        
        # Parse crop and condition from standard class string (e.g. Tomato___Late_blight)
        parts = raw_class_name.split("___")
        crop_raw = parts[0].replace("_", " ") if len(parts) > 0 else "Crop"
        condition_raw = parts[1].replace("_", " ") if len(parts) > 1 else "Unknown Condition"

        disease_display = info.get("disease_name", raw_class_name.replace("___", " - ").replace("_", " "))
        treatments = info.get("treatment", [
            "Prune infected plant foliage immediately.",
            "Apply recommended copper fungicide or bio-pesticide spray.",
            "Ensure proper field drainage and morning-only watering."
        ])
        prevention = info.get("prevention", "Practice crop rotation, maintain clean equipment, and use disease-free seeds.")
        cause = info.get("cause", "Pathogenic infection affecting leaf surface.")

        # If Hindi requested, enrich with Hindi localized advisory
        if language.lower() == "hi":
            crop_hi = HINDI_CROP_MAP.get(crop_raw.split()[0], crop_raw)
            condition_hi = HINDI_CONDITION_MAP.get(condition_raw, condition_raw)
            return {
                "crop": crop_hi,
                "condition": condition_hi,
                "disease_name": f"{crop_hi} - {condition_hi}",
                "cause": f"रोगजनक संक्रमण जो {crop_hi} की पत्तियों को प्रभावित करता है।",
                "treatment": [
                    "संक्रमित पत्तियों को तुरंत काटकर नष्ट करें ताकि रोग आगे न फैले।",
                    "तांबा आधारित कवकनाशी (कॉपर ऑक्सीक्लोराइड 2.5g/L) या मैंकोज़ेब का छिड़काव करें।",
                    "शाम को पानी देने से बचें ताकि पत्तियों पर नमी जमा न हो।"
                ],
                "prevention": "फसल चक्र अपनाएं, प्रमाणित बीजों का उपयोग करें और खेत को खरपतवार मुक्त रखें।"
            }

        return {
            "crop": crop_raw,
            "condition": condition_raw,
            "disease_name": disease_display,
            "cause": cause,
            "treatment": treatments,
            "prevention": prevention
        }

recommender = TreatmentRecommender()
