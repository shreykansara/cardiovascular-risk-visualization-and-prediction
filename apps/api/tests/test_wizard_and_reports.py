"""
Unit and Integration Tests for Wizard UI, Feature Schema, Leakage Guard, and Template Reports
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
"""

import json
import re
import socket
import pytest
from fastapi.testclient import TestClient

from apps.api.app.main import app
from apps.api.app.schemas.patient import PatientInputSchema
from apps.api.app.services.leakage_guard import FORBIDDEN_LEAKAGE_COLUMNS, audit_request_for_leakage
from apps.api.app.services.report_templates import (
    MANDATORY_DISCLAIMER,
    PATIENT_SECTIONS_ORDER,
    TECHNICAL_SECTIONS_ORDER,
    build_compact_context,
    generate_reports,
)
from apps.api.app.services.model_service import model_service

BANNED_ADVISORY_PHRASES = [
    "should",
    "must",
    "need to",
    "recommend",
    "advise",
    "suggest",
    "consider",
    "try",
    "avoid",
    "ensure",
    "it is important to",
    "you may want to",
    "follow up",
    "see a doctor",
    "consult",
]


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


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
    """Verify that injecting prohibited target columns raises exception."""
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
    for col in df.columns:
        assert col.lower() not in ["cath", "cad", "lad", "lcx", "rca"]


def test_form_validation_boundaries(sample_patient_dict):
    """Verify that values outside allowable physiological ranges are rejected."""
    invalid_low_age = dict(sample_patient_dict, Age=10)
    with pytest.raises(Exception):
        PatientInputSchema(**invalid_low_age)

    invalid_high_age = dict(sample_patient_dict, Age=125)
    with pytest.raises(Exception):
        PatientInputSchema(**invalid_high_age)

    invalid_bp = dict(sample_patient_dict, BP=350)
    with pytest.raises(Exception):
        PatientInputSchema(**invalid_bp)


# ==============================================================================
# 3. Template Lint (Test Helper Only)
# ==============================================================================

def _extract_all_numbers(obj) -> set[float]:
    """Recursively extracts numbers and format variants (e.g. 36.0, 36, 0.36) from any object."""
    nums: set[float] = set()
    if isinstance(obj, (int, float)):
        val = float(obj)
        nums.add(val)
        nums.add(round(val, 1))
        nums.add(float(int(round(val))))
        if 0.0 <= val <= 1.0:
            nums.add(round(val * 100.0, 1))
            nums.add(float(int(round(val * 100.0))))
        elif 0.0 <= val <= 100.0:
            nums.add(round(val / 100.0, 4))
            nums.add(round(val / 100.0, 2))
    elif isinstance(obj, str):
        for match in re.findall(r"\b\d+(?:\.\d+)?\b", obj):
            try:
                v = float(match)
                nums.add(v)
                nums.add(round(v, 1))
                nums.add(float(int(round(v))))
            except ValueError:
                pass
    elif isinstance(obj, dict):
        for v in obj.values():
            nums.update(_extract_all_numbers(v))
    elif isinstance(obj, (list, tuple, set)):
        for item in obj:
            nums.update(_extract_all_numbers(item))
    return nums


