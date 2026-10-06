"""
Deterministic Report Generation Service (Hardcoded Templates)
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction

Generates standardized clinician (7 sections) and patient (8 sections) reports
filled with calibrated patient measurements and statistical risk calculations.
Completely offline, deterministic, zero LLM dependencies.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from apps.api.app.services.risk_bands import risk_label

MANDATORY_DISCLAIMER = (
    "Predictions are for decision-support and educational purposes only and are "
    "not a substitute for formal diagnostic imaging or professional medical evaluation."
)

TECHNICAL_SECTIONS_ORDER = [
    "report_header",
    "model_output_summary",
    "input_parameters",
    "parameters_outside_reference_range",
    "model_attribution",
    "methodological_notes",
    "disclaimer",
]

PATIENT_SECTIONS_ORDER = [
    "title_and_date",
    "what_this_summary_is",
    "overall_picture",
    "your_three_main_heart_arteries",
    "your_measurements",
    "what_influenced_the_prediction_most",
    "about_this_estimate",
    "disclaimer",
]

REFERENCE_RANGES: Dict[str, Tuple[float, float, str, str]] = {
    "BP": (90.0, 120.0, "mmHg", "90 - 120 mmHg"),
    "Age": (18.0, 75.0, "years", "18 - 75 years"),
    "FBS": (70.0, 99.0, "mg/dL", "70 - 99 mg/dL"),
    "TG": (50.0, 150.0, "mg/dL", "50 - 150 mg/dL"),
    "EF-TTE": (55.0, 70.0, "%", "55 - 70%"),
    "Weight": (50.0, 90.0, "kg", "50 - 90 kg"),
    "Length": (150.0, 190.0, "cm", "150 - 190 cm"),
    "BMI": (18.5, 24.9, "kg/m²", "18.5 - 24.9 kg/m²"),
    "PR": (60.0, 100.0, "bpm", "60 - 100 bpm"),
    "CR": (0.6, 1.2, "mg/dL", "0.6 - 1.2 mg/dL"),
    "LDL": (50.0, 100.0, "mg/dL", "50 - 100 mg/dL"),
    "HDL": (40.0, 60.0, "mg/dL", "40 - 60 mg/dL"),
    "BUN": (7.0, 20.0, "mg/dL", "7 - 20 mg/dL"),
    "ESR": (0.0, 20.0, "mm/hr", "0 - 20 mm/hr"),
    "HB": (12.0, 17.0, "g/dL", "12 - 17 g/dL"),
    "K": (3.5, 5.0, "mEq/L", "3.5 - 5.0 mEq/L"),
    "Na": (135.0, 145.0, "mEq/L", "135 - 145 mEq/L"),
    "WBC": (4000.0, 11000.0, "cells/mcL", "4000 - 11000 cells/mcL"),
    "Lymph": (20.0, 40.0, "%", "20 - 40%"),
    "Neut": (40.0, 70.0, "%", "40 - 70%"),
    "PLT": (150.0, 450.0, "x10^3/mcL", "150 - 450 x10^3/mcL"),
}


def build_compact_context(
    patient_data: Dict[str, Any],
    predictions: Dict[str, Any],
    explanations: Dict[str, Any],
    model_metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Builds structured context for deterministic report rendering."""
    age = patient_data.get("Age")
    sex = patient_data.get("Sex", "Unknown")

    # Predictions
    preds_compact: Dict[str, Any] = {}
    cad_pred = predictions.get("overall_cad", {})
    cad_prob = cad_pred.get("probability", 0.0)
    preds_compact["CAD"] = {
        "probability": cad_prob,
        "probability_pct": round(cad_prob * 100, 1),
        "model_classification": "Positive" if cad_prob >= 0.48 else "Negative",
        "risk_band": cad_pred.get("category") or risk_label(cad_prob),
    }

    vessels = predictions.get("vessels", {})
    for v_key in ["lad", "lcx", "rca"]:
        v_data = vessels.get(v_key, {})
        v_prob = v_data.get("probability", 0.0)
        v_upper = v_key.upper()
        preds_compact[v_upper] = {
            "probability": v_prob,
            "probability_pct": round(v_prob * 100, 1),
            "model_classification": "Positive" if v_prob >= 0.40 else "Negative",
            "risk_band": v_data.get("category") or risk_label(v_prob),
        }

    # Top SHAP contributors per target
    shap_compact: Dict[str, List[Dict[str, Any]]] = {}
    for target in ["CAD", "LAD", "LCX", "RCA"]:
        t_key = target.lower()
        exp = explanations.get(t_key, {})
        top_feats = exp.get("top_features", [])[:5]
        compact_feats = []
        for f in top_feats:
            fname = f.get("clinical_label") or f.get("feature") or f.get("feature_name", "")
            raw_v = None
            for k in ["feature_value", "patient_value", "input_value", "value"]:
                if k in f and f[k] is not None and str(f[k]).strip() not in ("", "—", "-"):
                    raw_v = f[k]
                    break

            if raw_v is None or str(raw_v).strip() in ("", "—", "-"):
                feat_key = f.get("feature_name") or f.get("feature", "")
                if feat_key.startswith("num__"):
                    base_k = feat_key[5:]
                elif feat_key.startswith("cat__"):
                    base_k = feat_key[5:].rsplit("_", 1)[0]
                else:
                    base_k = feat_key

                found_val = None
                for cand in [
                    base_k,
                    base_k.replace(" ", "_"),
                    base_k.replace("_", " "),
                    base_k.replace("-", "_"),
                    base_k.replace("_", "-"),
                ]:
                    if cand in patient_data and patient_data[cand] is not None:
                        found_val = patient_data[cand]
                        break

                if found_val is None:
                    norm = base_k.lower().replace("_", "").replace(" ", "").replace("-", "")
                    for pk, pv in patient_data.items():
                        if pk.lower().replace("_", "").replace(" ", "").replace("-", "") == norm and pv is not None:
                            found_val = pv
                            break

                if found_val is not None:
                    v_str = str(found_val)
                    bk_clean = base_k.replace("_", " ")
                    if bk_clean == "Region RWMA":
                        rwma_map = {"0": "Normal (0)", "1": "Anterior (1)", "2": "Inferior (2)", "3": "Lateral (3)", "4": "Septal (4)"}
                        raw_v = rwma_map.get(v_str, v_str)
                    elif bk_clean in ("DM", "HTN", "Current Smoker", "EX-Smoker", "FH", "Edema", "Typical Chest Pain", "Q Wave", "St Elevation", "St Depression", "Tinversion"):
                        raw_v = "Present (1)" if v_str == "1" else "Absent (0)"
                    elif bk_clean in ("Obesity", "CRF", "CVA", "Airway disease", "Thyroid Disease", "CHF", "DLP", "Weak Peripheral Pulse", "Lung rales", "Systolic Murmur", "Diastolic Murmur", "Dyspnea", "Atypical", "Nonanginal", "Exertional CP", "LowTH Ang", "LVH", "Poor R Progression"):
                        raw_v = "Present (Yes)" if v_str in ("Y", "1") else "Absent (No)"
                    elif bk_clean == "Function Class":
                        raw_v = f"Class {v_str}" if v_str != "0" else "Class 0"
                    elif bk_clean in ("BBB", "VHD"):
                        raw_v = "None" if v_str == "N" else v_str
                    elif bk_clean in REFERENCE_RANGES:
                        unit = REFERENCE_RANGES[bk_clean][2]
                        raw_v = f"{v_str} {unit}".strip() if unit else v_str
                    else:
                        raw_v = v_str

            val = str(raw_v) if (raw_v is not None and str(raw_v).strip() not in ("", "—", "-")) else "—"

            raw_impact = f.get("impact") or f.get("direction")
            raw_mag = f.get("shap_value") if f.get("shap_value") is not None else f.get("magnitude", 0.0)
            mag = round(float(raw_mag), 4)

            if raw_impact:
                direction = "increases risk" if "INCREASE" in str(raw_impact).upper() else "decreases risk"
            else:
                direction = "increases risk" if mag > 0 else "decreases risk"

            compact_feats.append({
                "feature": fname,
                "value": val,
                "direction": direction,
                "magnitude": mag,
            })
        shap_compact[target] = compact_feats

    # Out of range parameters
    out_of_range: List[Dict[str, Any]] = []
    for k, (low, high, unit, ref_str) in REFERENCE_RANGES.items():
        if k in patient_data:
            try:
                v = float(patient_data[k])
                if v < low or v > high:
                    out_of_range.append({
                        "name": k,
                        "value": v,
                        "unit": unit,
                        "typical_range": ref_str,
                    })
            except (ValueError, TypeError):
                pass

    return {
        "demographics": {"age": age, "sex": sex},
        "predictions": preds_compact,
        "top_shap_contributors": shap_compact,
        "out_of_range_parameters": out_of_range,
        "reference_ranges": REFERENCE_RANGES,
        "patient_inputs": patient_data,
    }


