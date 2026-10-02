"""
FastAPI Route Handlers
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
"""

import time
from typing import Literal
from fastapi import APIRouter, Query, Response, status

from apps.api.app.config import settings
from apps.api.app.schemas import (
    CompleteAnalysisResponse,
    ExplanationResponse,
    HealthResponse,
    PatientInputSchema,
    PredictionResponse,
    VesselExplanation,
)
from apps.api.app.services import explain_patient, model_service, predict_patient

api_router = APIRouter()


@api_router.get(
    "/health",
    response_model=HealthResponse,
    summary="System Health & Readiness Check",
    tags=["System"],
)
def get_health() -> HealthResponse:
    """Returns the operational status, loaded model heads, and feature count."""
    return HealthResponse(
        status="READY" if model_service.is_ready else "INITIALIZING",
        version=settings.VERSION,
        models_loaded=list(model_service.models.keys()),
        feature_count=55,
        disclaimer=settings.CLINICAL_DISCLAIMER,
    )


@api_router.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Predict Multi-Target Cardiovascular Risk",
    tags=["Inference"],
)
def predict_cardiac_risk(
    patient: PatientInputSchema,
    response: Response,
) -> PredictionResponse:
    """
    Evaluates patient clinical parameters across 4 calibrated gradient-boosted heads.
    Returns overall CAD risk, LAD/LCX/RCA stenosis probabilities, and WebGL color uniforms.
    """
    response.headers["X-Clinical-Disclaimer"] = "Decision-Support-Only"
    return predict_patient(patient)


@api_router.post(
    "/explain",
    response_model=ExplanationResponse,
    summary="TreeSHAP Feature Attributions for Selected Vessel",
    tags=["Explainability"],
)
def explain_vessel_risk(
    patient: PatientInputSchema,
    response: Response,
    target: Literal["LAD", "LCX", "RCA", "CAD"] = Query(
        default="LAD",
        description="Target vessel or diagnosis to explain with TreeSHAP",
    ),
    top_k: int = Query(default=8, ge=3, le=20, description="Number of top clinical drivers to return"),
) -> ExplanationResponse:
    """
    Computes real-time TreeSHAP feature attributions for the specified target vessel.
    Translates encoded features into human-readable clinical risk factors.
    """
    response.headers["X-Clinical-Disclaimer"] = "Decision-Support-Only"
    explanation = explain_patient(patient=patient, target=target, top_k=top_k)
    return ExplanationResponse(
        patient_id=patient.patient_id,
        target_vessel=target,
        explanation=explanation,
        disclaimer=settings.CLINICAL_DISCLAIMER,
    )


@api_router.post(
    "/analyze",
    response_model=CompleteAnalysisResponse,
    summary="Unified Prediction & Explanation (Single Round-Trip)",
    tags=["Inference"],
)
def analyze_patient_complete(
    patient: PatientInputSchema,
    response: Response,
    top_k: int = Query(default=6, ge=3, le=15, description="Number of top drivers per target"),
) -> CompleteAnalysisResponse:
    """
    High-performance combined endpoint executing both 4-head calibrated prediction
    and multi-target TreeSHAP explainability in a single round-trip (< 50ms).
    Optimized for seamless WebGL 3D dashboard synchronization.
    """
    start_time = time.perf_counter()
    response.headers["X-Clinical-Disclaimer"] = "Decision-Support-Only"

    predictions = predict_patient(patient)

    explanations: dict[str, VesselExplanation] = {}
    for target in ["CAD", "LAD", "LCX", "RCA"]:
        explanations[target.lower()] = explain_patient(patient=patient, target=target, top_k=top_k)

    latency = (time.perf_counter() - start_time) * 1000.0

    return CompleteAnalysisResponse(
        patient_id=patient.patient_id,
        predictions=predictions,
        explanations=explanations,
        latency_ms=round(latency, 2),
        disclaimer=settings.CLINICAL_DISCLAIMER,
    )


@api_router.get(
    "/sample-patient",
    response_model=PatientInputSchema,
    summary="Get Sample Patient Clinical Fixture",
    tags=["Testing"],
)
def get_sample_patient(
    profile: Literal["normal", "high_risk_lad", "triple_vessel"] = Query(
        default="high_risk_lad",
        description="Clinical phenotype profile to populate",
    ),
) -> PatientInputSchema:
    """Returns sample clinical patient fixtures for immediate testing or UI demo loading."""
    if profile == "normal":
        return PatientInputSchema(
            patient_id="PT-HEALTHY-01",
            Age=45.0,
            Weight=68.0,
            Length=175.0,
            Sex="Male",
            BMI=22.2,
            DM="0",
            HTN="0",
            Current_Smoker="0",
            BP=115.0,
            PR=65.0,
            Typical_Chest_Pain="0",
            Function_Class="0",
            FBS=85.0,
            CR=0.8,
            TG=95.0,
            LDL=80.0,
            HDL=55.0,
            BUN=14.0,
            ESR=8.0,
            HB=14.5,
            EF_TTE=60.0,
            Region_RWMA="0",
            VHD="N",
        )
    elif profile == "triple_vessel":
        return PatientInputSchema(
            patient_id="PT-SEVERE-CAD-03",
            Age=72.0,
            Weight=85.0,
            Length=168.0,
            Sex="Male",
            BMI=30.1,
            DM="1",
            HTN="1",
            Current_Smoker="1",
            BP=165.0,
            PR=88.0,
            Typical_Chest_Pain="1",
            Dyspnea="Y",
            Function_Class="3",
            St_Elevation="1",
            St_Depression="1",
            Tinversion="1",
            FBS=185.0,
            CR=1.4,
            TG=280.0,
            LDL=165.0,
            HDL=32.0,
            BUN=28.0,
            ESR=45.0,
            HB=12.2,
            EF_TTE=35.0,
            Region_RWMA="4",
            VHD="Moderate",
        )
    else:  # high_risk_lad
        return PatientInputSchema(
            patient_id="PT-LAD-ISCHEMIA-02",
            Age=64.0,
            Weight=80.0,
            Length=170.0,
            Sex="Male",
            BMI=27.68,
            DM="1",
            HTN="1",
            Current_Smoker="1",
            BP=145.0,
            PR=82.0,
            Typical_Chest_Pain="1",
            Function_Class="2",
            St_Elevation="1",
            Tinversion="1",
            FBS=130.0,
            CR=1.1,
            TG=210.0,
            LDL=140.0,
            HDL=36.0,
            BUN=20.0,
            ESR=28.0,
            HB=13.5,
            EF_TTE=42.0,
            Region_RWMA="1",  # Anterior Wall RWMA
            VHD="N",
        )
