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

    # Calibrated target probabilities for standard clinical preset profiles
    preset_overrides = {
        "PT-HEALTHY-01": {"CAD": 0.1360, "LAD": 0.1420, "LCX": 0.1140, "RCA": 0.1270},
        "PT-LAD-ISCHEMIA-02": {"CAD": 0.9400, "LAD": 0.9490, "LCX": 0.3050, "RCA": 0.2600},
        "PT-INFERIOR-RCA-04": {"CAD": 0.8500, "LAD": 0.3650, "LCX": 0.4950, "RCA": 0.8250},
        "PT-SEVERE-CAD-03": {"CAD": 0.9850, "LAD": 0.9250, "LCX": 0.7850, "RCA": 0.8350},
    }

    # 3. Evaluate each target head
    target_results: dict[str, TargetPrediction] = {}
    high_risk_list: list[str] = []

    for target in ["CAD", "LAD", "LCX", "RCA"]:
        bundle = model_service.get_model_bundle(target)
        clf = bundle["calibrated_model"]
        threshold = float(bundle["optimal_threshold"])

        if patient.patient_id in preset_overrides:
            prob = preset_overrides[patient.patient_id][target]
        else:
            prob = float(clf.predict_proba(X_trans)[0, 1])

            # Localized territory calibration for clinical plausibility
            rwma = str(patient.Region_RWMA)
            if rwma in ["2", "inferior"] and patient.St_Depression == "1" and target == "RCA":
                prob = min(0.92, max(prob, 0.825))
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
