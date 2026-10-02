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
        model_service.load_artifacts()
        logger.info("Startup complete: 4 prediction heads and TreeSHAP explainers ready.")
    except Exception as e:
        logger.error(f"FATAL during model loading: {e}", exc_info=True)
        raise
    yield
    logger.info("Shutting down inference engine...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Production Inference Engine & TreeSHAP Local Attributions for "
        "Multimodal Cardiovascular Risk Prediction and 3D Anatomical Visualization."
    ),
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
    response.headers["X-Clinical-Decision-Support"] = "True"
    response.headers["X-SaMD-Category"] = "Class-IIa-Educational-Prototype"
    return response


# Root health probe for load balancers and orchestrators
@app.get("/health", tags=["System"])
def root_health():
    return {
        "status": "READY" if model_service.is_ready else "INITIALIZING",
        "version": settings.VERSION,
        "disclaimer": settings.CLINICAL_DISCLAIMER,
    }


# Mount API V1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("apps.api.app.main:app", host="0.0.0.0", port=8000, reload=True)
