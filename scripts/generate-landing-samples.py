#!/usr/bin/env python3
"""
Generate Landing Page Samples
Calls the existing trained prediction engine for three sample patients and outputs
apps/web/src/content/landingSamples.json with real predicted probabilities rounded to 1 decimal place.
"""

from datetime import datetime, timezone
import json
from pathlib import Path
import sys

# Ensure repository root is on sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from apps.api.app.routes import get_sample_patient
from apps.api.app.services.inference import predict_patient
from apps.api.app.services.model_service import model_service


def main():
    print("Loading model artifacts...")
    model_service.load_artifacts()

    samples_config = [
        {"key": "normal", "label": "Lower risk sample"},
        {"key": "rca_ischemia", "label": "Moderate risk sample"},
        {"key": "high_risk_lad", "label": "Higher risk sample"},
    ]

    now_iso = datetime.now(timezone.utc).isoformat()
    output_samples = []

    for cfg in samples_config:
        key = cfg["key"]
        label = cfg["label"]
        patient = get_sample_patient(key)
        prediction = predict_patient(patient)

        cad_prob = round(float(prediction.overall_cad.probability) * 100.0, 1)
        lad_prob = round(float(prediction.vessels["lad"].probability) * 100.0, 1)
        lcx_prob = round(float(prediction.vessels["lcx"].probability) * 100.0, 1)
        rca_prob = round(float(prediction.vessels["rca"].probability) * 100.0, 1)

        sample_entry = {
            "id": key,
            "patient_id": patient.patient_id or key,
            "label": label,
            "cad": cad_prob,
            "lad": lad_prob,
            "lcx": lcx_prob,
            "rca": rca_prob,
            "generatedOn": now_iso,
        }
        output_samples.append(sample_entry)
        print(f"Computed {label} ({key}): CAD={cad_prob}%, LAD={lad_prob}%, LCX={lcx_prob}%, RCA={rca_prob}%")

    out_dir = REPO_ROOT / "apps" / "web" / "src" / "content"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "landingSamples.json"

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(output_samples, f, indent=2)

    print(f"\nSaved {len(output_samples)} samples to {out_file}")


if __name__ == "__main__":
    main()
