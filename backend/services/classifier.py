import os
import json
import gc
import numpy as np
from PIL import Image
import io
from typing import Dict, Any, List

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

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
        try:
            import tensorflow as tf
            tf.config.threading.set_inter_op_parallelism_threads(1)
            tf.config.threading.set_intra_op_parallelism_threads(2)

            # Load EfficientNet with compile=False for ultra-low memory usage
            if os.path.exists(EFFICIENTNET_KERAS):
                try:
                    self.disease_model = tf.keras.models.load_model(EFFICIENTNET_KERAS, compile=False)
                    print("Loaded EfficientNet model (compile=False)")
                except Exception as e:
                    print(f"Failed to load .keras: {e}")
                    
            if self.disease_model is None and os.path.exists(EFFICIENTNET_H5):
                try:
                    self.disease_model = tf.keras.models.load_model(EFFICIENTNET_H5, compile=False)
                    print("Loaded EfficientNet model from .h5 (compile=False)")
                except Exception as e:
                    print(f"Failed to load .h5: {e}")

            # Load MobileNet Binary Classifier with compile=False
            if os.path.exists(MOBILENET_KERAS):
                try:
                    self.binary_model = tf.keras.models.load_model(MOBILENET_KERAS, compile=False)
                    print("Loaded MobileNet binary model (compile=False)")
                except Exception as e:
                    print(f"Failed to load MobileNet .keras: {e}")
                    
            if self.binary_model is None and os.path.exists(MOBILENET_H5):
                try:
                    self.binary_model = tf.keras.models.load_model(MOBILENET_H5, compile=False)
                    print("Loaded MobileNet binary model from .h5 (compile=False)")
                except Exception as e:
                    print(f"Failed to load MobileNet .h5: {e}")

            gc.collect()
        except Exception as e:
            print(f"TensorFlow initialization exception: {e}")

    def preprocess_image(self, image_bytes: bytes, target_size=(224, 224)) -> np.ndarray:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image = image.resize(target_size, Image.Resampling.BILINEAR)
        img_array = np.array(image, dtype=np.float32)
        # Standard [0, 255] for EfficientNet or normalized if model requires
        img_array = np.expand_dims(img_array, axis=0)
        return img_array

    def predict(self, image_bytes: bytes) -> Dict[str, Any]:
        if self.disease_model is None:
            raise RuntimeError("EfficientNet disease model is not loaded.")

        # 1. Pre-check with Binary Classifier (if available)
        pre_check = "Diseased"
        if self.binary_model is not None:
            try:
                img_binary = self.preprocess_image(image_bytes, target_size=(224, 224))
                bin_preds = self.binary_model.predict(img_binary, verbose=0)
                if bin_preds.shape[-1] == 1:
                    pre_check = "Healthy" if bin_preds[0][0] < 0.5 else "Diseased"
                else:
                    pre_check = "Healthy" if np.argmax(bin_preds[0]) == 0 else "Diseased"
            except Exception as e:
                print(f"Binary pre-check warning: {e}")
                pre_check = "Unknown"

        # 2. Main Disease Classifier Inference
        img_main = self.preprocess_image(image_bytes, target_size=(224, 224))
        preds = self.disease_model.predict(img_main, verbose=0)[0]

        top_indices = np.argsort(preds)[::-1][:3]
        predicted_idx = int(top_indices[0])
        confidence = float(preds[predicted_idx]) * 100.0

        raw_class_name = self.class_names.get(predicted_idx, f"Class_{predicted_idx}")

        # Parse crop and disease name
        if "___" in raw_class_name:
            crop_part, disease_part = raw_class_name.split("___", 1)
            crop = crop_part.replace("_", " ").strip()
            disease = disease_part.replace("_", " ").strip()
        else:
            parts = raw_class_name.split("_", 1)
            crop = parts[0]
            disease = parts[1] if len(parts) > 1 else "Unknown"

        top3 = []
        for idx in top_indices:
            name = self.class_names.get(int(idx), f"Class_{idx}").replace("___", " - ").replace("_", " ")
            top3.append({
                "class_name": name,
                "confidence": round(float(preds[idx]) * 100.0, 2)
            })

        is_healthy = "healthy" in disease.lower() or "healthy" in raw_class_name.lower()
        if is_healthy:
            severity = "Healthy"
            severity_score = 0
        elif confidence > 85:
            severity = "Severe"
            severity_score = 4
        elif confidence > 65:
            severity = "Moderate"
            severity_score = 3
        else:
            severity = "Mild"
            severity_score = 2

        return {
            "raw_class": raw_class_name,
            "crop": crop,
            "disease_name": f"{crop} - {disease}" if not is_healthy else f"Healthy {crop}",
            "confidence": round(confidence, 2),
            "pre_check": pre_check,
            "severity": severity,
            "severity_score": severity_score,
            "top3": top3,
            "disease_code": predicted_idx
        }

classifier = LeafClassifier()
