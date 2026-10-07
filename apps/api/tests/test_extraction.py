"""
Unit tests for deterministic clinical report extraction.
Uses Document.from_text for lightweight, deterministic in-memory testing.
"""

import pytest

from apps.api.app.extraction.models import ExtractedField, RejectedField
from apps.api.app.extraction.normalize import normalize_text
from apps.api.app.extraction.parsers import (
    detect_wrong_report_type,
    parse_ecg,
    parse_echo,
    parse_ehr,
    parse_lab,
)
from apps.api.app.extraction.pdf_text import Document
from apps.api.app.extraction.report_types import (
    ALL_FIELD_KEYS,
    ALL_FIELD_SPECS,
    ReportType,
    get_field_spec,
    owned_keys,
)
from apps.api.app.extraction.units import convert_and_validate_numeric
from apps.api.app.extraction.values import parse_numeric_value_and_unit
from apps.api.app.schemas.patient import PatientInputSchema

# 1. Ownership & Counts
def test_ownership_and_counts():
    ecg = set(owned_keys(ReportType.ecg))
    echo = set(owned_keys(ReportType.echo))
    lab = set(owned_keys(ReportType.lab))
    ehr = set(owned_keys(ReportType.ehr))

    assert len(ecg) == 7
    assert len(echo) == 3
    assert len(lab) == 14
    assert len(ehr) == 31

    # Disjointness
    assert len(ecg & echo) == 0
    assert len(ecg & lab) == 0
    assert len(ecg & ehr) == 0
    assert len(echo & lab) == 0
    assert len(echo & ehr) == 0
    assert len(lab & ehr) == 0

    # Union equals all 55 keys
    total_owned = ecg | echo | lab | ehr
    assert len(total_owned) == 55
    assert total_owned == set(ALL_FIELD_KEYS)

# 2. Field specs match Pydantic patient model
def test_field_specs_match_patient_model():
    pydantic_fields = set()
    for name, field_info in PatientInputSchema.model_fields.items():
        if name == "patient_id":
            continue
        # Use alias if present
        key = field_info.alias if field_info.alias else name
        pydantic_fields.add(key)

    spec_keys = set(s["key"] for s in ALL_FIELD_SPECS)
    assert spec_keys == pydantic_fields
    assert len(spec_keys) == 55

# 3. Number parsing: decimal comma, thousands separator, censored, range midpoint, flags
def test_number_parsing():
    assert normalize_text("1,05") == "1.05"
    assert normalize_text("7,500") == "7500"
    assert normalize_text("1,250,000") == "1250000"

    # Censored values rejected with censored_value
    p_censored = parse_numeric_value_and_unit("<0.5 mg/dL")
    assert p_censored is not None
    assert p_censored.is_censored is True
    assert p_censored.censored_snippet == "<0.5"

    p_censored_high = parse_numeric_value_and_unit(">90")
    assert p_censored_high is not None
    assert p_censored_high.is_censored is True

    # Range midpoint
    p_range = parse_numeric_value_and_unit("50-55 %")
    assert p_range is not None
    assert p_range.value == 52.5
    assert p_range.is_range_midpoint is True
    assert p_range.unit == "%"

    # Flag letters ignored
    p_flag_h = parse_numeric_value_and_unit("12.5 H mg/dL")
    assert p_flag_h is not None
    assert p_flag_h.value == 12.5
    assert p_flag_h.unit == "mg/dL"

    p_flag_l = parse_numeric_value_and_unit("4.1 L")
    assert p_flag_l is not None
    assert p_flag_l.value == 4.1

    # Numbers in parentheses ignored
    p_paren = parse_numeric_value_and_unit("14.0 (12.0 - 16.0 g/dL)")
    assert p_paren is not None
    assert p_paren.value == 14.0

# 4. Matcher safeguards
def test_matcher_safeguards():
    doc = Document.from_text(
        "Patient Information\n"
        "Name: John Doe  Age: 58\n"
        "Non-HDL Cholesterol: 140 mg/dL\n"
        "VLDL: 30 mg/dL\n"
        "Total Cholesterol / HDL Ratio: 4.2"
    )
    fields, rejected, _ = parse_lab(doc)
    # "Na" in Name must not match
    assert "Na" not in fields
    # Non-HDL, VLDL, and Ratio must not match HDL or LDL
    assert "HDL" not in fields
    assert "LDL" not in fields

