import os
import json
import numpy as np
from PIL import Image
import io
from typing import Dict, Any, List

SERVICE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(os.path.dirname(SERVICE_DIR), "models")

CLASS_NAMES_PATH = os.path.join(MODELS_DIR, "class_names.json")
EFFICIENTNET_KERAS = os.path.join(MODELS_DIR, "efficientnet_disease_model.keras")
EFFICIENTNET_H5 = os.path.join(MODELS_DIR, "efficientnet.h5")
MOBILENET_KERAS = os.path.join(MODELS_DIR, "mobilenet.keras")
MOBILENET_H5 = os.path.join(MODELS_DIR, "mobilenet.h5")

class LeafClassifier:
    def __init__(self):
        self.disease_model = None
        self.binary_model = None
        self.class_names = {}
        self._load_class_names()
        self._load_models()

    def _load_class_names(self):
        if os.path.exists(CLASS_NAMES_PATH):
            try:
                with open(CLASS_NAMES_PATH, "r", encoding="utf-8") as f:
                    raw = json.load(f)
                    self.class_names = {int(k): v for k, v in raw.items()}
                print(f"Loaded {len(self.class_names)} class names.")
            except Exception as e:
                print(f"Error loading class names: {e}")

    def _load_models(self):
        import tensorflow as tf
        
        # Load EfficientNet Disease Classifier
        if os.path.exists(EFFICIENTNET_KERAS):
            try:
                self.disease_model = tf.keras.models.load_model(EFFICIENTNET_KERAS)
                print("Loaded EfficientNet model from .keras")
            except Exception as e:
                print(f"Failed to load .keras: {e}")
                
        if self.disease_model is None and os.path.exists(EFFICIENTNET_H5):
            try:
                self.disease_model = tf.keras.models.load_model(EFFICIENTNET_H5)
                print("Loaded EfficientNet model from .h5")
            except Exception as e:
                print(f"Failed to load .h5: {e}")

        # Load MobileNet Binary Classifier
        if os.path.exists(MOBILENET_KERAS):
            try:
                self.binary_model = tf.keras.models.load_model(MOBILENET_KERAS)
                print("Loaded MobileNet binary model from .keras")
            except Exception as e:
                print(f"Failed to load MobileNet .keras: {e}")
                
        if self.binary_model is None and os.path.exists(MOBILENET_H5):
            try:
                self.binary_model = tf.keras.models.load_model(MOBILENET_H5)
                print("Loaded MobileNet binary model from .h5")
            except Exception as e:
                print(f"Failed to load MobileNet .h5: {e}")

    def preprocess_image(self, image_bytes: bytes) -> np.ndarray:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((224, 224))
        img_arr = np.array(img, dtype=np.float32)
        return np.expand_dims(img_arr, axis=0)

    def predict(self, image_bytes: bytes) -> Dict[str, Any]:
        batch = self.preprocess_image(image_bytes)

        # 1. Binary Pre-Check (Healthy vs Diseased)
        pre_check = "Diseased"
        if self.binary_model is not None:
            try:
                bin_pred = self.binary_model.predict(batch, verbose=0)[0]
                p_healthy = float(bin_pred[0])
                p_diseased = float(bin_pred[1])
                pre_check = "Healthy" if p_healthy > p_diseased else "Diseased"
            except Exception as e:
                print(f"Binary prediction warning: {e}")

        # 2. 38-Class Disease Classifier
        if self.disease_model is None:
            raise RuntimeError("Disease classification model is not loaded.")

        preds = self.disease_model.predict(batch, verbose=0)[0]
        top_idx = int(np.argmax(preds))
        confidence = float(preds[top_idx])
        raw_key = self.class_names.get(top_idx, "Unknown___Unknown")

        # Top 3 probabilities
        top3_indices = np.argsort(preds)[::-1][:3]
        top3_list = []
        for idx in top3_indices:
            name = self.class_names.get(int(idx), "Unknown")
            top3_list.append({
                "class_name": name.replace("___", " - ").replace("_", " "),
                "confidence": round(float(preds[idx]) * 100, 2)
            })

        # Severity Estimation
        if "healthy" in raw_key.lower():
            severity = "Healthy"
            severity_score = 0
        elif confidence >= 0.85:
            severity = "Severe"
            severity_score = 5
        elif confidence >= 0.65:
            severity = "Moderate"
            severity_score = 3
        else:
            severity = "Mild"
            severity_score = 1

        return {
            "class_index": top_idx,
            "raw_class_name": raw_key,
            "confidence": round(confidence * 100, 2),
            "pre_check": pre_check,
            "severity": severity,
            "severity_score": severity_score,
            "top3": top3_list
        }

classifier = LeafClassifier()
