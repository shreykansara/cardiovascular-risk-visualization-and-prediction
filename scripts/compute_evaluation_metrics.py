"""
Compute Evaluation Metrics Script
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction

Generates a unified evaluation_metrics.json containing:
- accuracy
- precision
- recall
- f1_score
- roc_auc
- pr_auc (extra column)
- specificity (extra column)
for CAD, LAD, LCX, RCA on the 5-fold cross-validation held-out splits.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parent.parent
REPORTS_FILE = PROJECT_ROOT / "reports" / "validation_metrics.json"
METADATA_FILE = PROJECT_ROOT / "models" / "model_metadata.json"
OUTPUT_MODELS_FILE = PROJECT_ROOT / "models" / "evaluation_metrics.json"
OUTPUT_WEB_FILE = PROJECT_ROOT / "apps" / "web" / "src" / "config" / "evaluationMetrics.json"


def compute_metrics() -> dict[str, Any]:
    with open(REPORTS_FILE, "r", encoding="utf-8") as f:
        val_data = json.load(f)

    with open(METADATA_FILE, "r", encoding="utf-8") as f:
        meta_data = json.load(f)

    metrics_result: dict[str, Any] = {
        "dataset": "Extension of Z-Alizadeh Sani (303 records, 55 features)",
        "evaluation_strategy": "5-Fold Stratified Cross-Validation (Held-Out Folds)",
        "models": {},
    }

    target_names = {
        "CAD": "Overall Coronary Artery Disease",
        "LAD": "Left Anterior Descending Artery",
        "LCX": "Left Circumflex Artery",
        "RCA": "Right Coronary Artery",
    }

    for target in ["CAD", "LAD", "LCX", "RCA"]:
        info = val_data[target]
        opt = info["optimal_threshold"]
        arch = info.get("architecture", meta_data["models"][target].get("architecture", "RandomForest"))
        sample_count = info.get("sample_count", 303)
        prevalence = info.get("prevalence", 0.5)

        # Total positive and negative cases
        pos_count = round(sample_count * prevalence)
        neg_count = sample_count - pos_count

        # Optimal threshold calculations from held-out out-of-fold predictions
        thresh = float(opt["threshold_value"])
        recall = float(opt["recall_sensitivity"])
        specificity = float(opt["specificity"])
        precision = float(opt["precision"])
        f1 = float(opt["f1_score"])
        roc_auc = float(info["roc_auc_mean"])
        pr_auc = float(info["pr_auc_mean"])

        # Accurate sample counts for exact accuracy derivation
        tp = round(recall * pos_count)
        fn = pos_count - tp
        tn = round(specificity * neg_count)
        fp = neg_count - tn
        accuracy = float((tp + tn) / sample_count)

        metrics_result["models"][target] = {
            "target": target,
            "display_name": target_names[target],
            "architecture": arch,
            "optimal_threshold": round(thresh, 2),
            "accuracy": round(accuracy, 3),
            "precision": round(precision, 3),
            "recall": round(recall, 3),
            "f1_score": round(f1, 3),
            "roc_auc": round(roc_auc, 3),
            "pr_auc": round(pr_auc, 3),
            "specificity": round(specificity, 3),
            "sample_count": sample_count,
        }

    OUTPUT_MODELS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_MODELS_FILE, "w", encoding="utf-8") as f:
        json.dump(metrics_result, f, indent=2)

    OUTPUT_WEB_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_WEB_FILE, "w", encoding="utf-8") as f:
        json.dump(metrics_result, f, indent=2)

    print(f"Successfully generated metrics in:\n  {OUTPUT_MODELS_FILE}\n  {OUTPUT_WEB_FILE}")
    for t, m in metrics_result["models"].items():
        print(f"[{t}] Acc: {m['accuracy']:.1%} | Prec: {m['precision']:.1%} | Rec: {m['recall']:.1%} | F1: {m['f1_score']:.1%} | ROC-AUC: {m['roc_auc']:.3f} | PR-AUC: {m['pr_auc']:.3f} | Spec: {m['specificity']:.1%}")

    return metrics_result


if __name__ == "__main__":
    compute_metrics()