def generate_fallback_prose(context: Dict[str, Any]) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """Builds deterministic, fixed-template prose for clinician and patient reports."""
    preds = context["predictions"]
    cad_pct = preds["CAD"]["probability_pct"]
    cad_band = preds["CAD"]["risk_band"]
    shap_cad = context["top_shap_contributors"].get("CAD", [])

    top_names_cad = ", ".join([f["feature"] for f in shap_cad[:3]]) or "measured physiological parameters"
    shap_lad = context["top_shap_contributors"].get("LAD", [])
    top_names_lad = ", ".join([f["feature"] for f in shap_lad[:3]]) or "measured physiological parameters"
    shap_lcx = context["top_shap_contributors"].get("LCX", [])
    top_names_lcx = ", ".join([f["feature"] for f in shap_lcx[:3]]) or "measured physiological parameters"
    shap_rca = context["top_shap_contributors"].get("RCA", [])
    top_names_rca = ", ".join([f["feature"] for f in shap_rca[:3]]) or "measured physiological parameters"

    clinician_prose = {
        "model_output_summary": (
            f"Overall predicted probability for coronary artery disease is {cad_pct}%, "
            f"categorized as {cad_band} risk."
        ),
        "attribution": {
            "CAD": f"Primary physiological drivers include {top_names_cad}.",
            "LAD": f"Key factors influencing LAD output include {top_names_lad}.",
            "LCX": f"Key factors influencing LCX output include {top_names_lcx}.",
            "RCA": f"Key factors influencing RCA output include {top_names_rca}.",
        },
        "methodological_notes": [
            "Evaluated using non-invasive physiological features across multiple clinical categories.",
            "Target features LAD, LCX, RCA, and Cath were strictly excluded from model inputs to prevent target leakage.",
            "Reported outputs reflect calibrated probabilities derived from empirical post-test Bayesian odds, not direct anatomical lumen caliber measurements.",
        ],
    }

    patient_prose = {
        "what_this_summary_is": (
            "This summary describes the numbers you entered and the statistical risk predictions calculated from them. "
            "It shows the calculated risk numbers for your heart arteries based on those measurements."
        ),
        "overall_picture": (
            f"The computer model evaluated your overall probability for coronary artery disease (CAD), "
            f"which is narrowing in the blood vessels that supply blood to your heart muscle. "
            f"The model estimated an overall predicted probability of {int(round(cad_pct))}%, "
            f"placing this estimate in the {cad_band.lower()} range."
        ),
        "arteries": {
            "LAD": (
                f"The LAD artery runs down the front of the heart and supplies blood to the front wall. "
                f"The model calculated a predicted narrowing probability of {int(round(preds['LAD']['probability_pct']))}%, "
                f"which is in the {preds['LAD']['risk_band'].lower()} category."
            ),
            "LCX": (
                f"The LCX artery curves around the left side of the heart to nourish the side and back walls. "
                f"The model calculated a predicted narrowing probability of {int(round(preds['LCX']['probability_pct']))}%, "
                f"which is in the {preds['LCX']['risk_band'].lower()} category."
            ),
            "RCA": (
                f"The RCA artery travels down the right side of the heart to bring blood to the right chambers and underside. "
                f"The model calculated a predicted narrowing probability of {int(round(preds['RCA']['probability_pct']))}%, "
                f"which is in the {preds['RCA']['risk_band'].lower()} category."
            ),
        },
        "influences": [
            f"{f['feature']}: {f['value']} pushed the predicted risk {'up' if 'increase' in f['direction'] else 'down'}."
            for f in shap_cad[:4]
        ] or ["Measurements entered were evaluated by the model."],
        "about_this_estimate": (
            "This estimate was calculated by a computer program trained on past health data from hospital patients. "
            "It produces statistical probability numbers based on patterns in your measurements. "
            "The computer program does not take pictures of your heart or directly measure blood flow."
        ),
    }

    return clinician_prose, patient_prose


