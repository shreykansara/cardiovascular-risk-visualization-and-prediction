"""
Explainable AI (XAI) Schemas: TreeSHAP Attributions & Complete Analysis
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any
from pydantic import BaseModel, Field

from apps.api.app.schemas.prediction import PredictionResponse


class ImpactDirection(str, Enum):
    INCREASES_RISK = "INCREASES_RISK"
    DECREASES_RISK = "DECREASES_RISK"


class FeatureAttribution(BaseModel):
    """Local Shapley feature attribution for a single clinical parameter."""
    feature_name: str = Field(..., description="Raw transformed feature identifier")
    clinical_label: str = Field(..., description="Clinician-friendly display name")
    feature_value: str = Field(..., description="Patient's observed clinical value")
    shap_value: float = Field(..., description="TreeSHAP additive attribution value (phi_i)")
    impact: ImpactDirection = Field(..., description="Direction of impact ('INCREASES_RISK' or 'DECREASES_RISK')")
    absolute_importance: float = Field(..., description="Absolute magnitude of attribution")


class VesselExplanation(BaseModel):
    """TreeSHAP local explanation breakdown for a specific target head."""
    target: str = Field(..., description="Target vessel identifier ('CAD', 'LAD', 'LCX', 'RCA')")
    display_name: str = Field(..., description="Target clinical label")
    base_value: float = Field(..., description="Expected baseline risk across the training population (phi_0)")
    predicted_probability: float = Field(..., description="Calibrated predicted probability")
    top_features: list[FeatureAttribution] = Field(..., description="Top contributing clinical features")


class ExplanationResponse(BaseModel):
    """Payload returned by the /explain endpoint for a single target."""
    patient_id: str | None = Field(default=None)
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    target_vessel: str = Field(..., description="Requested target identifier")
    explanation: VesselExplanation = Field(...)
    disclaimer: str = Field(...)


class CompleteAnalysisResponse(BaseModel):
    """Combined single round-trip payload returning all predictions and explanations."""
    patient_id: str | None = Field(default=None)
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    predictions: PredictionResponse = Field(..., description="Full multi-target predictions")
    explanations: dict[str, VesselExplanation] = Field(..., description="TreeSHAP explanations for each target head")
    latency_ms: float = Field(..., description="End-to-end inference latency in milliseconds")
    disclaimer: str = Field(...)
