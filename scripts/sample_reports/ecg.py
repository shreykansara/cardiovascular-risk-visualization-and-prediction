"""
ECG Report Generator (7 schema fields).
Fields owned: Q Wave, St Elevation, St Depression, Tinversion, LVH, Poor R Progression, BBB.
"""

from typing import Any, Dict
from .common import assert_label_matches_synonyms, get_preamble_content, render_latex_header
from .data import DecorativeConstants, PatientHeader, PatientPreset, format_bbb, format_yes_no_ecg

ECG_LABELS = {
    "Q Wave": "Pathological Q wave",
    "St Elevation": "ST elevation",
    "St Depression": "ST depression",
    "Tinversion": "T-wave inversion",
    "LVH": "Left ventricular hypertrophy",
    "Poor R Progression": "Poor R-wave progression",
    "BBB": "Bundle branch block",
}

def validate_ecg_labels() -> None:
    for key, label in ECG_LABELS.items():
        assert_label_matches_synonyms(key, label)

def generate_ecg_tex(
    preset: PatientPreset,
    header: PatientHeader,
    impression_only: bool = False,
) -> str:
    """Generates complete LaTeX source for an ECG report."""
    validate_ecg_labels()
    d = preset.data

    q_val = format_yes_no_ecg(d.get("Q Wave"))
    ste_val = format_yes_no_ecg(d.get("St Elevation"))
    std_val = format_yes_no_ecg(d.get("St Depression"))
    tin_val = format_yes_no_ecg(d.get("Tinversion"))
    lvh_val = format_yes_no_ecg(d.get("LVH"))
    prp_val = format_yes_no_ecg(d.get("Poor R Progression"))
    bbb_val = format_bbb(d.get("BBB"))

    hr = int(d.get("PR", 70))
    pr_int = DecorativeConstants.ECG_PR_INTERVAL_MS
    qrs_dur = DecorativeConstants.ECG_QRS_DURATION_MS
    qt = DecorativeConstants.ECG_QT_MS
    qtc = DecorativeConstants.ECG_QTC_MS
    rhythm = DecorativeConstants.ECG_RHYTHM

    # Clinical impression text based on findings
    abnormalities = []
    if ste_val == "Present":
        abnormalities.append("ST elevation suggestive of acute or evolving transmural injury")
    if std_val == "Present":
        abnormalities.append("ST depression consistent with subendocardial ischemia")
    if tin_val == "Present":
        abnormalities.append("T-wave inversion reflecting repolarization abnormality")
    if q_val == "Present":
        abnormalities.append("pathological Q wave indicative of prior infarction")
    if lvh_val == "Present":
        abnormalities.append("left ventricular hypertrophy")
    if prp_val == "Present":
        abnormalities.append("poor R-wave progression")
    if bbb_val != "None":
        abnormalities.append(f"{bbb_val} bundle branch block")

    if abnormalities:
        impression = "; ".join(abnormalities) + ". Correlate clinically."
    else:
        impression = "Normal 12-lead electrocardiogram. Normal sinus rhythm, no ST elevation, no ST depression, no pathological Q waves, no bundle branch block."

    preamble = get_preamble_content()
    header_tex = render_latex_header(header, "12-Lead Electrocardiogram Report", "Cardiology Non-Invasive Diagnostic Laboratory")

    if not impression_only:
        findings_section = f"""\\section*{{Morphological \\& Ischemic Findings}}

\\begin{{tabular}}{{@{{}} p{{7.2cm}} p{{3.0cm}} p{{6.4cm}} @{{}}}}
  \\toprule
  \\textbf{{Parameter}} & \\textbf{{Result}} & \\textbf{{Diagnostic Criteria / Notes}} \\\\
  \\midrule
  {ECG_LABELS['Q Wave']} & {q_val} & Leads V1--V4 / II, III, aVF ($>0.04$s or $>25$\\% R-wave) \\\\
  {ECG_LABELS['St Elevation']} & {ste_val} & J-point displacement $\\ge 1.0$ mm in limb/precordial \\\\
  {ECG_LABELS['St Depression']} & {std_val} & Horizontal/downsloping $\\ge 0.5$ mm 80ms post-J \\\\
  {ECG_LABELS['Tinversion']} & {tin_val} & Symmetric inversion $\\ge 1.0$ mm in contiguous leads \\\\
  {ECG_LABELS['LVH']} & {lvh_val} & Sokolow-Lyon voltage index (SV1 + RV5 $\\ge 35$ mm) \\\\
  {ECG_LABELS['Poor R Progression']} & {prp_val} & Loss of anterior R-wave amplitude (RV3 $\\le 3$ mm) \\\\
  {ECG_LABELS['BBB']} & {bbb_val} & Intraventricular conduction delay morphology \\\\
  \\bottomrule
\\end{{tabular}}"""
    else:
        findings_section = """% Structured table omitted for impression-only test variant
\\vspace{10pt}
\\noindent
\\textit{Note: Automated tabular morphological grid omitted; clinical interpretation over-read below.}"""

    content = f"""{preamble}

\\begin{{document}}

{header_tex}

\\section*{{Technical & Global Measurements}}

\\begin{{tabular*}}{{\\textwidth}}{{@{{\\extracolsep{{\\fill}}}} l l l l l @{{}}}}
  \\textbf{{Rhythm:}} {rhythm} & \\textbf{{Heart Rate:}} {hr} bpm & \\textbf{{PR Interval:}} {pr_int} ms & \\textbf{{QRS Duration:}} {qrs_dur} ms & \\textbf{{QT / QTc:}} {qt} / {qtc} ms \\\\
\\end{{tabular*}}

\\vspace{{10pt}}

{findings_section}

\\vspace{{12pt}}

\\section*{{Impression & Interpretation}}

\\noindent
\\textbf{{Conclusion:}} {impression}

\\vspace{{18pt}}

\\noindent
\\begin{{tabular*}}{{\\textwidth}}{{@{{\\extracolsep{{\\fill}}}} l r @{{}}}}
  \\textbf{{Over-read by:}} Dr. E. Cardiologist, MD (Cardiology) & \\textbf{{Digitally Signed:}} {header.date_str} 10:15 UTC \\\\
\\end{{tabular*}}

\\end{{document}}
"""
    return content
