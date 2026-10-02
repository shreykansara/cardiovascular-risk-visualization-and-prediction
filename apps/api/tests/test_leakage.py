"""
Adversarial Data Leakage Prevention Tests
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
"""

import pytest
import pandas as pd
from scripts.preprocess import StrictFeatureFilter, DataLeakageException


def test_leakage_guard_clean_data():
    """Verify that a legitimate feature set passes without error."""
    clean_df = pd.DataFrame({
        "Age": [55, 62],
        "BP": [120, 140],
        "Cholesterol": [200, 240],
        "Sex": ["Male", "Female"],
        "EF-TTE": [50, 45],
        "Region RWMA": [0, 2],
    })
    guard = StrictFeatureFilter()
    # Should not raise
    guard.fit(clean_df)
    transformed = guard.transform(clean_df)
    assert transformed.shape == clean_df.shape


@pytest.mark.parametrize("forbidden_col", [
    "Cath",
    "cath",
    "CAD",
    "cad",
    "LAD",
    "lad",
    "LCX",
    "lcx",
    "RCA",
    "rca",
    "stenosis",
    "stenosis_status",
])
def test_leakage_guard_rejects_forbidden_columns(forbidden_col: str):
    """Verify that any injection of Cath or ground-truth stenosis raises DataLeakageException."""
    contaminated_df = pd.DataFrame({
        "Age": [55, 62],
        "BP": [120, 140],
        forbidden_col: [1, 0],
    })
    guard = StrictFeatureFilter()
    with pytest.raises(DataLeakageException):
        guard.fit(contaminated_df)


def test_processed_parquet_zero_leakage():
    """Verify that the exported X_features.parquet strictly contains no target features."""
    x_df = pd.read_parquet("data/processed/X_features.parquet")
    guard = StrictFeatureFilter()
    guard.fit(x_df)
    for col in x_df.columns:
        lower = col.lower()
        assert "cath" not in lower
        assert lower != "cad"
        assert lower != "lad"
        assert lower != "lcx"
        assert lower != "rca"
