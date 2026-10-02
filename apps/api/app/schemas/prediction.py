"""
Prediction Request & Response Schemas
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from pydantic import BaseModel, Field


class RiskTier(str, Enum):
    LOW = "LOW"
    BORDERLINE = "BORDERLINE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class TargetPrediction(BaseModel):
    """Calibrated prediction for an individual vessel or overall CAD status."""
    target: str = Field(..., description="Target vessel identifier ('CAD', 'LAD', 'LCX', 'RCA')")
    display_name: str = Field(..., description="Clinical display name")
    probability: float = Field(..., ge=0.0, le=1.0, description="Calibrated posterior probability in [0.0, 1.0]")
    binary_class: int = Field(..., ge=0, le=1, description="Binary classification (1=Stenosis/CAD, 0=Normal)")
    stenosis_suspected: bool = Field(..., description="True if probability exceeds clinical decision threshold")
    risk_tier: RiskTier = Field(..., description="Risk category ('LOW', 'BORDERLINE', 'HIGH', 'CRITICAL')")
    optimal_threshold: float = Field(..., description="Optimized decision threshold derived via Stratified CV")
    color_hex: str = Field(..., description="Hexadecimal color for 3D anatomical WebGL mapping")
    color_rgb: list[float] = Field(..., description="Normalized [r, g, b] floats in [0, 1] for WebGL shaders")
    emissive_pulse: bool = Field(..., description="True if vessel requires visual warning pulse in 3D canvas")


class PredictionResponse(BaseModel):
    """Complete prediction payload covering overall CAD and all 3 coronary vessels."""
    patient_id: str | None = Field(default=None, description="Optional patient identifier")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    overall_cad: TargetPrediction = Field(..., description="Overall CAD classification")
    vessels: dict[str, TargetPrediction] = Field(..., description="Coronary artery predictions keyed by vessel name")
    high_risk_vessels: list[str] = Field(..., description="List of vessels with suspected critical stenosis")
    clinical_summary: str = Field(..., description="Auto-generated concise clinical interpretation")
    disclaimer: str = Field(..., description="Clinical decision support disclaimer")
