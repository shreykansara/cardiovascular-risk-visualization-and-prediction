"""
EHR Outpatient Clinical Note Generator (31 schema fields).
Fields owned:
- Demographics: Age, Sex, Weight, Length, BMI
- Vitals & Functional: BP, PR, Function Class
- Medical History: DM, HTN, Current Smoker, EX-Smoker, FH, Obesity, CRF, CVA, Airway disease, Thyroid Disease, CHF, DLP
- Symptoms & Physical Exam: Typical Chest Pain, Atypical, Nonanginal, Exertional CP, LowTH Ang,
  Dyspnea, Edema, Weak Peripheral Pulse, Lung rales, Systolic Murmur, Diastolic Murmur
"""

from typing import Any, Dict
from .common import assert_label_matches_synonyms, get_preamble_content, render_latex_header
from .data import (
    DecorativeConstants,
    PatientHeader,
    PatientPreset,
    format_function_class,
    format_number,
    format_sex,
    format_yes_no_ehr,
)

EHR_LABELS = {
    "Age": "Age",
    "Sex": "Sex",
    "Weight": "Weight",
    "Length": "Height",
    "BMI": "Body mass index",
    "BP": "Blood pressure",
    "PR": "Pulse rate",
    "Function Class": "Function class",
    "DM": "Diabetes mellitus",
    "HTN": "Hypertension",
    "Current Smoker": "Current smoker",
    "EX-Smoker": "Ex-smoker",
    "FH": "Family history of CAD",
    "Obesity": "Obesity",
    "CRF": "Chronic renal failure",
    "CVA": "Cerebrovascular accident",
    "Airway disease": "Airway disease",
    "Thyroid Disease": "Thyroid disease",
    "CHF": "Congestive heart failure",
    "DLP": "Dyslipidemia",
    "Typical Chest Pain": "Typical chest pain",
    "Atypical": "Atypical chest pain",
    "Nonanginal": "Non-anginal chest pain",
    "Exertional CP": "Exertional chest pain",
    "LowTH Ang": "Low threshold angina",
    "Dyspnea": "Dyspnea",
    "Edema": "Edema",
    "Weak Peripheral Pulse": "Weak peripheral pulse",
    "Lung rales": "Lung rales",
    "Systolic Murmur": "Systolic murmur",
    "Diastolic Murmur": "Diastolic murmur",
}

def validate_ehr_labels() -> None:
    for key, label in EHR_LABELS.items():
        assert_label_matches_synonyms(key, label)

