"""
Runtime Target Leakage Inspection Guardrail
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
"""

from typing import Any
from fastapi import HTTPException, status

EXACT_FORBIDDEN = {"cad", "lad", "lcx", "rca"}
SUBSTRING_FORBIDDEN = {"cath", "stenosis", "target", "ground_truth"}
FORBIDDEN_LEAKAGE_COLUMNS = EXACT_FORBIDDEN | SUBSTRING_FORBIDDEN


def audit_request_for_leakage(payload: dict[str, Any]) -> None:
    """
    Scans an incoming request payload dictionary for any presence of forbidden
    target tokens or invasive catheterization indicators. Raises HTTP 400 if detected.
    """
    leaks = []
    for key in payload.keys():
        cleaned = key.lower().strip()
        tokens = set(cleaned.replace("-", "_").replace(" ", "_").split("_"))
        
        # Check exact target acronyms
        if any(exact in tokens or exact == cleaned for exact in EXACT_FORBIDDEN):
            leaks.append(key)
        # Check forbidden substrings
        elif any(sub in cleaned for sub in SUBSTRING_FORBIDDEN):
            leaks.append(key)

    if leaks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"DATA LEAKAGE VIOLATION: Input contains forbidden target or catheterization keys: {leaks}. "
                "Cath, CAD, LAD, LCX, and RCA are strictly prohibited from model input features."
            ),
        )
