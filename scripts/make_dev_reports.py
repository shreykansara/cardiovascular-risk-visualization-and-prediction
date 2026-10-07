"""
Script: scripts/make_dev_reports.py
Generates temporary synthetic test PDFs with text layers using ReportLab for:
- ecg.pdf
- echo.pdf
- lab.pdf
- ehr.pdf
- lab_partial.pdf
- lab_si_units.pdf
- wrong_slot.pdf
All PDFs are saved to docs/dev-sample-reports/
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "docs", "dev-sample-reports")
os.makedirs(OUTPUT_DIR, exist_ok=True)

styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    "ReportTitle",
    parent=styles["Heading1"],
    fontSize=16,
    leading=20,
    textColor=colors.HexColor("#1e293b"),
    spaceAfter=4,
)

banner_style = ParagraphStyle(
    "SyntheticBanner",
    parent=styles["Normal"],
    fontSize=10,
    leading=12,
    textColor=colors.HexColor("#dc2626"),
    spaceAfter=8,
)

id_block_style = ParagraphStyle(
    "IdBlock",
    parent=styles["Normal"],
    fontSize=9,
    leading=13,
    textColor=colors.HexColor("#475569"),
    spaceAfter=12,
)

cell_style = ParagraphStyle(
    "TableCell",
    parent=styles["Normal"],
    fontSize=9,
    leading=11,
    textColor=colors.HexColor("#0f172a"),
)

header_cell_style = ParagraphStyle(
    "TableHeader",
    parent=styles["Normal"],
    fontSize=9,
    leading=11,
    textColor=colors.HexColor("#0f172a"),
    fontName="Helvetica-Bold",
)

def create_table_flowable(data, col_widths=None):
    formatted = []
    for r_idx, row in enumerate(data):
        row_cells = []
        for cell in row:
            st = header_cell_style if r_idx == 0 else cell_style
            row_cells.append(Paragraph(str(cell), st))
        formatted.append(row_cells)
    
    t = Table(formatted, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor("#94a3b8")),
        ('LINEBELOW', (0, 1), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
    ]))
    return t

def build_pdf(filename, title, banner, id_block, elements):
    filepath = os.path.join(OUTPUT_DIR, filename)
    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )
    story = [
        Paragraph(title, title_style),
        Paragraph(banner, banner_style),
        Paragraph(id_block, id_block_style),
        Spacer(1, 8),
    ]
    story.extend(elements)
    doc.build(story)
    print(f"Generated: {filepath}")

# 1. ECG REPORT
def make_ecg_pdf():
    data = [
        ["Finding", "Status"],
        ["Pathological Q waves", "Absent"],
        ["ST segment elevation", "Absent"],
        ["ST segment depression", "Absent"],
        ["T wave inversion", "Absent"],
        ["Left ventricular hypertrophy (LVH)", "No"],
        ["Poor R wave progression", "No"],
        ["Bundle branch block (BBB)", "None"],
    ]
    t = create_table_flowable(data, col_widths=[280, 200])
    build_pdf(
        "ecg.pdf",
        "12-Lead Electrocardiogram (ECG) Report",
        "Synthetic sample. Not a real patient.",
        "Patient Name: John Doe &nbsp;&nbsp;&nbsp; MRN: MRN-99214 &nbsp;&nbsp;&nbsp; DOB: 1988-02-14 &nbsp;&nbsp;&nbsp; Sex: Male",
        [t],
    )

# 2. ECHO REPORT
def make_echo_pdf(filename="echo.pdf"):
    data = [
        ["Parameter", "Value"],
        ["Left ventricular ejection fraction (LVEF)", "60 %"],
        ["Regions with RWMA", "0"],
        ["Mitral valve", "Normal"],
        ["Aortic valve", "Normal"],
        ["Tricuspid valve", "Normal"],
        ["Pulmonary valve", "Normal"],
    ]
    t = create_table_flowable(data, col_widths=[280, 200])
    build_pdf(
        filename,
        "Transthoracic Echocardiogram (Echo) Report",
        "Synthetic sample. Not a real patient.",
        "Patient Name: Jane Smith &nbsp;&nbsp;&nbsp; UHID: UHID-48210 &nbsp;&nbsp;&nbsp; Age: 38",
        [t],
    )

# 3. LAB REPORT
def make_lab_pdf():
    data = [
        ["Test", "Result", "Unit", "Reference range"],
        ["Fasting blood sugar (FBS)", "80", "mg/dL", "70 - 99"],
        ["Serum creatinine", "0.6", "mg/dL", "0.5 - 1.2"],
        ["Triglycerides", "41", "mg/dL", "< 150"],
        ["LDL cholesterol", "85", "mg/dL", "< 100"],
        ["HDL cholesterol", "65", "mg/dL", "> 40"],
        ["Blood urea nitrogen (BUN)", "10", "mg/dL", "7 - 20"],
        ["Erythrocyte sedimentation rate (ESR)", "8", "mm/hr", "0 - 15"],
        ["Hemoglobin (Hb)", "14.0", "g/dL", "13.0 - 17.0"],
        ["Serum potassium (K+)", "4.2", "mEq/L", "3.5 - 5.0"],
        ["Serum sodium (Na+)", "140", "mEq/L", "135 - 145"],
        ["White blood cell count (WBC)", "5500", "cells/uL", "4000 - 11000"],
        ["Lymphocytes (%)", "35", "%", "20 - 40"],
        ["Neutrophils (%)", "55", "%", "40 - 70"],
        ["Platelet count", "220", "x10^3/uL", "150 - 450"],
    ]
    t = create_table_flowable(data, col_widths=[180, 80, 100, 120])
    build_pdf(
        "lab.pdf",
        "Comprehensive Blood Laboratory Report",
        "Synthetic sample. Not a real patient.",
        "Name: Alexander Test &nbsp;&nbsp;&nbsp; Patient ID: LAB-77123 &nbsp;&nbsp;&nbsp; Date: 2026-03-15",
        [t],
    )

# 4. EHR REPORT
def make_ehr_pdf():
    vitals_data = [
        ["Vital Sign / Metric", "Value"],
        ["Age", "38 yo"],
        ["Gender", "Male"],
        ["Body weight", "66 kg"],
        ["Body height", "166 cm"],
        ["Body mass index (BMI)", "23.95 kg/m²"],
        ["Resting blood pressure (BP)", "110/70 mmHg"],
        ["Resting pulse rate (PR)", "70 bpm"],
    ]
    t_vitals = create_table_flowable(vitals_data, col_widths=[260, 220])

    history_data = [
        ["Condition / Finding", "Status"],
        ["Diabetes mellitus (DM)", "No"],
        ["Hypertension (HTN)", "No"],
        ["Current smoker", "No"],
        ["Former smoker (EX-Smoker)", "No"],
        ["Family history of CAD", "No"],
        ["Obesity", "No"],
        ["Chronic renal failure (CRF)", "No"],
        ["Cerebrovascular accident (CVA)", "No"],
        ["Airway disease", "No"],
        ["Thyroid disease", "No"],
        ["Congestive heart failure (CHF)", "No"],
        ["Dyslipidemia (DLP)", "No"],
        ["Peripheral edema", "No"],
        ["Weak peripheral pulse", "No"],
        ["Lung rales", "No"],
        ["Systolic murmur", "No"],
        ["Diastolic murmur", "No"],
        ["Typical chest pain", "No"],
        ["Dyspnea", "No"],
        ["NYHA Functional Class", "Class 0"],
        ["Atypical chest pain", "No"],
        ["Non-anginal chest pain", "No"],
        ["Exertional chest pain", "No"],
        ["Low threshold angina", "No"],
    ]
    t_history = create_table_flowable(history_data, col_widths=[260, 220])

    build_pdf(
        "ehr.pdf",
        "Outpatient Consultation Note",
        "Synthetic sample. Not a real patient.",
        "Patient Name: Robert Sample &nbsp;&nbsp;&nbsp; MRN: 1092837 &nbsp;&nbsp;&nbsp; DOB: 1988-01-01",
        [t_vitals, Spacer(1, 10), t_history],
    )

# 5. LAB PARTIAL (7 tests only)
def make_lab_partial_pdf():
    data = [
        ["Test", "Result", "Unit", "Reference range"],
        ["Fasting blood sugar (FBS)", "80", "mg/dL", "70 - 99"],
        ["Serum creatinine", "0.6", "mg/dL", "0.5 - 1.2"],
        ["Triglycerides", "41", "mg/dL", "< 150"],
        ["LDL cholesterol", "85", "mg/dL", "< 100"],
        ["HDL cholesterol", "65", "mg/dL", "> 40"],
        ["Hemoglobin (Hb)", "14.0", "g/dL", "13.0 - 17.0"],
        ["White blood cell count (WBC)", "5500", "cells/uL", "4000 - 11000"],
    ]
    t = create_table_flowable(data, col_widths=[180, 80, 100, 120])
    build_pdf(
        "lab_partial.pdf",
        "Comprehensive Blood Laboratory Report (Partial)",
        "Synthetic sample. Not a real patient.",
        "Name: Alexander Test &nbsp;&nbsp;&nbsp; Patient ID: LAB-77123 &nbsp;&nbsp;&nbsp; Date: 2026-03-15",
        [t],
    )

# 6. LAB SI UNITS
def make_lab_si_units_pdf():
    data = [
        ["Test", "Result", "Unit", "Reference range"],
        ["Fasting blood sugar (FBS)", "4.44", "mmol/L", "3.9 - 5.5"],
        ["Serum creatinine", "53.04", "umol/L", "44 - 106"],
        ["Triglycerides", "0.46", "mmol/L", "< 1.7"],
        ["LDL cholesterol", "2.20", "mmol/L", "< 2.6"],
        ["HDL cholesterol", "1.68", "mmol/L", "> 1.0"],
        ["Blood urea nitrogen (BUN)", "10", "mg/dL", "7 - 20"],
        ["Erythrocyte sedimentation rate (ESR)", "8", "mm/hr", "0 - 15"],
        ["Hemoglobin (Hb)", "140", "g/L", "130 - 170"],
        ["Serum potassium (K+)", "4.2", "mEq/L", "3.5 - 5.0"],
        ["Serum sodium (Na+)", "140", "mEq/L", "135 - 145"],
        ["White blood cell count (WBC)", "5500", "cells/uL", "4000 - 11000"],
        ["Lymphocytes (%)", "35", "%", "20 - 40"],
        ["Neutrophils (%)", "55", "%", "40 - 70"],
        ["Platelet count", "220", "x10^3/uL", "150 - 450"],
    ]
    t = create_table_flowable(data, col_widths=[180, 80, 100, 120])
    build_pdf(
        "lab_si_units.pdf",
        "Comprehensive Blood Laboratory Report (SI Units)",
        "Synthetic sample. Not a real patient.",
        "Name: Alexander Test &nbsp;&nbsp;&nbsp; Patient ID: LAB-77123 &nbsp;&nbsp;&nbsp; Date: 2026-03-15",
        [t],
    )

if __name__ == "__main__":
    make_ecg_pdf()
    make_echo_pdf("echo.pdf")
    make_lab_pdf()
    make_ehr_pdf()
    make_lab_partial_pdf()
    make_lab_si_units_pdf()
    make_echo_pdf("wrong_slot.pdf")
    print("All dev reports generated successfully.")