# 5. Units conversion and validation
def test_units_conversion_and_validation():
    # Glucose mmol/L x 18.016 -> mg/dL
    c_fbs = convert_and_validate_numeric("FBS", 6.0, "mmol/L")
    assert c_fbs.value == 108.1
    assert c_fbs.converted is True
    assert c_fbs.rejection_reason is None

    # Creatinine umol/L / 88.4 -> mg/dL
    c_cr = convert_and_validate_numeric("CR", 88.4, "umol/L")
    assert c_cr.value == 1.0
    assert c_cr.converted is True
    assert c_cr.rejection_reason is None

    # Platelets lakhs/cumm -> x10³/mcL
    c_plt = convert_and_validate_numeric("PLT", 2.35, "lakhs/cumm")
    assert c_plt.value == 235.0
    assert c_plt.converted is True

    # Out of range rejection
    c_oor = convert_and_validate_numeric("K", 15.0, "mEq/L")
    assert c_oor.rejection_reason == "out_of_range"

    # Unit assumed -> confidence "check"
    c_no_unit = convert_and_validate_numeric("FBS", 110.0, None)
    assert c_no_unit.confidence_check is True
    assert c_no_unit.value == 110.0

# 6. ECG parser
def test_ecg_parser():
    text = (
        "12-Lead Electrocardiogram Report\n"
        "Finding  Status\n"
        "Pathological Q wave  Present\n"
        "ST Elevation  Absent\n"
        "Bundle Branch Block  LBBB\n\n"
        "Impression:\n"
        "Sinus rhythm. No ST depression observed. T wave inversion in V1-V3."
    )
    doc = Document.from_text(text)
    fields, rejected, _ = parse_ecg(doc)

    # Structured matches
    assert fields["Q Wave"].value == "1"
    assert fields["Q Wave"].confidence == "high"
    assert fields["St Elevation"].value == "0"
    assert fields["BBB"].value == "LBBB"

    # Negated and positive free-text fallback
    assert fields["St Depression"].value == "0"
    assert fields["St Depression"].confidence == "check"
    assert fields["Tinversion"].value == "1"
    assert fields["Tinversion"].confidence == "check"

    # Not mentioned stays empty
    assert "LVH" not in fields
    assert "Poor R Progression" not in fields

# 7. Echo parser
def test_echo_parser():
    text = (
        "Transthoracic Echocardiogram Report\n"
        "Left Ventricular Ejection Fraction (LVEF): 50-55 %\n"
        "Wall motion: Hypokinetic anterior wall and akinetic inferior wall.\n"
        "Valves:\n"
        "Mitral valve: Mild regurgitation\n"
        "Aortic valve: Moderate stenosis\n"
        "Tricuspid valve: Trace regurgitation"
    )
    doc = Document.from_text(text)
    fields, rejected, warnings = parse_echo(doc)

    # Range midpoint for EF
    assert fields["EF-TTE"].value == 52.5
    assert fields["EF-TTE"].confidence == "check"

    # RWMA counted from text
    assert fields["Region RWMA"].value == "2"
    assert fields["Region RWMA"].confidence == "check"

    # Highest valve severity wins (Moderate > Mild > Trace)
    assert fields["VHD"].value == "Moderate"
    assert any("valves" in w.lower() for w in warnings)

# 8. EHR Outpatient note parser
def test_ehr_parser():
    text = (
        "Outpatient Clinical Consultation Note\n"
        "Age: 64 yo  Gender: Male\n"
        "Vitals: BP 135/85 mmHg, Pulse 76 bpm, Height 175 cm, Weight 70 kg\n"
        "Past Medical History: Diabetes Mellitus, Hypertension.\n"
        "Symptoms: Chest pain: typical angina on exertion.\n"
        "NYHA Functional Class: Class II"
    )
    doc = Document.from_text(text)
    fields, rejected, _ = parse_ehr(doc)

    # Blood pressure systolic only
    assert fields["BP"].value == 135.0
    assert fields["BP"].unit_in_report == "mmHg"

    # Vitals
    assert fields["Age"].value == 64.0
    assert fields["Sex"].value == "Male"
    assert fields["PR"].value == 76.0
    assert fields["Length"].value == 175.0
    assert fields["Weight"].value == 70.0

    # BMI derived from height and weight
    assert fields["BMI"].derived is True
    assert fields["BMI"].confidence == "check"
    # 70 / (1.75^2) = 22.86
    assert fields["BMI"].value == 22.86
    assert "Calculated from height and weight" in fields["BMI"].evidence

    # History
    assert fields["DM"].value == "1"
    assert fields["HTN"].value == "1"

    # Single chest pain line sets only typical chest pain
    assert fields["Typical Chest Pain"].value == "1"
    assert "Atypical" not in fields
    assert "Nonanginal" not in fields
    assert "Exertional CP" not in fields
    assert "LowTH Ang" not in fields

# 9. A parser never returns a key it does not own
def test_parser_never_returns_unowned_keys():
    text = (
        "ECG Report\n"
        "Fasting Blood Glucose: 110 mg/dL\n"
        "Ejection Fraction: 50%\n"
        "Blood Pressure: 120/80 mmHg\n"
        "Q Wave: Present\n"
        "BBB: None"
    )
    doc = Document.from_text(text)
    fields, _, _ = parse_ecg(doc)

    assert set(fields.keys()).issubset(set(owned_keys(ReportType.ecg)))
    assert "FBS" not in fields
    assert "EF-TTE" not in fields
    assert "BP" not in fields
    assert "Q Wave" in fields
    assert "BBB" in fields

