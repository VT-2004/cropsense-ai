from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routes.predict import router as predict_router
from routes.history import router as history_router
from routes.report import router as report_router

app = FastAPI(
    title="CropSense AI Backend",
    description="FastAPI Backend for crop disease detection, severity estimation, yield loss prediction & agronomic advisory.",
    version="1.0.0"
)

# Open CORS for all client origins (Vercel, localhost, mobile, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Include Routers
app.include_router(predict_router)
app.include_router(history_router)
app.include_router(report_router)

@app.get("/")
def root():
    return {
        "app": "CropSense AI API",
        "status": "online",
        "docs_url": "/docs",
        "models_status": "loaded"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "services": {
            "disease_classifier": "ready",
            "binary_precheck": "ready",
            "yield_engine": "ready",
            "advisory_kb": "ready"
        }
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={"Access-Control-Allow-Origin": "*"}
    )

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
