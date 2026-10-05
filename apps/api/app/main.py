"""
FastAPI Main Application Entrypoint
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from apps.api.app.config import settings
from apps.api.app.routes import api_router
from apps.api.app.services.model_service import model_service
from apps.api.app.utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager: loads ML models into memory before accepting traffic."""
    logger.info("Initializing Cardiovascular Risk Inference Engine...")
    try:
        from apps.api.app.services.llm_service import load_and_check_env, verify_groq_startup
        load_and_check_env()
        model_service.load_artifacts()
        logger.info("Startup complete: 4 prediction heads and TreeSHAP explainers ready.")
        
        # Verify Groq model availability on startup (Task 1.8)
        verify_groq_startup()
    except Exception as e:
        logger.error(f"FATAL during model loading: {e}", exc_info=True)
        raise
    yield
    logger.info("Shutting down inference engine...")


app = FastAPI(
    title="Perfusion3D API",
    version=settings.VERSION,
    description="High-Throughput Multi-Target Coronary Stenosis & Ischemia Prediction Engine with Sub-4ms TreeSHAP Explainability",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for local development and WebGL frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_clinical_disclaimer_header(request: Request, call_next):
    """Injects mandatory clinical decision-support warning header into every API response."""
    response = await call_next(request)
    response.headers["X-Application-Name"] = "Perfusion3D"
    response.headers["X-Clinical-Decision-Support"] = "True"
    response.headers["X-SaMD-Category"] = "Class-IIa-Educational-Prototype"
    return response


# Root health probe for load balancers and orchestrators
@app.get("/health", tags=["System"])
def root_health():
    return {
        "service": "Perfusion3D API",
        "status": "READY" if model_service.is_ready else "INITIALIZING",
        "version": settings.VERSION,
        "disclaimer": settings.CLINICAL_DISCLAIMER,
    }


from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse

# Mount API V1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount production Web UI and 3D assets if build distribution exists
if settings.WEB_DIST_DIR.exists():
    logger.info(f"Mounting production Web UI from {settings.WEB_DIST_DIR}")
    assets_dir = settings.WEB_DIST_DIR / "assets"
    models_dir = settings.WEB_DIST_DIR / "models"
    
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")
    if models_dir.exists():
        app.mount("/models", StaticFiles(directory=str(models_dir)), name="models")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path.startswith("health"):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        file_path = settings.WEB_DIST_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(settings.WEB_DIST_DIR / "index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("apps.api.app.main:app", host="0.0.0.0", port=8000, reload=True)
