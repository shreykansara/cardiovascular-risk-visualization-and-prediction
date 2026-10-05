"""
Pydantic Schemas for Structured Clinical & Patient Reports (Task 1.7)
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


class EnvLoadedSchema(BaseModel):
    """Task 2.6: Key presence and format diagnostics (never contains the key)."""
    key_found: bool
    key_length: int
    starts_with_gsk: bool


class LLMConfigStatusResponse(BaseModel):
    """Diagnostics on Groq API configuration status (Tasks 1.7, 2.6). Never contains keys."""
    env_file_found: bool
    env_file_path: str
    key_present: bool
    key_is_placeholder: bool
    key_prefix_ok: bool
    model: str
    model_listed_by_groq: Optional[bool] = None
    last_error_code: Optional[str] = None
    last_error_message: Optional[str] = None
    env_loaded: Optional[EnvLoadedSchema] = None
    
    # Backward compatibility attributes for existing tests and components
    configured: bool = False
    model_status: str = "unconfigured"
    fallback_available: bool = True