# 10. Wrong-type detection
def test_wrong_type_detection():
    echo_text = (
        "Echocardiography Report\n"
        "Ejection fraction: 55%\n"
        "LVEF: 55%\n"
        "Mitral valve: normal\n"
        "Aortic valve: normal\n"
        "Left atrium: normal dimensions\n"
        "Wall motion: normal"
    )
    doc = Document.from_text(echo_text)

    # When uploading Echo text into ECG slot
    suggested = detect_wrong_report_type(ReportType.ecg, doc)
    assert suggested == ReportType.echo

    # When uploading Echo text into correct Echo slot
    assert detect_wrong_report_type(ReportType.echo, doc) is None

# 11. Evidence privacy and bounds
def test_evidence_privacy_and_bounds():
    text = (
        "Blood Lab Report\n"
        "Patient Name: John Doe  MRN: 987654321  DOB: 1970-01-01\n"
        "Serum Creatinine: 1.2 mg/dL"
    )
    doc = Document.from_text(text)
    fields, _, _ = parse_lab(doc)

    assert "CR" in fields
    ev = fields["CR"].evidence
    assert len(ev) <= 80
    assert "John Doe" not in ev
    assert "987654321" not in ev
    assert "1970-01-01" not in ev

# 12. Robustness enhancements (space-separated, multi-item lab, header demographics, gm/dL units)
def test_robustness_extraction_features():
    # A. Header demographics on rows with patient name
    ehr_text = (
        "Clinic Outpatient Note\n"
        "Patient Name: Jane Doe  MRN: 123456  Age: 54  Sex: Female\n"
        "BP 130/80 mmHg  HR 72 bpm\n"
        "Assessment: Patient has hypertension and diabetes."
    )
    doc_ehr = Document.from_text(ehr_text)
    fields_ehr, _, _ = parse_ehr(doc_ehr)
    assert "Age" in fields_ehr and fields_ehr["Age"].value == 54.0
    assert "Sex" in fields_ehr and fields_ehr["Sex"].value == "Female"
    assert "BP" in fields_ehr and fields_ehr["BP"].value == 130.0
    assert "PR" in fields_ehr and fields_ehr["PR"].value == 72.0
    assert "Jane Doe" not in fields_ehr["Age"].evidence
    assert "123456" not in fields_ehr["Age"].evidence

    # B. Multi-item and comma-separated lab panels with alternate units (gm/dL)
    lab_text = (
        "Clinical Laboratory Report\n"
        "Chemistry: FBS 110 mg/dL, Serum Creatinine 1.1 mg/dL, BUN 18 mg/dL\n"
        "Lipid Panel: Total Cholesterol 220 mg/dL, Triglycerides 180 mg/dL, HDL 42 mg/dL, LDL 142 mg/dL\n"
        "Electrolytes: Sodium 140 mEq/L, Potassium 4.2 mEq/L\n"
        "CBC: Hemoglobin 14.5 gm/dL, WBC 7.8 x10^3/uL, Platelets 250 x10^3/uL\n"
        "ESR: 15 mm/hr, Lymphocytes (%): 32%, Neutrophils (%): 62%"
    )
    doc_lab = Document.from_text(lab_text)
    fields_lab, _, _ = parse_lab(doc_lab)
    assert len(fields_lab) == 14
    assert fields_lab["HB"].value == 14.5
    assert fields_lab["FBS"].value == 110.0
    assert fields_lab["CR"].value == 1.1
    assert fields_lab["TG"].value == 180.0
    assert fields_lab["LDL"].value == 142.0
    assert fields_lab["HDL"].value == 42.0

    # C. Outpatient note mentioning ECG findings must NOT trigger wrong_report_type false positive
    consult_note = (
        "Cardiology Consultation Note\n"
        "Patient: 62yo Male presenting with chest pain on exertion.\n"
        "Resting BP 140/90, Pulse 76 bpm.\n"
        "12-Lead ECG performed in clinic: sinus rhythm, normal QRS, ST segment depression.\n"
        "Plan: Medical therapy."
    )
    doc_consult = Document.from_text(consult_note)
    fields_consult, _, _ = parse_ehr(doc_consult)
    # Parser extracts EHR fields (Age, Sex, BP, PR, Chest pain)
    assert len(fields_consult) >= 4
    # Wrong report type detector recognizes fields found and does not flag wrong type
    assert detect_wrong_report_type(ReportType.ehr, doc_consult, fields_found_count=len(fields_consult)) is None
