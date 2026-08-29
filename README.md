# 🌿 CropSense AI — Intelligent Crop Disease Diagnostic & Yield Protection Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18_|_Vite-61DAFB.svg?logo=react)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/UI-Tailwind_CSS-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Accuracy](https://img.shields.io/badge/Model_Accuracy-97.45%25-brightgreen.svg)]()

> A full-stack AI-driven precision agriculture web application. Farmers and agronomists upload crop leaf imagery to instantly detect plant diseases across 38 classes, calculate potential yield loss, view multi-step chemical/biological treatment roadmaps, and generate exportable PDF diagnostic reports.

---

## ✨ Features

- 🔬 **97.45% Fine-Tuned Disease Classifier:** Fine-tuned `EfficientNetB3` model trained on 87,900 images across 38 crop & disease classes.
- ⚡ **Dual-Model Edge Pre-Check:** `MobileNetV2` binary classifier for sub-second healthy-vs-diseased filtering.
- 📉 **Yield Impact & Economic Loss Regressor:** Scikit-Learn `RandomForestRegressor` estimating % yield reduction and monetary risk based on plot acreage, disease severity, and season.
- 💊 **Actionable Treatment & Recovery Roadmap:** Step-by-step pesticide/fungicide spray schedule, dosage recommendations, and long-term prevention protocols.
- 📸 **Live Webcam & Drag-and-Drop Uploader:** Supports camera snapshots in the field or direct image uploads.
- 📚 **Multi-Leaf Batch Scanner:** Process up to 20 leaf images simultaneously for field-wide disease surveys.
- 📊 **Time-Series Health Dashboard:** Historical scan tracking with Recharts trend visualizer and SQLite persistence.
- 📄 **One-Click PDF Diagnostic Export:** Generates agricultural diagnosis sheets via ReportLab.
- 🌐 **Bilingual Interface:** Instant one-click toggle between English and Hindi (**हिन्दी**).

---

## 🏗️ Architecture & Tech Stack

```text
cropsense-ai/
├── backend/                  # FastAPI REST API
│   ├── models/               # Pretrained ML Models & Knowledge Base
│   ├── database/             # SQLite / Supabase Persistence
│   ├── services/             # Classifier, Yield Engine, Recommender, PDF Generator
│   ├── routes/               # /api/predict, /api/history, /api/report
│   ├── main.py               # Application Entrypoint
│   └── requirements.txt
└── frontend/                 # Vite + React + TypeScript + Tailwind CSS
    ├── src/
    │   ├── components/       # ImageUploader, ResultCard, Batch, History, Navbar
    │   ├── lib/              # API Client
    │   ├── App.tsx
    │   └── index.css
    ├── package.json
    └── tailwind.config.js
```

### Technology Highlights:
- **Deep Learning / AI:** TensorFlow / Keras (EfficientNetB3, MobileNetV2), Scikit-Learn (Random Forest), SBERT (Sentence-Transformers).
- **Backend:** FastAPI, Uvicorn, Pillow, ReportLab, SQLite3.
- **Frontend:** React, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Vite.

---

## 🌾 Supported Crops & Diseases (38 Classes)

- **Apple:** Apple Scab, Black Rot, Cedar Apple Rust, Healthy
- **Blueberry:** Healthy
- **Cherry:** Powdery Mildew, Healthy
- **Corn (Maize):** Cercospora / Gray Leaf Spot, Common Rust, Northern Leaf Blight, Healthy
- **Grape:** Black Rot, Esca (Black Measles), Leaf Blight (Isariopsis), Healthy
- **Orange / Citrus:** Citrus Greening (Huanglongbing)
- **Peach:** Bacterial Spot, Healthy
- **Bell Pepper:** Bacterial Spot, Healthy
- **Potato:** Early Blight, Late Blight, Healthy
- **Raspberry:** Healthy
- **Soybean:** Healthy
- **Squash:** Powdery Mildew
- **Strawberry:** Leaf Scorch, Healthy
- **Tomato:** Bacterial Spot, Early Blight, Late Blight, Leaf Mold, Septoria Leaf Spot, Spider Mites, Target Spot, Yellow Leaf Curl Virus, Mosaic Virus, Healthy

---

## 🚀 Quickstart & Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/VT-2004/cropsense-ai.git
cd cropsense-ai
```

### 2. Start Backend
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend runs on `http://127.0.0.1:8000` (API Docs: `http://127.0.0.1:8000/docs`)*

### 3. Start Frontend
```bash
cd ../frontend
npm install
npm run dev
```
*Frontend runs on `http://127.0.0.1:5173`*

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for details.
