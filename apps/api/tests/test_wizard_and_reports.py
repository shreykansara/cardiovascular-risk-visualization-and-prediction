"""
Unit and Integration Tests for Wizard UI, Feature Schema, Leakage Guard, and Report Generation
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
"""

import re
import pytest
from fastapi.testclient import TestClient

from apps.api.app.main import app
from apps.api.app.schemas.patient import PatientInputSchema
from apps.api.app.schemas.report import ReportRequestSchema
from apps.api.app.services.leakage_guard import FORBIDDEN_LEAKAGE_COLUMNS, audit_request_for_leakage
from apps.api.app.services.llm_service import (
    BANNED_PHRASES,
    MANDATORY_DISCLAIMER,
    PATIENT_SECTIONS_ORDER,
    TECHNICAL_SECTIONS_ORDER,
    build_report_context,
    generate_deterministic_patient_report,
    generate_deterministic_technical_report,
    validate_report_json,
)
from apps.api.app.services.model_service import model_service


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def sample_patient_dict(client):
    res = client.get("/api/v1/sample-patient?profile=high_risk_lad")
    assert res.status_code == 200
    return res.json()


# ==============================================================================
# 1. Leakage Guard Tests: LAD, LCX, RCA, Cath strictly excluded from inputs
# ==============================================================================

def test_leakage_prohibited_columns_defined():
    """Verify that all target labels are strictly flagged as prohibited inputs."""
    assert "cath" in FORBIDDEN_LEAKAGE_COLUMNS
    assert "cad" in FORBIDDEN_LEAKAGE_COLUMNS
    assert "lad" in FORBIDDEN_LEAKAGE_COLUMNS
    assert "lcx" in FORBIDDEN_LEAKAGE_COLUMNS
    assert "rca" in FORBIDDEN_LEAKAGE_COLUMNS


def test_leakage_guard_rejects_target_inputs():
    """Verify that injecting prohibited target columns raises 422 Unprocessable Entity."""
    with pytest.raises(Exception):
        audit_request_for_leakage({"Age": 55, "LAD": 1, "BP": 120})

    with pytest.raises(Exception):
        audit_request_for_leakage({"Age": 55, "Cath": "CAD", "BP": 120})


def test_sample_patient_contains_zero_leakage(sample_patient_dict):
    """Confirm standard sample patient fixtures never contain leakage targets."""
    for key in sample_patient_dict.keys():
        assert key.lower() not in ["cath", "cad", "lad", "lcx", "rca"]


# ==============================================================================
# 2. Schema Coverage: 55 features expected by engine
# ==============================================================================

def test_schema_coverage_55_features(sample_patient_dict):
    """Verify that exactly 55 clinical feature columns are mapped to dataframe."""
    patient = PatientInputSchema(**sample_patient_dict)
    df = patient.to_feature_dataframe()
    assert df.shape[1] == 55
    # Strict check: targets must never be in columns
    for col in df.columns:
        assert col.lower() not in ["cath", "cad", "lad", "lcx", "rca"]


def test_form_validation_boundaries(sample_patient_dict):
    """Verify that values outside allowable physiological ranges are rejected."""
    # Test age under boundary
    invalid_low_age = dict(sample_patient_dict, Age=10)
    with pytest.raises(Exception):
        PatientInputSchema(**invalid_low_age)

    # Test age over boundary
    invalid_high_age = dict(sample_patient_dict, Age=125)
    with pytest.raises(Exception):
        PatientInputSchema(**invalid_high_age)

    # Test extreme systolic BP
    invalid_bp = dict(sample_patient_dict, BP=350)
    with pytest.raises(Exception):
        PatientInputSchema(**invalid_bp)


# ==============================================================================
# 3. Report Validator Tests: Banned phrases, ordering, disclaimer, number matching
# ==============================================================================

def test_report_validator_rejects_banned_advisory_phrases():
    """Verify validator catches and rejects advisory/directive phrases."""
    context = {"patient_inputs": {}, "disclaimer": MANDATORY_DISCLAIMER}
    
    for phrase in ["should", "must", "recommend", "advise", "consult", "see a doctor"]:
        bad_report = {
            sec: f"You {phrase} do this." if sec == "what_this_summary_is" else {}
            for sec in PATIENT_SECTIONS_ORDER
        }
        bad_report["disclaimer"] = MANDATORY_DISCLAIMER
        is_valid, err = validate_report_json(bad_report, PATIENT_SECTIONS_ORDER, context)
        assert not is_valid
        assert f"'{phrase}'" in err


