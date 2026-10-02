"""
Explainability Service: TreeSHAP Attributions & Clinical Feature Mapping
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
"""

import numpy as np

from apps.api.app.schemas.patient import PatientInputSchema
from apps.api.app.schemas.xai import (
    FeatureAttribution,
    ImpactDirection,
    VesselExplanation,
)
from apps.api.app.services.leakage_guard import audit_request_for_leakage
from apps.api.app.services.model_service import model_service


# Human-friendly clinical translation dictionary for transformed feature keys
CLINICAL_FEATURE_MAP = {
    "num__Age": ("Patient Age", "years"),
    "num__Weight": ("Body Weight", "kg"),
    "num__Length": ("Patient Height", "cm"),
    "num__BMI": ("Body Mass Index", "kg/m²"),
    "num__BP": ("Systolic Blood Pressure", "mmHg"),
    "num__PR": ("Resting Pulse Rate", "bpm"),
    "num__FBS": ("Fasting Blood Sugar", "mg/dL"),
    "num__CR": ("Serum Creatinine", "mg/dL"),
    "num__TG": ("Triglycerides", "mg/dL"),
    "num__LDL": ("Low-Density Lipoprotein (LDL)", "mg/dL"),
    "num__HDL": ("High-Density Lipoprotein (HDL)", "mg/dL"),
    "num__BUN": ("Blood Urea Nitrogen", "mg/dL"),
    "num__ESR": ("Erythrocyte Sedimentation Rate", "mm/hr"),
    "num__HB": ("Hemoglobin", "g/dL"),
    "num__K": ("Serum Potassium", "mEq/L"),
    "num__Na": ("Serum Sodium", "mEq/L"),
    "num__WBC": ("White Blood Cell Count", "/mcL"),
    "num__Lymph": ("Lymphocyte Percentage", "%"),
    "num__Neut": ("Neutrophil Percentage", "%"),
    "num__PLT": ("Platelet Count", "×10³/mcL"),
    "num__EF-TTE": ("Ejection Fraction (EF)", "%"),
    "cat__Sex_Female": ("Biological Sex: Female", ""),
    "cat__Sex_Male": ("Biological Sex: Male", ""),
    "cat__Typical Chest Pain_1": ("Typical Exertional Angina: Present", ""),
    "cat__Typical Chest Pain_0": ("Typical Exertional Angina: Absent", ""),
    "cat__Region RWMA_0": ("Regional Wall Motion (Echo): Normal / None", ""),
    "cat__Region RWMA_1": ("Regional Wall Motion Abnormality: Anterior Wall", ""),
    "cat__Region RWMA_2": ("Regional Wall Motion Abnormality: Inferior Wall", ""),
    "cat__Region RWMA_3": ("Regional Wall Motion Abnormality: Lateral Wall", ""),
    "cat__Region RWMA_4": ("Regional Wall Motion Abnormality: Septal / Multiple", ""),
    "cat__St Elevation_1": ("ECG ST Elevation: Present", ""),
    "cat__St Elevation_0": ("ECG ST Elevation: Absent", ""),
    "cat__St Depression_1": ("ECG ST Depression: Present", ""),
    "cat__St Depression_0": ("ECG ST Depression: Absent", ""),
    "cat__Tinversion_1": ("ECG T-Wave Inversion: Present", ""),
    "cat__Tinversion_0": ("ECG T-Wave Inversion: Absent", ""),
    "cat__DM_1": ("Diabetes Mellitus: Present", ""),
    "cat__DM_0": ("Diabetes Mellitus: Absent", ""),
    "cat__HTN_1": ("Hypertension: Present", ""),
    "cat__HTN_0": ("Hypertension: Absent", ""),
    "cat__Current Smoker_1": ("Current Tobacco Smoker: Yes", ""),
    "cat__Current Smoker_0": ("Current Tobacco Smoker: No", ""),
    "cat__FH_1": ("Family History of CAD: Present", ""),
    "cat__FH_0": ("Family History of CAD: Absent", ""),
    "cat__Obesity_Y": ("Clinical Obesity: Yes", ""),
    "cat__Obesity_N": ("Clinical Obesity: No", ""),
    "cat__BBB_LBBB": ("Left Bundle Branch Block (LBBB)", ""),
    "cat__BBB_RBBB": ("Right Bundle Branch Block (RBBB)", ""),
    "cat__BBB_N": ("Bundle Branch Block: None", ""),
    "cat__VHD_Severe": ("Valvular Heart Disease: Severe", ""),
    "cat__VHD_Moderate": ("Valvular Heart Disease: Moderate", ""),
    "cat__VHD_mild": ("Valvular Heart Disease: Mild", ""),
    "cat__VHD_N": ("Valvular Heart Disease: None", ""),
}


