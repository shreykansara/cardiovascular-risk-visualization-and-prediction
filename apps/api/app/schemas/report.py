"""
Pydantic Schemas for Structured Clinical & Patient Reports (Task 3.4 & 3.11)
Multimodal AI Hackathon 2026 - Perfusion3D
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from apps.api.app.schemas.patient import PatientInputSchema


class ReportGenerateRequestSchema(BaseModel):
    """Payload for POST /api/v1/reports/generate."""
    patient: PatientInputSchema = Field(..., description="Patient input physiological parameters")
    force: bool = Field(default=False, description="Bypass in-memory cache if true")


class ReportRequestSchema(BaseModel):
    """Legacy payload schema kept for test backwards compatibility."""
    patient: PatientInputSchema = Field(..., description="Patient input physiological parameters")
    predictions: Optional[Dict[str, Any]] = Field(default=None, description="Precomputed model predictions")
    explanations: Optional[Dict[str, Any]] = Field(default=None, description="Precomputed TreeSHAP explanations")


class EnvLoadedSchema(BaseModel):
    """Key presence and format diagnostics (never contains the key)."""
    key_found: bool
    key_length: int
    starts_with_gsk: bool


class LLMConfigStatusResponse(BaseModel):
    """Diagnostics on Groq API configuration status (Task 3.12). Never contains keys."""
    key_present: bool
    key_is_placeholder: bool
    key_length: int
    model: str
    cooldown_s: Optional[int] = None
    groq_calls_last_hour: int = 0
    last_status: str = "ok"

    # Backward compatibility attributes for existing tests
    env_file_found: bool = True
    env_file_path: str = ""
    key_prefix_ok: bool = True
    model_listed_by_groq: Optional[bool] = None
    last_error_code: Optional[str] = None
    last_error_message: Optional[str] = None
    env_loaded: Optional[EnvLoadedSchema] = None
    configured: bool = False
    model_status: str = "ready"
    fallback_available: bool = True