def test_report_validator_rejects_hallucinated_numbers():
    """Verify validator catches and rejects arbitrary numbers not present in context."""
    context = {
        "patient_inputs": {"Age": 55, "BP": 120},
        "disclaimer": MANDATORY_DISCLAIMER,
    }
    # Report contains hallucinated number 9999.5
    bad_report = {
        sec: "Your risk score was 9999.5 on the scale." if sec == "what_this_summary_is" else {}
        for sec in PATIENT_SECTIONS_ORDER
    }
    bad_report["disclaimer"] = MANDATORY_DISCLAIMER
    is_valid, err = validate_report_json(bad_report, PATIENT_SECTIONS_ORDER, context)
    assert not is_valid
    assert "Hallucinated number" in err


def test_report_validator_rejects_out_of_order_sections():
    """Verify validator catches and rejects sections that are not in the required order."""
    context = {"patient_inputs": {}, "disclaimer": MANDATORY_DISCLAIMER}
    shuffled = list(reversed(TECHNICAL_SECTIONS_ORDER))
    bad_report = {sec: {} for sec in shuffled}
    bad_report["disclaimer"] = MANDATORY_DISCLAIMER

    is_valid, err = validate_report_json(bad_report, TECHNICAL_SECTIONS_ORDER, context)
    assert not is_valid
    assert "Sections out of order" in err or "Missing required section" in err


def test_report_validator_rejects_invalid_disclaimer():
    """Verify validator rejects reports with altered or missing disclaimer."""
    context = {"patient_inputs": {}}
    report = {sec: {} for sec in TECHNICAL_SECTIONS_ORDER}
    report["disclaimer"] = "Some other disclaimer."
    
    is_valid, err = validate_report_json(report, TECHNICAL_SECTIONS_ORDER, context)
    assert not is_valid
    assert "Disclaimer section does not match" in err


# ==============================================================================
# 4. Deterministic Fallback Template Tests
# ==============================================================================

def test_deterministic_technical_report_compliance(sample_patient_dict):
    """Verify fallback technical report satisfies all 8 sections and rules."""
    patient = PatientInputSchema(**sample_patient_dict)
    context = build_report_context(
        patient_data=sample_patient_dict,
        predictions={
            "overall_cad": {"probability": 0.85, "stenosis_suspected": True},
            "vessels": {
                "lad": {"probability": 0.91, "display_name": "LAD", "stenosis_suspected": True},
                "lcx": {"probability": 0.24, "display_name": "LCX", "stenosis_suspected": False},
                "rca": {"probability": 0.22, "display_name": "RCA", "stenosis_suspected": False},
            },
        },
        explanations={},
    )

    report = generate_deterministic_technical_report(context)
    
    # 1. Section keys in exact order
    assert list(report.keys()) == TECHNICAL_SECTIONS_ORDER

    # 2. Disclaimer exact match
    assert report["disclaimer"] == MANDATORY_DISCLAIMER

    # 3. Zero banned phrases
    report_text = str(report).lower()
    for phrase in BANNED_PHRASES:
        pattern = r"\b" + re.escape(phrase) + r"\b"
        assert not re.search(pattern, report_text), f"Banned phrase found: {phrase}"


def test_deterministic_patient_report_compliance(sample_patient_dict):
    """Verify fallback patient report satisfies all 8 sections and rules."""
    context = build_report_context(
        patient_data=sample_patient_dict,
        predictions={
            "overall_cad": {"probability": 0.85, "stenosis_suspected": True},
            "vessels": {
                "lad": {"probability": 0.91, "display_name": "LAD", "stenosis_suspected": True},
                "lcx": {"probability": 0.24, "display_name": "LCX", "stenosis_suspected": False},
                "rca": {"probability": 0.22, "display_name": "RCA", "stenosis_suspected": False},
            },
        },
        explanations={},
    )

    report = generate_deterministic_patient_report(context)

    # 1. Section keys in exact order
    assert list(report.keys()) == PATIENT_SECTIONS_ORDER

    # 2. Disclaimer exact match
    assert report["disclaimer"] == MANDATORY_DISCLAIMER

    # 3. Zero banned phrases
    report_text = str(report).lower()
    for phrase in BANNED_PHRASES:
        pattern = r"\b" + re.escape(phrase) + r"\b"
        assert not re.search(pattern, report_text), f"Banned phrase found: {phrase}"


