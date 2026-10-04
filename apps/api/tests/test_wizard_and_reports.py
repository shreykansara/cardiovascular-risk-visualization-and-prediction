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
# 5. Integration Endpoints & Groq-Only Reporting Tests (Phase 1)
# ==============================================================================

import json
import urllib.error
from unittest.mock import patch, MagicMock
from apps.api.app.services.llm_service import (
    get_groq_config,
    perform_live_groq_check,
    get_reports_diagnostics,
    generate_report,
    validate_report_json,
    build_allowed_numbers,
    is_number_allowed,
)


def test_api_report_status_endpoint_shape(client):
    """Verify GET /reports/status conforms to Task 1.7 diagnostic schema."""
    status_res = client.get("/api/v1/reports/status")
    assert status_res.status_code == 200
    data = status_res.json()
    assert "env_file_found" in data
    assert "env_file_path" in data
    assert "key_present" in data
    assert "key_is_placeholder" in data
    assert "key_prefix_ok" in data
    assert "model" in data
    assert "model_listed_by_groq" in data
    assert "last_error_code" in data
    assert "last_error_message" in data
    # Ensure raw key is NOT present
    assert "api_key" not in data
    assert "groq_api_key" not in data


def test_get_groq_config_whitespace_and_quotes(monkeypatch):
    """Verify Groq config strips whitespace and surrounding quotes (Task 1.3 & 1.4)."""
    monkeypatch.setenv("GROQ_API_KEY", '  "gsk_test123456789"  ')
    monkeypatch.setenv("GROQ_MODEL", " 'llama-3.3-70b-versatile' ")
    key, model = get_groq_config()
    assert key == "gsk_test123456789"
    assert model == "llama-3.3-70b-versatile"

    # Placeholder rejection (Task 1.4)
    monkeypatch.setenv("GROQ_API_KEY", "PASTE_YOUR_GROQ_API_KEY_HERE")
    key, model = get_groq_config()
    assert key is None

    monkeypatch.setenv("GROQ_API_KEY", "PASTE_OTHER_KEY")
    key, model = get_groq_config()
    assert key is None


def test_groq_mock_live_checks():
    """Verify live check mappings for success, 401, model not found, 429, network error (Task 1.8 & 1.12)."""
    # 1. Success (model in list)
    with patch("urllib.request.urlopen") as mock_urlopen:
        mock_resp = mock_urlopen.return_value.__enter__.return_value
        mock_resp.read.return_value = b'{"data": [{"id": "llama-3.3-70b-versatile"}]}'
        listed, code, msg = perform_live_groq_check("gsk_valid", "llama-3.3-70b-versatile", force=True)
        assert listed is True
        assert code == "ok"
        assert msg is None

    # 2. Model not found in list
    with patch("urllib.request.urlopen") as mock_urlopen:
        mock_resp = mock_urlopen.return_value.__enter__.return_value
        mock_resp.read.return_value = b'{"data": [{"id": "other-model"}]}'
        listed, code, msg = perform_live_groq_check("gsk_valid", "llama-3.3-70b-versatile", force=True)
        assert listed is False
        assert code == "model_unavailable"

    # 3. 401 Key Rejected
    with patch("urllib.request.urlopen", side_effect=urllib.error.HTTPError(None, 401, "Unauthorized", None, None)):
        listed, code, msg = perform_live_groq_check("gsk_bad", "llama-3.3-70b-versatile", force=True)
        assert listed is False
        assert code == "key_rejected"

    # 4. 429 Rate Limited
    with patch("urllib.request.urlopen", side_effect=urllib.error.HTTPError(None, 429, "Too Many Requests", None, None)):
        listed, code, msg = perform_live_groq_check("gsk_valid", "llama-3.3-70b-versatile", force=True)
        assert code == "rate_limited"

    # 5. Network Error
    with patch("urllib.request.urlopen", side_effect=urllib.error.URLError("Connection refused")):
        listed, code, msg = perform_live_groq_check("gsk_valid", "llama-3.3-70b-versatile", force=True)
        assert code == "network_error"


def test_groq_report_generation_with_mock_success(sample_patient_dict):
    """Verify report generation with mock Groq response succeeding (Task 1.12)."""
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
    mock_report = generate_deterministic_technical_report(context)

    with patch("apps.api.app.services.llm_service.get_groq_config", return_value=("gsk_mock", "llama-3.3-70b-versatile")), \
         patch("apps.api.app.services.llm_service.call_groq", return_value=json.dumps(mock_report)):
        res = generate_report("technical", context)
        assert list(res.keys()) == TECHNICAL_SECTIONS_ORDER
        assert res["disclaimer"] == MANDATORY_DISCLAIMER


def test_groq_report_generation_with_mock_malformed_json(sample_patient_dict):
    """Verify malformed JSON falls back gracefully (Task 1.12)."""
    context = build_report_context(sample_patient_dict, {}, {})

    with patch("apps.api.app.services.llm_service.get_groq_config", return_value=("gsk_mock", "llama-3.3-70b-versatile")), \
         patch("apps.api.app.services.llm_service.call_groq", return_value="THIS IS NOT JSON"):
        res = generate_report("technical", context)
        assert list(res.keys()) == TECHNICAL_SECTIONS_ORDER
        assert res["disclaimer"] == MANDATORY_DISCLAIMER


def test_groq_report_generation_with_banned_phrase(sample_patient_dict):
    """Verify banned advisory phrase causes validation failure and retry/fallback (Task 1.12)."""
    context = build_report_context(sample_patient_dict, {}, {})
    mock_report = generate_deterministic_technical_report(context)
    mock_report["methodological_notes"] = ["The patient should avoid stress and consult a doctor."]

    is_valid, err = validate_report_json(mock_report, TECHNICAL_SECTIONS_ORDER, context)
    assert is_valid is False
    assert "Banned advisory phrase detected" in err


def test_number_format_variants_pass_validator():
    """Verify format-tolerant number matching (36.0, 36, 0.36 as 36%, rounding) (Task 1.10a & 1.12)."""
    context = {
        "cad_summary": {"probability": 0.36, "probability_pct": 36.0},
        "patient_inputs": {"BP": 130, "Age": 58.2},
    }
    allowed = build_allowed_numbers(context)

    # All these variants must pass
    assert is_number_allowed(36.0, allowed)
    assert is_number_allowed(36, allowed)
    assert is_number_allowed(0.36, allowed)
    assert is_number_allowed(130.0, allowed)
    assert is_number_allowed(58.0, allowed)
    assert is_number_allowed(58, allowed)

    # Hallucinated number not in context or structure must fail
    assert not is_number_allowed(999.7, allowed)


def test_api_report_endpoints_deterministic_fallback(client, sample_patient_dict):
    """Verify POST /reports/technical and POST /reports/patient fallback when Groq key is absent."""
    tech_res = client.post("/api/v1/reports/technical", json={"patient": sample_patient_dict})
    assert tech_res.status_code == 200
    tech_data = tech_res.json()
    assert list(tech_data.keys()) == TECHNICAL_SECTIONS_ORDER
    assert tech_data["disclaimer"] == MANDATORY_DISCLAIMER

    pat_res = client.post("/api/v1/reports/patient", json={"patient": sample_patient_dict})
    assert pat_res.status_code == 200
    pat_data = pat_res.json()
    assert list(pat_data.keys()) == PATIENT_SECTIONS_ORDER
    assert pat_data["disclaimer"] == MANDATORY_DISCLAIMER
