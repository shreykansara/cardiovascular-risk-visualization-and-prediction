"""
Pydantic Schemas for Structured Clinical & Patient Reports
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
"""

from typing import Any, Dict
from pydantic import BaseModel, Field
from apps.api.app.schemas.patient import PatientInputSchema


class ReportRequestSchema(BaseModel):
    """Payload for POST /api/v1/reports."""
    patient: PatientInputSchema = Field(..., description="Patient input physiological parameters")


class ReportsResponseSchema(BaseModel):
    """Response schema for POST /api/v1/reports."""
    clinician: Dict[str, Any] = Field(..., description="Clinician report with 7 sections")
    patient: Dict[str, Any] = Field(..., description="Patient report with 8 sections")
    generated_at: str = Field(..., description="ISO 8601 generation timestamp")
