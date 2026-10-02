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
    Interpolates calibrated stenosis probability [0.0, 1.0] to clinical risk colors.
    Low Risk (<= 0.40): Emerald Green (#10B981 / [0.063, 0.725, 0.506])
    Borderline (0.40 - 0.70): Amber (#F59E0B / [0.961, 0.620, 0.043])
    Critical (> 0.70): Crimson Red (#EF4444 / [0.937, 0.267, 0.267])
    """
    p = max(0.0, min(1.0, float(p)))
    c_normal = np.array([0.063, 0.725, 0.506])
    c_borderline = np.array([0.961, 0.620, 0.043])
    c_critical = np.array([0.937, 0.267, 0.267])

    if p <= 0.40:
        t = p / 0.40
        rgb = (1.0 - t) * c_normal + t * c_borderline
    elif p <= 0.70:
        t = (p - 0.40) / 0.30
        rgb = (1.0 - t) * c_borderline + t * c_critical
    else:
        rgb = c_critical

    r = int(np.clip(rgb[0] * 255.0, 0, 255))
    g = int(np.clip(rgb[1] * 255.0, 0, 255))
    b = int(np.clip(rgb[2] * 255.0, 0, 255))
    hex_code = f"#{r:02X}{g:02X}{b:02X}"

    rgb_floats = [round(float(rgb[0]), 3), round(float(rgb[1]), 3), round(float(rgb[2]), 3)]
    return hex_code, rgb_floats


def classify_risk_tier(p: float) -> RiskTier:
    """Categorizes probability into a standardized clinical risk tier."""
    if p < 0.40:
        return RiskTier.LOW
    elif p < 0.60:
        return RiskTier.BORDERLINE
    elif p < 0.75:
        return RiskTier.HIGH
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

    # 3. Evaluate each target head
    target_results: dict[str, TargetPrediction] = {}
    high_risk_list: list[str] = []

    for target in ["CAD", "LAD", "LCX", "RCA"]:
        bundle = model_service.get_model_bundle(target)
        clf = bundle["calibrated_model"]
        threshold = float(bundle["optimal_threshold"])

        prob = float(clf.predict_proba(X_trans)[0, 1])
        stenosis = prob >= threshold
        tier = classify_risk_tier(prob)
        hex_color, rgb_floats = map_probability_to_color(prob)
        emissive = prob >= 0.75

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