# ==============================================================================
# 5. Integration Endpoints & Groq-Only Reporting Tests (Phase B)
# ==============================================================================

from unittest.mock import patch
from apps.api.app.services.llm_service import (
    get_groq_config,
    check_groq_model_availability,
    generate_report,
)


def test_api_report_status_endpoint_shape(client):
    """Verify GET /reports/status conforms to Phase B Groq schema without provider."""
    status_res = client.get("/api/v1/reports/status")
    assert status_res.status_code == 200
    data = status_res.json()
    assert "configured" in data
    assert "model" in data
    assert "model_status" in data
    assert data["model_status"] in ["ready", "unavailable", "unconfigured"]
    assert data["fallback_available"] is True
    # Ensure provider is NOT present
    assert "provider" not in data


def test_get_groq_config(monkeypatch):
    """Verify Groq config reads GROQ_API_KEY and GROQ_MODEL, ignoring legacy vars."""
    monkeypatch.setenv("GROQ_API_KEY", "gsk_test123456789")
    monkeypatch.setenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    key, model = get_groq_config()
    assert key == "gsk_test123456789"
    assert model == "llama-3.3-70b-versatile"

    # Placeholder rejection
    monkeypatch.setenv("GROQ_API_KEY", "PASTE_YOUR_GROQ_API_KEY_HERE")
    key, model = get_groq_config()
    assert key is None


def test_check_groq_model_availability():
    """Verify Groq model availability check detects presence/absence."""
    # When model is in list
    with patch("urllib.request.urlopen") as mock_urlopen:
        mock_response = mock_urlopen.return_value.__enter__.return_value
        mock_response.read.return_value = b'{"data": [{"id": "llama-3.3-70b-versatile"}, {"id": "llama-3.1-8b-instant"}]}'
        is_avail, err = check_groq_model_availability("test_key", "llama-3.3-70b-versatile")
        assert is_avail is True
        assert err is None

    # When model is NOT in list
    with patch("urllib.request.urlopen") as mock_urlopen:
        mock_response = mock_urlopen.return_value.__enter__.return_value
        mock_response.read.return_value = b'{"data": [{"id": "other-model"}]}'
        is_avail, err = check_groq_model_availability("test_key", "llama-3.3-70b-versatile")
        assert is_avail is False
        assert "unavailable" in err


def test_groq_report_generation_with_mock(sample_patient_dict):
    """Verify report generation with mock Groq response."""
    context = build_report_context(
        patient_data=sample_patient_dict,
        predictions={
            "overall_cad": {"probability": 0.85, "stenosis_suspected": True},
            "vessels": {
                "lad": {"probability": 0.91, "display_name": "LAD", "stenosis_suspected": True},
                "lcx": {"probability": 0.24, "display_name": "LCX", "stenosis_suspected": False},
                "rca": {"probability": 0.22, "display_name": "RCA", "stenosis_suspected": False},
            },
        },
        explanations={},
    )
    # Generate mock deterministic report as fake Groq JSON output
    mock_report = generate_deterministic_technical_report(context)
    import json

    with patch("apps.api.app.services.llm_service.get_groq_config", return_value=("mock_key", "llama-3.3-70b-versatile")), \
         patch("apps.api.app.services.llm_service.get_groq_model_status", return_value="ready"), \
         patch("apps.api.app.services.llm_service.call_groq", return_value=json.dumps(mock_report)):
        res = generate_report("technical", context)
        assert list(res.keys()) == TECHNICAL_SECTIONS_ORDER
        assert res["disclaimer"] == MANDATORY_DISCLAIMER


def test_api_report_endpoints_deterministic_fallback(client, sample_patient_dict):
    """Verify POST /reports/technical and POST /reports/patient fallback when Groq key is absent."""
    # Check technical report endpoint
    tech_res = client.post("/api/v1/reports/technical", json={"patient": sample_patient_dict})
    assert tech_res.status_code == 200
    tech_data = tech_res.json()
    assert list(tech_data.keys()) == TECHNICAL_SECTIONS_ORDER
    assert tech_data["disclaimer"] == MANDATORY_DISCLAIMER

    # Check patient report endpoint
    pat_res = client.post("/api/v1/reports/patient", json={"patient": sample_patient_dict})
    assert pat_res.status_code == 200
    pat_data = pat_res.json()
    assert list(pat_data.keys()) == PATIENT_SECTIONS_ORDER
    assert pat_data["disclaimer"] == MANDATORY_DISCLAIMER