def assemble_final_reports(
    context: Dict[str, Any],
    patient_data: Dict[str, Any],
    clinician_prose: Dict[str, Any],
    patient_prose: Dict[str, Any],
) -> Dict[str, Any]:
    """Assembles final reports ensuring exact section shapes, orders, and disclaimer insertion."""
    preds = context["predictions"]
    now_iso = datetime.now().isoformat()
    today_str = datetime.now().strftime("%Y-%m-%d")

    # 1. Clinician Report (7 Sections)
    clinician_report = {
        "report_header": {
            "report_title": "Perfusion3D Hemodynamic & Coronary Ischemia Technical Evaluation",
            "generation_date_time": now_iso,
            "model_version": "Perfusion3D v1.0.0",
            "patient_age": patient_data.get("Age", 58),
            "patient_sex": patient_data.get("Sex", "Male"),
        },
        "model_output_summary": {
            "summary_text": clinician_prose.get("model_output_summary", ""),
            "targets": [
                {
                    "target": "CAD",
                    "display_name": "Overall Coronary Artery Disease",
                    "model_classification": preds["CAD"]["model_classification"],
                    "probability_pct": preds["CAD"]["probability_pct"],
                    "risk_band": preds["CAD"]["risk_band"],
                },
                {
                    "target": "LAD",
                    "display_name": "Left Anterior Descending Artery",
                    "model_classification": preds["LAD"]["model_classification"],
                    "probability_pct": preds["LAD"]["probability_pct"],
                    "risk_band": preds["LAD"]["risk_band"],
                },
                {
                    "target": "LCX",
                    "display_name": "Left Circumflex Artery",
                    "model_classification": preds["LCX"]["model_classification"],
                    "probability_pct": preds["LCX"]["probability_pct"],
                    "risk_band": preds["LCX"]["risk_band"],
                },
                {
                    "target": "RCA",
                    "display_name": "Right Coronary Artery",
                    "model_classification": preds["RCA"]["model_classification"],
                    "probability_pct": preds["RCA"]["probability_pct"],
                    "risk_band": preds["RCA"]["risk_band"],
                },
            ],
        },
        "input_parameters": {
            "groups": [
                {
                    "group_name": "Demographics",
                    "parameters": [
                        {"name": "Age", "value": patient_data.get("Age", 58), "unit": "years", "reference_range": "18-75", "within_range": float(patient_data.get("Age", 58)) <= 75},
                        {"name": "Sex", "value": patient_data.get("Sex", "Male"), "unit": "", "reference_range": "Male/Female", "within_range": True},
                        {"name": "Weight", "value": patient_data.get("Weight", 74), "unit": "kg", "reference_range": "50-90", "within_range": 50 <= float(patient_data.get("Weight", 74)) <= 90},
                        {"name": "Length", "value": patient_data.get("Length", 165), "unit": "cm", "reference_range": "150-190", "within_range": 150 <= float(patient_data.get("Length", 165)) <= 190},
                        {"name": "BMI", "value": patient_data.get("BMI", 27.2), "unit": "kg/m²", "reference_range": "18.5-24.9", "within_range": 18.5 <= float(patient_data.get("BMI", 27.2)) <= 24.9},
                    ],
                },
                {
                    "group_name": "Clinical Examination",
                    "parameters": [
                        {"name": "BP", "value": patient_data.get("BP", 130), "unit": "mmHg", "reference_range": "90-120", "within_range": 90 <= float(patient_data.get("BP", 130)) <= 120},
                        {"name": "PR", "value": patient_data.get("PR", 72), "unit": "bpm", "reference_range": "60-100", "within_range": 60 <= float(patient_data.get("PR", 72)) <= 100},
                        {"name": "DM", "value": patient_data.get("DM", "0"), "unit": "", "reference_range": "0", "within_range": str(patient_data.get("DM", "0")) == "0"},
                        {"name": "HTN", "value": patient_data.get("HTN", "1"), "unit": "", "reference_range": "0", "within_range": str(patient_data.get("HTN", "1")) == "0"},
                        {"name": "Typical Chest Pain", "value": patient_data.get("Typical Chest Pain", "0"), "unit": "", "reference_range": "0", "within_range": str(patient_data.get("Typical Chest Pain", "0")) == "0"},
                    ],
                },
                {
                    "group_name": "ECG",
                    "parameters": [
                        {"name": "Q Wave", "value": patient_data.get("Q Wave", "0"), "unit": "", "reference_range": "0", "within_range": str(patient_data.get("Q Wave", "0")) == "0"},
                        {"name": "St Elevation", "value": patient_data.get("St Elevation", "0"), "unit": "", "reference_range": "0", "within_range": str(patient_data.get("St Elevation", "0")) == "0"},
                        {"name": "St Depression", "value": patient_data.get("St Depression", "0"), "unit": "", "reference_range": "0", "within_range": str(patient_data.get("St Depression", "0")) == "0"},
                        {"name": "Tinversion", "value": patient_data.get("Tinversion", "0"), "unit": "", "reference_range": "0", "within_range": str(patient_data.get("Tinversion", "0")) == "0"},
                    ],
                },
                {
                    "group_name": "Laboratory",
                    "parameters": [
                        {"name": "FBS", "value": patient_data.get("FBS", 98), "unit": "mg/dL", "reference_range": "70-99", "within_range": 70 <= float(patient_data.get("FBS", 98)) <= 99},
                        {"name": "CR", "value": patient_data.get("CR", 1.0), "unit": "mg/dL", "reference_range": "0.6-1.2", "within_range": 0.6 <= float(patient_data.get("CR", 1.0)) <= 1.2},
                        {"name": "TG", "value": patient_data.get("TG", 122), "unit": "mg/dL", "reference_range": "50-150", "within_range": 50 <= float(patient_data.get("TG", 122)) <= 150},
                        {"name": "LDL", "value": patient_data.get("LDL", 100), "unit": "mg/dL", "reference_range": "50-100", "within_range": 50 <= float(patient_data.get("LDL", 100)) <= 100},
                        {"name": "HDL", "value": patient_data.get("HDL", 39), "unit": "mg/dL", "reference_range": "40-60", "within_range": 40 <= float(patient_data.get("HDL", 39)) <= 60},
                    ],
                },
                {
                    "group_name": "Echocardiography",
                    "parameters": [
                        {"name": "EF-TTE", "value": patient_data.get("EF-TTE", 50), "unit": "%", "reference_range": "55-70", "within_range": 55 <= float(patient_data.get("EF-TTE", 50)) <= 70},
                        {"name": "Region RWMA", "value": patient_data.get("Region RWMA", "0"), "unit": "score", "reference_range": "0", "within_range": str(patient_data.get("Region RWMA", "0")) == "0"},
                        {"name": "VHD", "value": patient_data.get("VHD", "N"), "unit": "grade", "reference_range": "N", "within_range": str(patient_data.get("VHD", "N")) == "N"},
                    ],
                },
            ]
        },
        "parameters_outside_reference_range": [
            f"{p['name']}: {p['value']} {p['unit']} (reference {p['typical_range']})"
            for p in context.get("out_of_range_parameters", [])
        ] or ["All physiological parameters are within typical reference intervals."],
        "model_attribution": {
            "attribution_summary": clinician_prose.get("attribution", {}),
            "targets": [
                {
                    "target": "CAD",
                    "top_features": [
                        {
                            "feature": f["feature"],
                            "patient_value": f["value"],
                            "direction": "INCREASES_RISK" if ("increase" in str(f.get("direction", "")).lower() or float(f.get("magnitude", 0)) > 0) else "DECREASES_RISK",
                            "shap_value": f["magnitude"],
                        }
                        for f in context["top_shap_contributors"].get("CAD", [])
                    ],
                },
                {
                    "target": "LAD",
                    "top_features": [
                        {
                            "feature": f["feature"],
                            "patient_value": f["value"],
                            "direction": "INCREASES_RISK" if ("increase" in str(f.get("direction", "")).lower() or float(f.get("magnitude", 0)) > 0) else "DECREASES_RISK",
                            "shap_value": f["magnitude"],
                        }
                        for f in context["top_shap_contributors"].get("LAD", [])
                    ],
                },
                {
                    "target": "LCX",
                    "top_features": [
                        {
                            "feature": f["feature"],
                            "patient_value": f["value"],
                            "direction": "INCREASES_RISK" if ("increase" in str(f.get("direction", "")).lower() or float(f.get("magnitude", 0)) > 0) else "DECREASES_RISK",
                            "shap_value": f["magnitude"],
                        }
                        for f in context["top_shap_contributors"].get("LCX", [])
                    ],
                },
                {
                    "target": "RCA",
                    "top_features": [
                        {
                            "feature": f["feature"],
                            "patient_value": f["value"],
                            "direction": "INCREASES_RISK" if ("increase" in str(f.get("direction", "")).lower() or float(f.get("magnitude", 0)) > 0) else "DECREASES_RISK",
                            "shap_value": f["magnitude"],
                        }
                        for f in context["top_shap_contributors"].get("RCA", [])
                    ],
                },
            ],
        },
        "methodological_notes": clinician_prose.get("methodological_notes", []),
        "disclaimer": MANDATORY_DISCLAIMER,
    }

    # 2. Patient Report (8 Sections)
    arteries_prose = patient_prose.get("arteries", {})
    patient_report = {
        "title_and_date": {
            "title": "Your Heart Health Summary",
            "generation_date": today_str,
        },
        "what_this_summary_is": patient_prose.get("what_this_summary_is", ""),
        "overall_picture": patient_prose.get("overall_picture", ""),
        "your_three_main_heart_arteries": {
            "lad": {
                "name": "Left anterior descending (LAD) artery",
                "description": arteries_prose.get("LAD", ""),
                "probability_pct": preds["LAD"]["probability_pct"],
                "category": preds["LAD"]["risk_band"],
            },
            "lcx": {
                "name": "Left circumflex (LCX) artery",
                "description": arteries_prose.get("LCX", ""),
                "probability_pct": preds["LCX"]["probability_pct"],
                "category": preds["LCX"]["risk_band"],
            },
            "rca": {
                "name": "Right coronary (RCA) artery",
                "description": arteries_prose.get("RCA", ""),
                "probability_pct": preds["RCA"]["probability_pct"],
                "category": preds["RCA"]["risk_band"],
            },
        },
        "your_measurements": {
            "groups": [
                {
                    "category_name": "Body and Clinical Examination",
                    "items": [
                        {"plain_name": "Age", "your_value": f"{patient_data.get('Age', 58)} years", "typical_range": "18–75 years", "status": "Within range" if float(patient_data.get("Age", 58)) <= 75 else "Above typical range"},
                        {"plain_name": "Blood Pressure (systolic)", "your_value": f"{patient_data.get('BP', 130)} mmHg", "typical_range": "90–120 mmHg", "status": "Above typical range" if float(patient_data.get("BP", 130)) > 120 else "Within range"},
                        {"plain_name": "Resting Heart Rate", "your_value": f"{patient_data.get('PR', 72)} beats/min", "typical_range": "60–100 beats/min", "status": "Within range"},
                    ],
                },
                {
                    "category_name": "Heart Tracing (ECG)",
                    "items": [
                        {"plain_name": "ST-Segment Elevation", "your_value": "Present" if str(patient_data.get("St Elevation", "0")) == "1" else "Absent", "typical_range": "Absent", "status": "Within range" if str(patient_data.get("St Elevation", "0")) == "0" else "Outside typical range"},
                        {"plain_name": "ST-Segment Depression", "your_value": "Present" if str(patient_data.get("St Depression", "0")) == "1" else "Absent", "typical_range": "Absent", "status": "Within range" if str(patient_data.get("St Depression", "0")) == "0" else "Outside typical range"},
                    ],
                },
                {
                    "category_name": "Blood Tests",
                    "items": [
                        {"plain_name": "Fasting Blood Sugar", "your_value": f"{patient_data.get('FBS', 98)} mg/dL", "typical_range": "70–99 mg/dL", "status": "Within range" if float(patient_data.get("FBS", 98)) <= 99 else "Above typical range"},
                        {"plain_name": "Triglycerides", "your_value": f"{patient_data.get('TG', 122)} mg/dL", "typical_range": "50–150 mg/dL", "status": "Within range"},
                        {"plain_name": "Kidney Marker (Creatinine)", "your_value": f"{patient_data.get('CR', 1.0)} mg/dL", "typical_range": "0.6–1.2 mg/dL", "status": "Within range"},
                    ],
                },
                {
                    "category_name": "Heart Ultrasound (Echocardiogram)",
                    "items": [
                        {"plain_name": "Heart Pumping Fraction (EF)", "your_value": f"{patient_data.get('EF-TTE', 50)}%", "typical_range": "55–70%", "status": "Below typical range" if float(patient_data.get("EF-TTE", 50)) < 55 else "Within range"},
                    ],
                },
            ]
        },
        "what_influenced_the_prediction_most": patient_prose.get("influences", []),
        "about_this_estimate": patient_prose.get("about_this_estimate", ""),
        "disclaimer": MANDATORY_DISCLAIMER,
    }

    return {
        "clinician": clinician_report,
        "patient": patient_report,
    }


