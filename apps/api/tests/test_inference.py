"""
Model Artifact & TreeSHAP Verification Tests
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
"""

import time
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import pytest


MODELS_DIR = Path("models")


def test_model_artifacts_exist():
    """Verify that all 4 model bundles, preprocessor, and explainers exist on disk."""
    required_files = [
        "cad_model.joblib",
        "lad_model.joblib",
        "lcx_model.joblib",
        "rca_model.joblib",
        "preprocessor.joblib",
        "shap_explainers.joblib",
        "model_metadata.json",
    ]
    for filename in required_files:
        path = MODELS_DIR / filename
        assert path.exists(), f"Missing model artifact: {path}"
        assert path.stat().st_size > 0, f"Artifact is empty: {path}"


def test_end_to_end_inference():
    """Test full inference pipeline with real patient data from X_features."""
    x_df = pd.read_parquet("data/processed/X_features.parquet")
    preprocessor = joblib.load(MODELS_DIR / "preprocessor.joblib")
    
    # Transform single patient sample
    sample_patient = x_df.iloc[[0]]
    x_trans = preprocessor.transform(sample_patient)
    assert x_trans.shape[1] == 96

    for target in ["cad", "lad", "lcx", "rca"]:
        bundle = joblib.load(MODELS_DIR / f"{target}_model.joblib")
        calibrated_model = bundle["calibrated_model"]
        probs = calibrated_model.predict_proba(x_trans)[0]
        
        # Verify valid probability distribution
        assert len(probs) == 2
        assert 0.0 <= probs[1] <= 1.0
        assert np.isclose(probs[0] + probs[1], 1.0)


def test_treeshap_explainer_speed():
    """Verify that TreeSHAP produces per-patient local attributions in < 25 ms."""
    x_df = pd.read_parquet("data/processed/X_features.parquet")
    preprocessor = joblib.load(MODELS_DIR / "preprocessor.joblib")
    shap_bundle = joblib.load(MODELS_DIR / "shap_explainers.joblib")
    
    sample_trans = preprocessor.transform(x_df.iloc[[0]])
    
    start_time = time.perf_counter()
    lad_explainer = shap_bundle["explainers"]["LAD"]
    shap_vals = lad_explainer.shap_values(sample_trans)
    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    assert elapsed_ms < 25.0, f"SHAP extraction too slow: {elapsed_ms:.2f} ms"
    assert shap_vals is not None