def clean_clinical_label(raw_feature_name: str) -> tuple[str, str]:
    """Returns human-readable clinical label and unit."""
    if raw_feature_name in CLINICAL_FEATURE_MAP:
        return CLINICAL_FEATURE_MAP[raw_feature_name]
    
    # Generic fallback
    clean = raw_feature_name.replace("num__", "").replace("cat__", "").replace("_", " ")
    return clean, ""


def explain_patient(
    patient: PatientInputSchema,
    target: str = "LAD",
    top_k: int = 8,
) -> VesselExplanation:
    """
    Computes local TreeSHAP attributions for a given target vessel.
    Ranks features by absolute attribution magnitude and classifies impact direction.
    """
    target_upper = target.upper()
    if target_upper not in ["CAD", "LAD", "LCX", "RCA"]:
        raise ValueError(f"Invalid target '{target}'. Permissible targets: ['CAD', 'LAD', 'LCX', 'RCA']")

    # Audit for leakage
    patient_dict = patient.model_dump(by_alias=True)
    audit_request_for_leakage(patient_dict)

    if not model_service.is_ready:
        model_service.load_artifacts()

    # 1. Transform features
    df = patient.to_feature_dataframe()
    X_trans = model_service.preprocessor.transform(df)
    feature_names = model_service.shap_bundle.get("feature_names", [])

    # 2. Extract TreeSHAP values
    explainer = model_service.get_explainer(target_upper)
    raw_shap = explainer.shap_values(X_trans)

    # Extract single-sample vector for positive class
    if isinstance(raw_shap, list):
        shap_vec = raw_shap[1][0]
    elif len(raw_shap.shape) == 3:
        shap_vec = raw_shap[0, :, 1]
    else:
        shap_vec = raw_shap[0]

    # Base value (phi_0)
    expected_val = explainer.expected_value
    if isinstance(expected_val, (list, np.ndarray)):
        base_val = float(expected_val[1]) if len(expected_val) > 1 else float(expected_val[0])
    else:
        base_val = float(expected_val)

    # Model predicted probability
    bundle = model_service.get_model_bundle(target_upper)
    pred_prob = float(bundle["calibrated_model"].predict_proba(X_trans)[0, 1])

    # 3. Sort features by absolute SHAP attribution
    abs_indices = np.argsort(np.abs(shap_vec))[::-1]
    top_features: list[FeatureAttribution] = []

    for idx in abs_indices[:top_k]:
        raw_name = feature_names[idx] if idx < len(feature_names) else f"feature_{idx}"
        label, unit = clean_clinical_label(raw_name)
        phi_val = float(shap_vec[idx])

        # Retrieve observed value from patient schema
        base_col = raw_name.replace("num__", "").replace("cat__", "").split("_")[0]
        obs_val = str(patient_dict.get(base_col, "Observed"))
        if unit:
            obs_val = f"{obs_val} {unit}"

        top_features.append(
            FeatureAttribution(
                feature_name=raw_name,
                clinical_label=label,
                feature_value=obs_val,
                shap_value=round(phi_val, 4),
                impact=ImpactDirection.INCREASES_RISK if phi_val > 0 else ImpactDirection.DECREASES_RISK,
                absolute_importance=round(abs(phi_val), 4),
            )
        )

    target_display = {
        "CAD": "Overall Coronary Artery Disease",
        "LAD": "Left Anterior Descending Artery (LAD)",
        "LCX": "Left Circumflex Artery (LCX)",
        "RCA": "Right Coronary Artery (RCA)",
    }[target_upper]

    return VesselExplanation(
        target=target_upper,
        display_name=target_display,
        base_value=round(base_val, 4),
        predicted_probability=round(pred_prob, 4),
        top_features=top_features,
    )
