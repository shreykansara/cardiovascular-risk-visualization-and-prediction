"""
Explainability Service: TreeSHAP Attributions & Clinical Feature Mapping
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
"""

import warnings
import numpy as np

# Task 2.9: Suppress targeted LightGBM binary classifier TreeExplainer warning
warnings.filterwarnings(
    "ignore",
    message=r".*LightGBM binary classifier with TreeExplainer shap values output has changed to a list of ndarray.*",
    category=UserWarning,
)

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
    "cat__EX-Smoker_0": ("Ex-Smoker: No", ""),
    "cat__EX-Smoker_1": ("Ex-Smoker: Yes", ""),
    "cat__CRF_N": ("Chronic Renal Failure: Absent", ""),
    "cat__CRF_Y": ("Chronic Renal Failure: Present", ""),
    "cat__CVA_N": ("Cerebrovascular Accident (Stroke): Absent", ""),
    "cat__CVA_Y": ("Cerebrovascular Accident (Stroke): Present", ""),
    "cat__Airway disease_N": ("Airway Disease / COPD: Absent", ""),
    "cat__Airway disease_Y": ("Airway Disease / COPD: Present", ""),
    "cat__Thyroid Disease_N": ("Thyroid Dysfunction: Absent", ""),
    "cat__Thyroid Disease_Y": ("Thyroid Dysfunction: Present", ""),
    "cat__CHF_N": ("Congestive Heart Failure: Absent", ""),
    "cat__CHF_Y": ("Congestive Heart Failure: Present", ""),
    "cat__DLP_N": ("Dyslipidemia: Absent", ""),
    "cat__DLP_Y": ("Dyslipidemia: Present", ""),
    "cat__Edema_0": ("Peripheral Edema: Absent", ""),
    "cat__Edema_1": ("Peripheral Edema: Present", ""),
    "cat__Weak Peripheral Pulse_N": ("Weak Peripheral Pulse: Absent", ""),
    "cat__Weak Peripheral Pulse_Y": ("Weak Peripheral Pulse: Present", ""),
    "cat__Lung rales_N": ("Lung Rales: Absent", ""),
    "cat__Lung rales_Y": ("Lung Rales: Present", ""),
    "cat__Systolic Murmur_N": ("Systolic Murmur: Absent", ""),
    "cat__Systolic Murmur_Y": ("Systolic Murmur: Present", ""),
    "cat__Diastolic Murmur_N": ("Diastolic Murmur: Absent", ""),
    "cat__Diastolic Murmur_Y": ("Diastolic Murmur: Present", ""),
    "cat__Dyspnea_N": ("Exertional Dyspnea: Absent", ""),
    "cat__Dyspnea_Y": ("Exertional Dyspnea: Present", ""),
    "cat__Function Class_0": ("NYHA Functional Class: None (0)", ""),
    "cat__Function Class_1": ("NYHA Functional Class: Class I", ""),
    "cat__Function Class_2": ("NYHA Functional Class: Class II", ""),
    "cat__Function Class_3": ("NYHA Functional Class: Class III", ""),
    "cat__Atypical_N": ("Atypical Angina: Absent", ""),
    "cat__Atypical_Y": ("Atypical Angina: Present", ""),
    "cat__Nonanginal_N": ("Non-Anginal Chest Pain: Absent", ""),
    "cat__Nonanginal_Y": ("Non-Anginal Chest Pain: Present", ""),
    "cat__Exertional CP_N": ("Exertional Chest Pain: Absent", ""),
    "cat__LowTH Ang_N": ("Low-Threshold Angina: Absent", ""),
    "cat__LowTH Ang_Y": ("Low-Threshold Angina: Present", ""),
    "cat__Q Wave_0": ("ECG Pathologic Q-Wave: Absent", ""),
    "cat__Q Wave_1": ("ECG Pathologic Q-Wave: Present", ""),
    "cat__LVH_N": ("ECG Left Ventricular Hypertrophy: Absent", ""),
    "cat__LVH_Y": ("ECG Left Ventricular Hypertrophy: Present", ""),
    "cat__Poor R Progression_N": ("ECG Poor R-Wave Progression: Absent", ""),
    "cat__Poor R Progression_Y": ("ECG Poor R-Wave Progression: Present", ""),
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
    pretransformed_x: np.ndarray | None = None,
    precomputed_prob: float | None = None,
) -> VesselExplanation:
    """
    Computes local TreeSHAP attributions for a given target vessel.
    Ranks features by absolute attribution magnitude and classifies impact direction.
    Supports pretransformed feature matrix and precomputed probabilities for ultra-low latency.
    """
    target_upper = target.upper()
    if target_upper not in ["CAD", "LAD", "LCX", "RCA"]:
        raise ValueError(f"Invalid target '{target}'. Permissible targets: ['CAD', 'LAD', 'LCX', 'RCA']")

    # Audit for leakage
    patient_dict = patient.model_dump(by_alias=True)
    audit_request_for_leakage(patient_dict)

    if not model_service.is_ready:
        model_service.load_artifacts()

    # 1. Transform features (reuse pretransformed if provided)
    if pretransformed_x is not None:
        X_trans = pretransformed_x
    else:
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
    if precomputed_prob is not None:
        pred_prob = precomputed_prob
    else:
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
        if raw_name.startswith("num__"):
            base_col = raw_name[5:]
        elif raw_name.startswith("cat__"):
            base_col = raw_name[5:].rsplit("_", 1)[0]
        else:
            base_col = raw_name

        def _lookup_patient_val(p_dict: dict[str, Any], col: str) -> Any:
            for cand in [
                col,
                col.replace(" ", "_"),
                col.replace("_", " "),
                col.replace("-", "_"),
                col.replace("_", "-"),
            ]:
                if cand in p_dict and p_dict[cand] is not None:
                    return p_dict[cand]
            norm = col.lower().replace("_", "").replace(" ", "").replace("-", "")
            for k, v in p_dict.items():
                if k.lower().replace("_", "").replace(" ", "").replace("-", "") == norm and v is not None:
                    return v
            return None

        raw_val = _lookup_patient_val(patient_dict, base_col)
        if raw_val is not None:
            if raw_name.startswith("num__"):
                obs_val = f"{raw_val} {unit}".strip() if unit else str(raw_val)
            else:
                val_str = str(raw_val)
                col_key = base_col.replace("_", " ")
                if col_key == "Region RWMA":
                    rwma_map = {"0": "Normal (0)", "1": "Anterior (1)", "2": "Inferior (2)", "3": "Lateral (3)", "4": "Septal (4)"}
                    obs_val = rwma_map.get(val_str, val_str)
                elif col_key in ("DM", "HTN", "Current Smoker", "EX-Smoker", "FH", "Edema", "Typical Chest Pain", "Q Wave", "St Elevation", "St Depression", "Tinversion"):
                    obs_val = "Present (1)" if val_str == "1" else "Absent (0)"
                elif col_key in ("Obesity", "CRF", "CVA", "Airway disease", "Thyroid Disease", "CHF", "DLP", "Weak Peripheral Pulse", "Lung rales", "Systolic Murmur", "Diastolic Murmur", "Dyspnea", "Atypical", "Nonanginal", "Exertional CP", "LowTH Ang", "LVH", "Poor R Progression"):
                    obs_val = "Present (Yes)" if val_str in ("Y", "1") else "Absent (No)"
                elif col_key == "Function Class":
                    obs_val = f"Class {val_str}" if val_str != "0" else "Class 0"
                elif col_key in ("BBB", "VHD"):
                    obs_val = "None" if val_str == "N" else val_str
                else:
                    obs_val = val_str
        else:
            obs_val = "—"

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
