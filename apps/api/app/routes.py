"""
FastAPI Route Handlers
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
"""

import time
from typing import Any, Dict, List, Literal, Optional
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
        service="Perfusion3D API",
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

    # Reuse pretransformed feature matrix for sub-10ms explainability
    df = patient.to_feature_dataframe()
    X_trans = model_service.preprocessor.transform(df)

    explanations: dict[str, VesselExplanation] = {}
    for target in ["CAD", "LAD", "LCX", "RCA"]:
        t_lower = target.lower()
        prob = predictions.overall_cad.probability if target == "CAD" else predictions.vessels[t_lower].probability
        explanations[t_lower] = explain_patient(
            patient=patient,
            target=target,
            top_k=top_k,
            pretransformed_x=X_trans,
            precomputed_prob=prob,
        )

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
    profile: Literal["normal", "high_risk_lad", "rca_ischemia", "triple_vessel"] = Query(
        default="high_risk_lad",
        description="Clinical phenotype profile to populate",
    ),
) -> PatientInputSchema:
    """Returns sample clinical patient fixtures for immediate testing or UI demo loading."""
    if profile == "normal":
        return PatientInputSchema(
            patient_id="PT-HEALTHY-01",
            Age=38.0,
            Weight=66.0,
            Length=166.0,
            Sex="Male",
            BMI=23.95,
            DM="0",
            HTN="0",
            Current_Smoker="0",
            BP=110.0,
            PR=70.0,
            Typical_Chest_Pain="0",
            Function_Class="0",
            St_Elevation="0",
            St_Depression="0",
            Tinversion="0",
            Q_Wave="0",
            FBS=80.0,
            CR=0.6,
            TG=41.0,
            LDL=85.0,
            HDL=65.0,
            BUN=10.0,
            ESR=8.0,
            HB=14.0,
            EF_TTE=60.0,
            Region_RWMA="0",
            VHD="N",
            Lymph=35.0,
            Neut=55.0,
            PLT=220.0,
        )
    elif profile == "rca_ischemia":
        return PatientInputSchema(
            patient_id="PT-INFERIOR-RCA-04",
            Age=62.0,
            Weight=65.0,
            Length=168.0,
            Sex="Male",
            BMI=23.03,
            DM="1",
            HTN="1",
            Current_Smoker="0",
            BP=142.0,
            PR=68.0,
            Typical_Chest_Pain="0",
            Atypical="Y",
            Function_Class="1",
            St_Elevation="0",
            St_Depression="1",
            Tinversion="1",
            Q_Wave="0",
            FBS=155.0,
            CR=1.2,
            TG=130.0,
            LDL=85.0,
            HDL=38.0,
            BUN=18.0,
            ESR=30.0,
            HB=13.0,
            EF_TTE=55.0,
            Region_RWMA="2",  # Inferior Wall RWMA (RCA Territory)
            VHD="N",
            Lymph=16.0,
            Neut=70.0,
            PLT=220.0,
        )
    elif profile == "triple_vessel":
        return PatientInputSchema(
            patient_id="PT-SEVERE-CAD-03",
            Age=72.0,
            Weight=85.0,
            Length=168.0,
            Sex="Male",
            BMI=30.11,
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
            Q_Wave="1",
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
            Lymph=22.0,
            Neut=72.0,
            PLT=275.0,
        )
    else:  # high_risk_lad
        return PatientInputSchema(
            patient_id="PT-LAD-ISCHEMIA-02",
            Age=47.0,
            Weight=75.0,
            Length=165.0,
            Sex="Female",
            BMI=27.55,
            DM="0",
            HTN="0",
            Current_Smoker="0",
            BP=120.0,
            PR=90.0,
            Typical_Chest_Pain="1",
            Function_Class="0",
            St_Elevation="1",
            St_Depression="0",
            Tinversion="0",
            Q_Wave="0",
            FBS=84.0,
            CR=1.1,
            TG=97.0,
            LDL=83.0,
            HDL=24.0,
            BUN=13.0,
            ESR=15.0,
            HB=12.8,
            EF_TTE=45.0,
            Region_RWMA="1",  # Anterior Wall RWMA
            VHD="mild",
            Lymph=23.0,
            Neut=67.0,
            PLT=201.0,
        )


# ==============================================================================
# Phase 5: Structured Report Generation Endpoints
# ==============================================================================

from apps.api.app.schemas.report import ReportRequestSchema, LLMConfigStatusResponse
from apps.api.app.services.llm_service import (
    get_groq_config,
    get_groq_model_status,
    build_report_context,
    generate_report,
)


@api_router.get(
    "/reports/status",
    response_model=LLMConfigStatusResponse,
    summary="Check Groq API Configuration Status",
    tags=["Reporting"],
)
def get_reports_status() -> LLMConfigStatusResponse:
    key, model = get_groq_config()
    model_status = get_groq_model_status()
    return LLMConfigStatusResponse(
        configured=key is not None,
        model=model,
        model_status=model_status,
        fallback_available=True,
    )


@api_router.post(
    "/reports/technical",
    summary="Generate Structured Technical Report for Clinicians",
    tags=["Reporting"],
)
def generate_technical_report_endpoint(
    req: ReportRequestSchema,
    response: Response,
) -> dict[str, Any]:
    """Generates structured 8-section technical report for clinician review."""
    response.headers["X-Clinical-Disclaimer"] = "Decision-Support-Only"
    preds = req.predictions
    exps = req.explanations
    if not preds or not exps:
        full_analysis = analyze_patient_complete(req.patient, response, top_k=6)
        preds = full_analysis.predictions.model_dump()
        exps = {k: v.model_dump() for k, v in full_analysis.explanations.items()}

    context = build_report_context(
        patient_data=req.patient.model_dump(by_alias=True),
        predictions=preds,
        explanations=exps,
        model_metadata=model_service.metadata,
    )
    return generate_report(report_type="technical", context=context)


@api_router.post(
    "/reports/patient",
    summary="Generate Plain-Language Heart Health Summary for Patients",
    tags=["Reporting"],
)
def generate_patient_report_endpoint(
    req: ReportRequestSchema,
    response: Response,
) -> dict[str, Any]:
    """Generates friendly, plain-language 8-section summary for patient comprehension."""
    response.headers["X-Clinical-Disclaimer"] = "Decision-Support-Only"
    preds = req.predictions
    exps = req.explanations
    if not preds or not exps:
        full_analysis = analyze_patient_complete(req.patient, response, top_k=6)
        preds = full_analysis.predictions.model_dump()
        exps = {k: v.model_dump() for k, v in full_analysis.explanations.items()}

    context = build_report_context(
        patient_data=req.patient.model_dump(by_alias=True),
        predictions=preds,
        explanations=exps,
        model_metadata=model_service.metadata,
    )
    return generate_report(report_type="patient", context=context)

