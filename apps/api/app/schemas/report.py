"""
Pydantic Schemas for Structured Clinical & Patient Reports (Task B1 & B4)
Multimodal AI Hackathon 2026 - Perfusion3D
"""

from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
from apps.api.app.schemas.patient import PatientInputSchema


class ReportRequestSchema(BaseModel):
    """Payload sent from frontend to generate clinical or patient reports."""
    patient: PatientInputSchema = Field(..., description="Patient input physiological parameters")
    predictions: Optional[Dict[str, Any]] = Field(default=None, description="Precomputed model predictions")
    explanations: Optional[Dict[str, Any]] = Field(default=None, description="Precomputed TreeSHAP explanations")


class LLMConfigStatusResponse(BaseModel):
    """Diagnostics on Groq API configuration status."""
    configured: bool
    model: str
    model_status: str = Field(default="ready", description="Status of Groq model ('ready' | 'unavailable' | 'unconfigured')")
    fallback_available: bool = True
