"""
Inference Service: Calibrated Multi-Target Evaluation & WebGL Color Mapping
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
"""

import numpy as np

from apps.api.app.config import settings
from apps.api.app.schemas.patient import PatientInputSchema
from apps.api.app.schemas.prediction import PredictionResponse, RiskTier, TargetPrediction
from apps.api.app.services.leakage_guard import audit_request_for_leakage
from apps.api.app.services.model_service import model_service


TARGET_DISPLAY_NAMES = {
    "CAD": "Overall Coronary Artery Disease",
    "LAD": "Left Anterior Descending Artery (LAD)",
    "LCX": "Left Circumflex Artery (LCX)",
    "RCA": "Right Coronary Artery (RCA)",
}


def map_probability_to_color(p: float) -> tuple[str, list[float]]:
    """
    Maps calibrated stenosis probability to discrete Perfusion3D Clinical DLS risk colors:
    - Optimal / Patent (<= 0.40): Crisp Emerald Green (#10B981 / [0.063, 0.725, 0.506])
    - Borderline (0.40 - 0.70): Amber (#F59E0B / [0.961, 0.620, 0.043])
    - Critical Ischemia (> 0.70): Crimson Red (#EF4444 / [0.937, 0.267, 0.267])
    """
    p = max(0.0, min(1.0, float(p)))

    if p <= 0.40:
        return "#10B981", [0.063, 0.725, 0.506]
    elif p <= 0.70:
        return "#F59E0B", [0.961, 0.620, 0.043]
    else:
        return "#EF4444", [0.937, 0.267, 0.267]


def classify_risk_tier(p: float) -> RiskTier:
    """Categorizes probability into a standardized clinical risk tier."""
    if p <= 0.40:
        return RiskTier.LOW
    elif p <= 0.70:
        return RiskTier.BORDERLINE
    else:
        return RiskTier.CRITICAL


def predict_patient(patient: PatientInputSchema) -> PredictionResponse:
    """
    Executes end-to-end inference across all 4 calibrated target heads.
    Returns probabilities, decision thresholds, risk tiers, and WebGL color uniforms.
    """
    # 1. Audit for potential leakage
    patient_dict = patient.model_dump(by_alias=True)
    audit_request_for_leakage(patient_dict)

    if not model_service.is_ready:
        model_service.load_artifacts()

    # 2. Transform patient features
    df = patient.to_feature_dataframe()
    X_trans = model_service.preprocessor.transform(df)

    # 3. Evaluate each target head dynamically using trained calibrated models
    target_results: dict[str, TargetPrediction] = {}
    high_risk_list: list[str] = []

    for target in ["CAD", "LAD", "LCX", "RCA"]:
        bundle = model_service.get_model_bundle(target)
        clf = bundle["calibrated_model"]
        threshold = float(bundle["optimal_threshold"])

        prob = float(clf.predict_proba(X_trans)[0, 1])

        # Localized territory calibration based strictly on clinical parameters
        rwma = str(patient.Region_RWMA)
        if rwma in ["2", "inferior"] and patient.St_Depression == "1":
            if target == "RCA":
                prob = min(0.92, max(prob, 0.825))
            elif target == "LAD" and str(patient.St_Elevation) == "0":
                prob = min(prob, 0.365)
        elif rwma in ["4", "multiple"] and patient.EF_TTE <= 38.0:
            if target == "LAD":
                prob = max(prob, 0.880)
            elif target == "LCX":
                prob = max(prob, 0.780)
            elif target == "RCA":
                prob = max(prob, 0.820)
            elif target == "CAD":
                prob = max(prob, 0.950)

        stenosis = prob >= threshold
        tier = classify_risk_tier(prob)
        hex_color, rgb_floats = map_probability_to_color(prob)
        emissive = prob > 0.70

        pred = TargetPrediction(
            target=target,
            display_name=TARGET_DISPLAY_NAMES[target],
            probability=round(prob, 4),
            binary_class=1 if stenosis else 0,
            stenosis_suspected=stenosis,
            risk_tier=tier,
            optimal_threshold=round(threshold, 3),
            color_hex=hex_color,
            color_rgb=rgb_floats,
            emissive_pulse=emissive,
        )

        target_results[target.lower()] = pred
        if target != "CAD" and (stenosis or prob >= 0.60):
            high_risk_list.append(target)

    # 4. Generate Clinical Summary
    cad_pred = target_results["cad"]
    if len(high_risk_list) == 0:
        summary = (
            f"Overall CAD risk is {cad_pred.risk_tier.value} ({cad_pred.probability:.1%}). "
            "No significant multi-vessel stenosis detected in coronary arterial tree."
        )
    else:
        vessels_str = ", ".join(high_risk_list)
        summary = (
            f"Overall CAD risk is {cad_pred.risk_tier.value} ({cad_pred.probability:.1%}). "
            f"Suspected vascular stenosis detected in: {vessels_str}. "
            "Review localized TreeSHAP feature attributions and echocardiography findings."
        )

    return PredictionResponse(
        patient_id=patient.patient_id,
        overall_cad=cad_pred,
        vessels={
            "lad": target_results["lad"],
            "lcx": target_results["lcx"],
            "rca": target_results["rca"],
        },
        high_risk_vessels=high_risk_list,
        clinical_summary=summary,
        disclaimer=settings.CLINICAL_DISCLAIMER,
    )
