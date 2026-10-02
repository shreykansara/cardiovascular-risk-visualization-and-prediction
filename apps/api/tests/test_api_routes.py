"""
End-to-End FastAPI Route Integration Tests
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
"""

import time
import pytest
from fastapi.testclient import TestClient

from apps.api.app.main import app


@pytest.fixture(scope="module")
def client():
    """Module-scoped test client running within the FastAPI lifespan context."""
    with TestClient(app) as test_client:
        yield test_client


def test_health_endpoints(client):
    """Verify both root and API v1 healthcheck endpoints return operational readiness."""
    res_root = client.get("/health")
    assert res_root.status_code == 200
    data_root = res_root.json()
    assert data_root["status"] == "READY"
    assert "disclaimer" in data_root

    res_v1 = client.get("/api/v1/health")
    assert res_v1.status_code == 200
    data_v1 = res_v1.json()
    assert data_v1["status"] == "READY"
    assert data_v1["feature_count"] == 55
    assert set(data_v1["models_loaded"]) == {"CAD", "LAD", "LCX", "RCA"}


def test_get_sample_patient(client):
    """Verify retrieval of valid sample patient fixtures."""
    for profile in ["normal", "high_risk_lad", "triple_vessel"]:
        res = client.get(f"/api/v1/sample-patient?profile={profile}")
        assert res.status_code == 200
        patient_data = res.json()
        assert "Age" in patient_data
        assert "BP" in patient_data
        assert "EF-TTE" in patient_data


def test_predict_endpoint_success(client):
    """Verify POST /api/v1/predict returns calibrated probabilities and 3D color uniforms."""
    sample_res = client.get("/api/v1/sample-patient?profile=high_risk_lad")
    patient_data = sample_res.json()

    res = client.post("/api/v1/predict", json=patient_data)
    assert res.status_code == 200
    data = res.json()

    assert "overall_cad" in data
    assert "vessels" in data
    assert "disclaimer" in data

    # Verify probability bounds and 3D shader uniforms
    for vessel_key in ["lad", "lcx", "rca"]:
        vessel = data["vessels"][vessel_key]
        assert 0.0 <= vessel["probability"] <= 1.0
        assert vessel["risk_tier"] in ["LOW", "BORDERLINE", "HIGH", "CRITICAL"]
        assert vessel["color_hex"].startswith("#")
        assert len(vessel["color_rgb"]) == 3
        assert all(0.0 <= c <= 1.0 for c in vessel["color_rgb"])

    # High-risk profile should identify LAD
    assert "LAD" in data["high_risk_vessels"] or data["vessels"]["lad"]["probability"] > 0.40


def test_explain_endpoint_success(client):
    """Verify POST /api/v1/explain returns TreeSHAP feature attributions and base values."""
    sample_res = client.get("/api/v1/sample-patient?profile=high_risk_lad")
    patient_data = sample_res.json()

    res = client.post("/api/v1/explain?target=LAD&top_k=6", json=patient_data)
    assert res.status_code == 200
    data = res.json()

    assert data["target_vessel"] == "LAD"
    exp = data["explanation"]
    assert "base_value" in exp
    assert "predicted_probability" in exp
    assert len(exp["top_features"]) == 6

    for feat in exp["top_features"]:
        assert feat["impact"] in ["INCREASES_RISK", "DECREASES_RISK"]
        assert feat["absolute_importance"] >= 0.0
        assert len(feat["clinical_label"]) > 0


def test_analyze_endpoint_latency_and_payload(client):
    """Verify POST /api/v1/analyze returns unified predictions and explanations under responsive latency."""
    sample_res = client.get("/api/v1/sample-patient?profile=triple_vessel")
    patient_data = sample_res.json()

    # Warm-up request to prime TreeSHAP explainers
    client.post("/api/v1/analyze?top_k=3", json=patient_data)

    start = time.perf_counter()
    res = client.post("/api/v1/analyze?top_k=5", json=patient_data)
    elapsed_ms = (time.perf_counter() - start) * 1000.0

    assert res.status_code == 200
    data = res.json()

    assert "predictions" in data
    assert "explanations" in data
    assert set(data["explanations"].keys()) == {"cad", "lad", "lcx", "rca"}
    assert elapsed_ms < 150.0, f"Roundtrip too slow: {elapsed_ms} ms"


def test_reject_unphysiological_inputs(client):
    """Verify that unphysiological biomarker values are rejected with HTTP 422."""
    sample_res = client.get("/api/v1/sample-patient?profile=normal")
    patient_data = sample_res.json()

    # Case 1: Negative blood pressure
    invalid_data_1 = dict(patient_data)
    invalid_data_1["BP"] = -10.0
    res1 = client.post("/api/v1/predict", json=invalid_data_1)
    assert res1.status_code == 422

    # Case 2: Impossible Ejection Fraction (> 100%)
    invalid_data_2 = dict(patient_data)
    invalid_data_2["EF-TTE"] = 120.0
    res2 = client.post("/api/v1/predict", json=invalid_data_2)
    assert res2.status_code == 422


def test_reject_adversarial_target_leakage_payload(client):
    """Verify that adversarial injection of target or Cath columns triggers HTTP 422 (extra field) or 400."""
    sample_res = client.get("/api/v1/sample-patient?profile=normal")
    patient_data = sample_res.json()

    # Attempt to inject catheterization result
    patient_data["Cath"] = "CAD"
    res = client.post("/api/v1/predict", json=patient_data)
    assert res.status_code in [400, 422]