def template_lint(report_dict: dict, context_dict: dict, is_clinician: bool):
    """
    Template lint enforcing:
    1. Zero banned advisory phrases.
    2. Every number can be derived from input context (format tolerant).
    3. Section count and order are exact.
    4. Disclaimer sentence appears exactly once, last, and character-identical.
    """
    expected_order = TECHNICAL_SECTIONS_ORDER if is_clinician else PATIENT_SECTIONS_ORDER
    report_keys = list(report_dict.keys())
    assert report_keys == expected_order, f"Section ordering mismatch: expected {expected_order}, got {report_keys}"
    assert len(report_dict) == len(expected_order), f"Section count mismatch: expected {len(expected_order)}, got {len(report_dict)}"

    # Disclaimer check
    assert report_dict["disclaimer"] == MANDATORY_DISCLAIMER
    raw_json = json.dumps(report_dict)
    disclaimer_count = raw_json.count(MANDATORY_DISCLAIMER)
    assert disclaimer_count == 1, f"Disclaimer must appear exactly once, found {disclaimer_count}"

    # Banned advisory phrases check
    text_lower = raw_json.lower()
    for phrase in BANNED_ADVISORY_PHRASES:
        pattern = r"\b" + re.escape(phrase) + r"\b"
        assert not re.search(pattern, text_lower), f"Banned advisory phrase '{phrase}' detected in report!"

    # Allowed numbers derivation check
    allowed_numbers = _extract_all_numbers(context_dict)
    # Allow common formatting indices (e.g. 1..10, 100 for percent denominator)
    allowed_numbers.update({float(i) for i in range(15)})
    allowed_numbers.update({100.0, 1.0, 0.0})

    # Find all numbers in the rendered report
    found_numbers = re.findall(r"\b\d+(?:\.\d+)?\b", raw_json)
    for n_str in found_numbers:
        val = float(n_str)
        # Format-tolerant check
        derivable = (
            val in allowed_numbers
            or round(val, 1) in allowed_numbers
            or float(int(round(val))) in allowed_numbers
            or (val <= 1.0 and round(val * 100.0, 1) in allowed_numbers)
            or (val >= 0.0 and round(val / 100.0, 2) in allowed_numbers)
        )
        assert derivable, f"Hallucinated or underived number {val} found in report! Not in context."


@pytest.mark.parametrize("profile_name", ["normal", "rca_ischemia", "high_risk_lad"])
def test_template_lint_sample_patients(client, profile_name):
    """Verify template lint passes across Low, Moderate, and High risk sample patients."""
    model_service.load_artifacts()
    res = client.get(f"/api/v1/sample-patient?profile={profile_name}")
    assert res.status_code == 200
    patient_dict = res.json()

    # Get predictions & explanations
    analysis_res = client.post("/api/v1/analyze", json=patient_dict)
    assert analysis_res.status_code == 200
    analysis_data = analysis_res.json()

    context = build_compact_context(
        patient_data=patient_dict,
        predictions=analysis_data["predictions"],
        explanations=analysis_data["explanations"],
        model_metadata=model_service.metadata,
    )

    reports = generate_reports(
        patient_data=patient_dict,
        predictions=analysis_data["predictions"],
        explanations=analysis_data["explanations"],
        model_metadata=model_service.metadata,
    )
    context["generated_at"] = reports["generated_at"]

    # Lint Clinician report (7 sections)
    template_lint(reports["clinician"], context, is_clinician=True)

    # Lint Patient report (8 sections)
    template_lint(reports["patient"], context, is_clinician=False)


# ==============================================================================
# 4. Network Isolation Test (Zero Network Calls)
# ==============================================================================

def test_reports_make_no_network_calls(client, sample_patient_dict, monkeypatch):
    """Verify report generation executes completely offline with socket.connect disabled."""
    def block_connect(*args, **kwargs):
        raise RuntimeError("External network connection attempted during report generation!")

    monkeypatch.setattr(socket.socket, "connect", block_connect)

    # Calling POST /api/v1/reports must still succeed with 200 OK
    res = client.post("/api/v1/reports", json={"patient": sample_patient_dict})
    assert res.status_code == 200
    data = res.json()
    assert "clinician" in data
    assert "patient" in data
    assert "generated_at" in data


# ==============================================================================
# 5. Endpoint Contract Test: POST /api/v1/reports
# ==============================================================================

def test_api_reports_endpoint_shape_and_no_groq(client, sample_patient_dict):
    """Verify POST /api/v1/reports returns 200, valid shape, and zero mentions of Groq."""
    res = client.post("/api/v1/reports", json={"patient": sample_patient_dict})
    assert res.status_code == 200
    text_content = res.text.lower()
    assert "groq" not in text_content, "Found 'groq' text in report endpoint response!"
    assert "gsk_" not in text_content

    data = res.json()
    assert "clinician" in data
    assert "patient" in data
    assert "generated_at" in data

    clinician = data["clinician"]
    patient = data["patient"]

    assert list(clinician.keys()) == TECHNICAL_SECTIONS_ORDER
    assert list(patient.keys()) == PATIENT_SECTIONS_ORDER
    assert clinician["disclaimer"] == MANDATORY_DISCLAIMER
    assert patient["disclaimer"] == MANDATORY_DISCLAIMER