def generate_ehr_tex(
    preset: PatientPreset,
    header: PatientHeader,
    narrative_only: bool = False,
) -> str:
    """
    Generates complete LaTeX source for an Outpatient Clinical Note.
    Supports standard structured format and narrative-only variant.
    """
    validate_ehr_labels()
    d = preset.data

    age_val = format_number("Age", d.get("Age"))
    sex_val = format_sex(d.get("Sex"))
    weight_val = format_number("Weight", d.get("Weight"))
    length_val = format_number("Length", d.get("Length"))
    bmi_val = format_number("BMI", d.get("BMI"))

    systolic = float(d.get("BP", 120))
    diastolic = DecorativeConstants.get_diastolic_bp(systolic)
    pr_val = format_number("PR", d.get("PR"))
    fc_val = format_function_class(d.get("Function Class"))

    temp = DecorativeConstants.EHR_TEMP_C
    rr = DecorativeConstants.EHR_RESP_RATE
    spo2 = DecorativeConstants.EHR_SPO2

    # Categorical fields
    history_fields = [
        ("DM", "Diabetes mellitus"),
        ("HTN", "Hypertension"),
        ("Current Smoker", "Current smoker"),
        ("EX-Smoker", "Ex-smoker"),
        ("FH", "Family history of CAD"),
        ("Obesity", "Obesity"),
        ("CRF", "Chronic renal failure"),
        ("CVA", "Cerebrovascular accident"),
        ("Airway disease", "Airway disease"),
        ("Thyroid Disease", "Thyroid disease"),
        ("CHF", "Congestive heart failure"),
        ("DLP", "Dyslipidemia"),
    ]

    symptom_fields = [
        ("Typical Chest Pain", "Typical chest pain"),
        ("Atypical", "Atypical chest pain"),
        ("Nonanginal", "Non-anginal chest pain"),
        ("Exertional CP", "Exertional chest pain"),
        ("LowTH Ang", "Low threshold angina"),
        ("Dyspnea", "Dyspnea"),
        ("Edema", "Edema"),
        ("Weak Peripheral Pulse", "Weak peripheral pulse"),
        ("Lung rales", "Lung rales"),
        ("Systolic Murmur", "Systolic murmur"),
        ("Diastolic Murmur", "Diastolic murmur"),
    ]

    hist_statuses = {k: format_yes_no_ehr(d.get(k)) for k, _ in history_fields}
    symp_statuses = {k: format_yes_no_ehr(d.get(k)) for k, _ in symptom_fields}

    preamble = get_preamble_content()
    header_tex = render_latex_header(header, "Ambulatory Outpatient Cardiology Consultation Note", "Cardiovascular Outpatient Clinic")

    if not narrative_only:
        hist_rows = []
        for key, label in history_fields:
            status = hist_statuses[key]
            notes = "Documented active diagnosis" if status == "Yes" else "No clinical history reported"
            hist_rows.append(f"  {label} & {status} & {notes} \\\\")

        symp_rows = []
        for key, label in symptom_fields:
            status = symp_statuses[key]
            notes = "Present on current evaluation" if status == "Yes" else "Absent on review of systems / exam"
            symp_rows.append(f"  {label} & {status} & {notes} \\\\")

        history_section = f"""\\section*{{Past Medical History \\& Cardiovascular Risk Factors}}

\\begin{{tabular}}{{@{{}} p{{6.8cm}} p{{2.8cm}} p{{5.5cm}} @{{}}}}
  \\toprule
  \\textbf{{Risk Factor / Comorbidity}} & \\textbf{{Status}} & \\textbf{{Clinical Details}} \\\\
  \\midrule
{chr(10).join(hist_rows)}
  \\bottomrule
\\end{{tabular}}"""

        exam_section = f"""\\section*{{Cardiovascular Symptoms \\& Physical Examination}}

\\begin{{tabular}}{{@{{}} p{{6.8cm}} p{{2.8cm}} p{{5.5cm}} @{{}}}}
  \\toprule
  \\textbf{{Symptom / Examination Sign}} & \\textbf{{Status}} & \\textbf{{Clinical Details}} \\\\
  \\midrule
{chr(10).join(symp_rows)}
  \\bottomrule
\\end{{tabular}}"""

    else:
        # Narrative-only variant: paragraphs describing positive findings
        pos_hist = [lbl for k, lbl in history_fields if hist_statuses[k] == "Yes"]
        pos_symp = [lbl for k, lbl in symptom_fields if symp_statuses[k] == "Yes"]

        hist_text = (
            f"Past history: Patient has active medical history of {', '.join(pos_hist)}."
            if pos_hist else "Past history: No history of major cardiovascular risk factors or systemic disease."
        )
        exam_text = (
            f"Physical examination: Cardiovascular examination is notable for {', '.join(pos_symp)}."
            if pos_symp else "Physical examination: Normal cardiovascular examination. Peripheral pulses intact, no edema or murmurs."
        )

        history_section = f"""\\section*{{Medical History}}

\\noindent
{hist_text}"""

        exam_section = f"""\\section*{{Physical Examination \\& Review of Systems}}

\\noindent
{exam_text}"""

    content = f"""{preamble}

\\begin{{document}}

{header_tex}

\\section*{{Demographics \\& Vital Signs}}

\\begin{{tabular*}}{{\\textwidth}}{{@{{}} l @{{\\extracolsep{{\\fill}}}} l @{{\\extracolsep{{\\fill}}}} l @{{}}}}
  \\textbf{{Age:}} {age_val} years & \\textbf{{Sex:}} {sex_val} & \\textbf{{Height:}} {length_val} cm \\\\
  \\textbf{{Weight:}} {weight_val} kg & \\textbf{{Body mass index:}} {bmi_val} kg/m2 & \\textbf{{Function class:}} {fc_val} \\\\
  \\textbf{{Blood pressure:}} {int(systolic)}/{diastolic} mmHg & \\textbf{{Pulse rate:}} {pr_val} bpm & \\textbf{{SpO2:}} {spo2}\\% (Room air) \\\\
\\end{{tabular*}}

\\vspace{{8pt}}

{history_section}

\\vspace{{8pt}}

{exam_section}

\\vspace{{8pt}}

\\section*{{Assessment \\& Clinical Plan}}

\\noindent
\\textbf{{Impression:}} Patient evaluated for CAD stratification. Comprehensive assessment based on clinical presentation, hemodynamic profile, and non-invasive testing. Optimization of risk factor profile and follow-up as indicated.

\\vspace{{14pt}}

\\noindent
\\begin{{tabular*}}{{\\textwidth}}{{@{{}} l @{{\\extracolsep{{\\fill}}}} r @{{}}}}
  \\textbf{{Attending Physician:}} Dr. S. Synthetic, MD & \\textbf{{Encounter Date:}} {header.date_str} \\\\
\\end{{tabular*}}

\\end{{document}}
"""
    return content
