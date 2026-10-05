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
    assert [k for k in report.keys() if k != "source"] == TECHNICAL_SECTIONS_ORDER
    assert report["source"] == "template"

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
    assert [k for k in report.keys() if k != "source"] == PATIENT_SECTIONS_ORDER
    assert report["source"] == "template"

    # 2. Disclaimer exact match
    assert report["disclaimer"] == MANDATORY_DISCLAIMER

    # 3. Zero banned phrases
    report_text = str(report).lower()
    for phrase in BANNED_PHRASES:
        pattern = r"\b" + re.escape(phrase) + r"\b"
        assert not re.search(pattern, report_text), f"Banned phrase found: {phrase}"


# ==============================================================================
# 5. Integration Endpoints & Configuration Tests
# ==============================================================================

import json
from unittest.mock import patch, MagicMock
from apps.api.app.services.llm_service import (
    get_groq_config,
    get_reports_diagnostics,
    build_allowed_numbers,
    is_number_allowed,
)


def test_api_report_status_endpoint_shape(client):
    """Verify GET /reports/status conforms to zero-Groq diagnostic schema."""
    status_res = client.get("/api/v1/reports/status")
    assert status_res.status_code == 200
    data = status_res.json()
    assert "key_present" in data
    assert "key_is_placeholder" in data
    assert "key_length" in data
    assert "model" in data
    assert "cooldown_s" in data
    assert "groq_calls_last_hour" in data
    assert "last_status" in data
    # Ensure raw key is NOT present
    assert "api_key" not in data
    assert "groq_api_key" not in data


def test_get_groq_config_whitespace_and_quotes(monkeypatch):
    """Verify Groq config strips whitespace, \\r, \\n, BOM, and surrounding quotes."""
    monkeypatch.setenv("GROQ_API_KEY", '\ufeff  "gsk_test123456789"\r\n  ')
    monkeypatch.setenv("GROQ_MODEL", " 'llama-3.3-70b-versatile'\r\n ")
    key, model = get_groq_config()
    assert key == "gsk_test123456789"
    assert model == "llama-3.3-70b-versatile"

    # Placeholder rejection
    monkeypatch.setenv("GROQ_API_KEY", "PASTE_YOUR_GROQ_API_KEY_HERE")
    key, model = get_groq_config()
    assert key is None

    monkeypatch.setenv("GROQ_API_KEY", "PASTE_OTHER_KEY")
    key, model = get_groq_config()
    assert key is None



def test_shap_sanity_additive_property():
    """Verify base value + sum of SHAP values matches model raw output within 1e-3 (Task 2.9)."""
    import numpy as np
    from apps.api.app.services.model_service import model_service
    from apps.api.app.routes import get_sample_patient

    model_service.load_artifacts()
    p = get_sample_patient(profile="high_risk_lad")
    df = p.to_feature_dataframe()
    X = model_service.preprocessor.transform(df)

    for target in ["CAD", "LAD", "LCX", "RCA"]:
        exp = model_service.get_explainer(target)
        raw_shap = exp.shap_values(X)
        if isinstance(raw_shap, list):
            # Pos class array at index 1
            shap_vec = raw_shap[1][0]
        elif len(raw_shap.shape) == 3:
            shap_vec = raw_shap[0, :, 1]
        else:
            shap_vec = raw_shap[0]

        ev = exp.expected_value
        base_val = float(ev[1]) if isinstance(ev, (list, np.ndarray)) else float(ev)
        model_pred = exp.model.predict(X)
        raw_out = model_pred[0, 1] if len(model_pred.shape) > 1 else model_pred[0]
        total_shap = base_val + float(np.sum(shap_vec))
        diff = abs(total_shap - raw_out)
        assert diff < 1e-3, f"SHAP additive check failed for {target}: diff={diff}"


def test_groq_report_generation_with_banned_phrase(sample_patient_dict):
    """Verify banned advisory phrase causes validation failure and fallback."""
    context = build_report_context(sample_patient_dict, {}, {})
    mock_report = generate_deterministic_technical_report(context)
    mock_report["methodological_notes"] = ["The patient should avoid stress and consult a doctor."]

    is_valid, err = validate_report_json(mock_report, TECHNICAL_SECTIONS_ORDER, context)
    assert is_valid is False
    assert "Banned advisory phrase detected" in err


def test_number_format_variants_pass_validator():
    """Verify format-tolerant number matching (36.0, 36, 0.36 as 36%, rounding)."""
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


def test_api_report_generate_endpoint_deterministic_fallback(client, sample_patient_dict):
    """Verify POST /api/v1/reports/generate streams valid NDJSON and falls back gracefully."""
    res = client.post("/api/v1/reports/generate", json={"patient": sample_patient_dict})
    assert res.status_code == 200
    lines = [json.loads(line) for line in res.text.strip().split("\n") if line.strip()]
    assert len(lines) >= 2
    assert lines[0]["event"] == "stage"
    result_event = lines[-1]
    assert result_event["event"] == "result"
    assert "reports" in result_event
    reports = result_event["reports"]
    assert "clinician" in reports
    assert "patient" in reports
    assert [k for k in reports["clinician"].keys()] == TECHNICAL_SECTIONS_ORDER
    assert [k for k in reports["patient"].keys()] == PATIENT_SECTIONS_ORDER
    assert reports["clinician"]["disclaimer"] == MANDATORY_DISCLAIMER
    assert reports["patient"]["disclaimer"] == MANDATORY_DISCLAIMER

