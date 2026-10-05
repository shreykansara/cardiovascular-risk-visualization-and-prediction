"""
Services package exports
"""

from apps.api.app.services.explainer import explain_patient
from apps.api.app.services.inference import predict_patient
from apps.api.app.services.leakage_guard import audit_request_for_leakage
from apps.api.app.services.model_service import model_service

from apps.api.app.services.report_templates import (
    generate_reports,
    build_compact_context,
    build_report_context,
    generate_deterministic_technical_report,
    generate_deterministic_patient_report,
    MANDATORY_DISCLAIMER,
)

__all__ = [
    "model_service",
    "predict_patient",
    "explain_patient",
    "audit_request_for_leakage",
    "generate_reports",
    "build_compact_context",
    "build_report_context",
    "generate_deterministic_technical_report",
    "generate_deterministic_patient_report",
    "MANDATORY_DISCLAIMER",
]
