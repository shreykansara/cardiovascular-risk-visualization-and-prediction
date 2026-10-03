"""
Pydantic Schemas for Structured Clinical & Patient Reports
Multimodal AI Hackathon 2026 - Perfusion3D
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from apps.api.app.schemas.patient import PatientInputSchema
from apps.api.app.schemas.prediction import PredictionResponse
from apps.api.app.schemas.xai import VesselExplanation


class ReportRequestSchema(BaseModel):
    """Payload sent from frontend to generate clinical or patient reports."""
    patient: PatientInputSchema = Field(..., description="Patient input physiological parameters")
    predictions: Optional[Dict[str, Any]] = Field(default=None, description="Precomputed model predictions")
    explanations: Optional[Dict[str, Any]] = Field(default=None, description="Precomputed TreeSHAP explanations")


class LLMConfigStatusResponse(BaseModel):
    """Diagnostics on LLM API configuration status."""
    configured: bool
    provider: str
    model: str
    fallback_available: bool
