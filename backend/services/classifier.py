import os
import json
import gc
import numpy as np
from PIL import Image
import io
from typing import Dict, Any, List

SERVICE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(os.path.dirname(SERVICE_DIR), "models")

CLASS_NAMES_PATH = os.path.join(MODELS_DIR, "class_names.json")
EFFICIENTNET_TFLITE = os.path.join(MODELS_DIR, "efficientnet.tflite")
MOBILENET_TFLITE = os.path.join(MODELS_DIR, "mobilenet.tflite")
EFFICIENTNET_KERAS = os.path.join(MODELS_DIR, "efficientnet_disease_model.keras")
MOBILENET_KERAS = os.path.join(MODELS_DIR, "mobilenet.keras")

class LeafClassifier:
    def __init__(self):
        self.disease_interpreter = None
        self.binary_interpreter = None
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
        # 1. Try loading high-performance, low-memory TFLite first
        try:
            try:
                import tflite_runtime.interpreter as tflite
            except ImportError:
                import tensorflow.lite as tflite

            if os.path.exists(EFFICIENTNET_TFLITE):
                self.disease_interpreter = tflite.Interpreter(model_path=EFFICIENTNET_TFLITE)
                self.disease_interpreter.allocate_tensors()
                self.disease_input_details = self.disease_interpreter.get_input_details()
                self.disease_output_details = self.disease_interpreter.get_output_details()
                print("Loaded EfficientNet TFLite (Ultra-low RAM mode)")

            if os.path.exists(MOBILENET_TFLITE):
                self.binary_interpreter = tflite.Interpreter(model_path=MOBILENET_TFLITE)
                self.binary_interpreter.allocate_tensors()
                self.binary_input_details = self.binary_interpreter.get_input_details()
                self.binary_output_details = self.binary_interpreter.get_output_details()
                print("Loaded MobileNet TFLite (Ultra-low RAM mode)")

        except Exception as e:
            print(f"TFLite initialization exception: {e}")

        # 2. Fallback to Keras if TFLite is unavailable
        if self.disease_interpreter is None:
            try:
                import tensorflow as tf
                if os.path.exists(EFFICIENTNET_KERAS):
                    self.disease_model = tf.keras.models.load_model(EFFICIENTNET_KERAS, compile=False)
                    print("Loaded EfficientNet Keras fallback")
                if os.path.exists(MOBILENET_KERAS):
                    self.binary_model = tf.keras.models.load_model(MOBILENET_KERAS, compile=False)
                    print("Loaded MobileNet Keras fallback")
            except Exception as e:
                print(f"Fallback model loading exception: {e}")

        gc.collect()

    def preprocess_image(self, image_bytes: bytes, target_size=(224, 224)) -> np.ndarray:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image = image.resize(target_size, Image.Resampling.BILINEAR)
        img_array = np.array(image, dtype=np.float32)
        img_array = np.expand_dims(img_array, axis=0)
        return img_array

    def predict(self, image_bytes: bytes) -> Dict[str, Any]:
        pre_check = "Diseased"

        # 1. Binary Pre-Check (TFLite or Keras)
        try:
            img_binary = self.preprocess_image(image_bytes, target_size=(224, 224))
            if self.binary_interpreter is not None:
                self.binary_interpreter.set_tensor(self.binary_input_details[0]['index'], img_binary)
                self.binary_interpreter.invoke()
                bin_preds = self.binary_interpreter.get_tensor(self.binary_output_details[0]['index'])
            elif self.binary_model is not None:
                bin_preds = self.binary_model.predict(img_binary, verbose=0)
            else:
                bin_preds = None

            if bin_preds is not None:
                if bin_preds.shape[-1] == 1:
                    pre_check = "Healthy" if bin_preds[0][0] < 0.5 else "Diseased"
                else:
                    pre_check = "Healthy" if np.argmax(bin_preds[0]) == 0 else "Diseased"
        except Exception as e:
            print(f"Binary precheck error: {e}")
            pre_check = "Diseased"

        # 2. Main Disease Classifier (TFLite or Keras)
        img_main = self.preprocess_image(image_bytes, target_size=(224, 224))
        if self.disease_interpreter is not None:
            self.disease_interpreter.set_tensor(self.disease_input_details[0]['index'], img_main)
            self.disease_interpreter.invoke()
            preds = self.disease_interpreter.get_tensor(self.disease_output_details[0]['index'])[0]
        elif self.disease_model is not None:
            preds = self.disease_model.predict(img_main, verbose=0)[0]
        else:
            raise RuntimeError("No disease model available for inference.")

        top_indices = np.argsort(preds)[::-1][:3]
        predicted_idx = int(top_indices[0])
        confidence = float(preds[predicted_idx]) * 100.0

        raw_class_name = self.class_names.get(predicted_idx, f"Class_{predicted_idx}")

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
            "raw_class_name": raw_class_name,
            "class_index": predicted_idx,
            "disease_code": predicted_idx,
            "crop": crop,
            "disease_name": f"{crop} - {disease}" if not is_healthy else f"Healthy {crop}",
            "confidence": round(confidence, 2),
            "pre_check": pre_check,
            "severity": severity,
            "severity_score": severity_score,
            "top3": top3
        }

classifier = LeafClassifier()