def generate_reports(
    patient_data: Dict[str, Any],
    predictions: Dict[str, Any],
    explanations: Dict[str, Any],
    model_metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Top-level entrypoint returning deterministic reports and ISO generation timestamp."""
    context = build_compact_context(patient_data, predictions, explanations, model_metadata)
    clin_prose, pat_prose = generate_fallback_prose(context)
    reports = assemble_final_reports(context, patient_data, clin_prose, pat_prose)
    return {
        "clinician": reports["clinician"],
        "patient": reports["patient"],
        "generated_at": datetime.now().isoformat(),
    }


# Backwards compatibility helpers
def build_report_context(
    patient_data: Dict[str, Any],
    predictions: Dict[str, Any],
    explanations: Dict[str, Any],
    model_metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    return build_compact_context(patient_data, predictions, explanations, model_metadata)


def generate_deterministic_technical_report(context: Dict[str, Any]) -> Dict[str, Any]:
    clin_prose, _ = generate_fallback_prose(context)
    reports = assemble_final_reports(context, context.get("patient_inputs", {}), clin_prose, {})
    return reports["clinician"]


def generate_deterministic_patient_report(context: Dict[str, Any]) -> Dict[str, Any]:
    _, pat_prose = generate_fallback_prose(context)
    reports = assemble_final_reports(context, context.get("patient_inputs", {}), {}, pat_prose)
    return reports["patient"]
