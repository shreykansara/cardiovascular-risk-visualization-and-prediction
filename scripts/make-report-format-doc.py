#!/usr/bin/env python3
"""
Generate docs/REPORT_FORMATS.md specification document from
field_specs.json and field_synonyms.json.
"""

import json
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
FIELD_SPECS_PATH = ROOT_DIR / "apps" / "api" / "app" / "extraction" / "field_specs.json"
FIELD_SYNS_PATH = ROOT_DIR / "apps" / "api" / "app" / "extraction" / "field_synonyms.json"
OUTPUT_DOC_PATH = ROOT_DIR / "docs" / "REPORT_FORMATS.md"

def generate_report_format_doc():
    with open(FIELD_SPECS_PATH, "r", encoding="utf-8") as f:
        specs = json.load(f)
    with open(FIELD_SYNS_PATH, "r", encoding="utf-8") as f:
        synonyms = json.load(f)

    specs_by_key = {s["key"]: s for s in specs}

    report_configs = [
        {
            "id": "ecg",
            "name": "ECG report",
            "sections": ["ECG"],
            "purpose": "Extracts resting 12-lead electrocardiographic findings and conduction disturbances.",
            "layout_columns": "Finding | Status",
            "example_table": (
                "| Finding | Status |\n"
                "|---|---|\n"
                "| Pathological Q waves | Absent |\n"
                "| ST Elevation | Present |\n"
                "| ST Depression | Absent |\n"
                "| T-wave Inversion | Present |\n"
                "| Left Ventricular Hypertrophy | Absent |\n"
                "| Poor R Wave Progression | Absent |\n"
                "| Bundle Branch Block | LBBB |"
            ),
        },
        {
            "id": "echo",
            "name": "Echo report",
            "sections": ["Echocardiography"],
            "purpose": "Extracts transthoracic echocardiographic systolic parameters, regional wall motion abnormality scores, and valvulopathy grades.",
            "layout_columns": "Parameter | Value",
            "example_table": (
                "| Parameter | Value |\n"
                "|---|---|\n"
                "| Left Ventricular Ejection Fraction (LVEF) | 52% |\n"
                "| Regional Wall Motion Abnormality | 1: Anterior Wall RWMA |\n"
                "| Valvular Heart Disease | Mild regurgitation |"
            ),
        },
        {
            "id": "lab",
            "name": "Blood lab report",
            "sections": ["Laboratory"],
            "purpose": "Extracts serum chemistry, hematology, lipid panel, and renal biomarkers.",
            "layout_columns": "Test | Result | Unit | Reference range",
            "example_table": (
                "| Test | Result | Unit | Reference range |\n"
                "|---|---|---|---|\n"
                "| Fasting Blood Glucose | 118 | mg/dL | 70 - 99 |\n"
                "| Serum Creatinine | 1.1 | mg/dL | 0.7 - 1.3 |\n"
                "| Triglycerides | 185 | mg/dL | < 150 |\n"
                "| LDL Cholesterol | 132 | mg/dL | < 100 |\n"
                "| HDL Cholesterol | 38 | mg/dL | > 40 |\n"
                "| Blood Urea Nitrogen | 21 | mg/dL | 7 - 20 |\n"
                "| ESR | 18 | mm/hr | 0 - 20 |\n"
                "| Hemoglobin | 13.8 | g/dL | 12.0 - 16.0 |\n"
                "| Potassium | 4.3 | mEq/L | 3.5 - 5.1 |\n"
                "| Sodium | 142 | mEq/L | 136 - 145 |\n"
                "| White Blood Cells | 7400 | /mcL | 4000 - 11000 |\n"
                "| Lymphocytes (%) | 29 | % | 20 - 40 |\n"
                "| Neutrophils (%) | 64 | % | 40 - 75 |\n"
                "| Platelets | 225 | x10³/mcL | 150 - 450 |"
            ),
        },
        {
            "id": "ehr",
            "name": "Outpatient note",
            "sections": ["Demographics", "Clinical Examination"],
            "purpose": "Extracts patient demographics, vital signs, clinical medical history, physical exam findings, and chest pain symptom classification.",
            "layout_columns": "Parameter / Finding | Value / Status",
            "example_table": (
                "| Parameter | Value |\n"
                "|---|---|\n"
                "| Patient Age | 62 years |\n"
                "| Biological Sex | Male |\n"
                "| Body Weight | 78 kg |\n"
                "| Body Height | 172 cm |\n"
                "| Blood Pressure | 140/85 mmHg |\n"
                "| Resting Pulse Rate | 78 bpm |\n"
                "| Diabetes Mellitus | Yes |\n"
                "| Hypertension | Yes |\n"
                "| NYHA Functional Class | Class II |"
            ),
        },
    ]

    doc_lines = [
        "# Clinical Report Ingestion Format Specification",
        "",
        "This document details the recommended layout and supported vocabulary for the four report types ingestion backbone.",
        "Deterministic parsers parse files directly in memory using exact keyword matching, regex grammar, and unit conversion tables.",
        "",
        "> [!IMPORTANT]",
        "> **Text Layer Requirement**: Scanned image-only PDFs without a readable OCR/text layer are **not** supported.",
        "> The parser expects searchable text characters (`%PDF-` with standard text streams). Documents with fewer than 40 non-whitespace characters return `no_text_layer`.",
        "",
        "---",
        "",
    ]

    for cfg in report_configs:
        sec_keys = [k for k, s in specs_by_key.items() if s["section"] in cfg["sections"]]

        doc_lines.extend([
            f"## {cfg['name']} (`{cfg['id']}`)",
            "",
            f"**Purpose**: {cfg['purpose']}",
            f"**Total Owned Fields**: {len(sec_keys)} fields.",
            "",
            "### Recommended Layout",
            f"1. **Title line**: Include the report name near the top of Page 1 (e.g., `\"{cfg['name']}\"`).",
            "2. **Identifier header block**: Standard hospital headers (e.g. `Patient Name: John Doe`, `MRN: 12345`, `DOB: 1965-04-12`) are automatically ignored.",
            f"3. **Structured Table**: The parser reads best from clean tabular layouts with columns: `{cfg['layout_columns']}`.",
            "",
            cfg["example_table"],
            "",
            "### Owned Fields Catalog & Accepted Synonyms",
            "",
            "| Key | Label | Schema Unit | Allowed Values | Accepted Synonyms |",
            "|---|---|---|---|---|",
        ])

        for k in sec_keys:
            spec = specs_by_key[k]
            syn_list = synonyms.get(k, [])
            syn_str = ", ".join(f"`{s}`" for s in syn_list[:6])
            if len(syn_list) > 6:
                syn_str += f", *+{len(syn_list)-6} more*"
            
            allowed = ", ".join(f"'{v}'" for v in spec["allowed_values"]) if spec.get("allowed_values") else "-"
            unit_str = spec["unit"] or "-"

            doc_lines.append(
                f"| `{k}` | {spec['label']} | {unit_str} | {allowed} | {syn_str} |"
            )

        doc_lines.extend([
            "",
            "### Missing Fields and Confidence Rules",
            "- **Missing values**: If a row or test is absent from the report, it is **never** filled with default values (it is returned in `not_found` and remains empty in the UI form).",
            "- **Confidence `high`**: Assigned when an explicit value is found with declared schema units in structured rows.",
            "- **Confidence `check`**: Assigned when:",
            "  - The report omitted the unit and the schema default unit was assumed;",
            "  - A numeric range was provided (e.g. `50-55 %`) and the midpoint was calculated;",
            "  - A conversion from blood urea to BUN was performed;",
            "  - An abnormal wall motion region count was derived from descriptive text;",
            "  - A derived BMI was calculated from reported height and weight;",
            "  - Free-text fallback negation detection was utilized.",
            "",
            "---",
            "",
        ])

    doc_lines.extend([
        "## Layout Tips for LaTeX",
        "",
        "When generating sample LaTeX reports for testing or clinical templates:",
        "1. **Standard Fonts**: Use standard Computer Modern, Latin Modern, or Helvetica (`lmodern`, `helvet`). Do not embed text inside flattened images.",
        "2. **Tabular Environments**: Use `tabular`, `tabularx`, or `booktabs` with clear column separation (e.g. `&` separators). LaTeX tables with clean horizontal rules (`\\toprule`, `\\midrule`, `\\bottomrule`) parse with high accuracy.",
        "3. **Explicit Units**: State units in a dedicated `Unit` column or immediately following the numeric result (e.g., `118 mg/dL` or separate column).",
        "4. **No Rotated or Scaled Text**: Avoid rotating text or placing tabular data inside rotated minipages or multi-column nested graphics.",
        "5. **Clean Multi-row Headers**: Use a single table header row with standard column headers like `Test`, `Result`, `Unit`, `Reference Range`.",
        "",
        "---",
        "Generated by `scripts/make-report-format-doc.py` from `field_specs.json` and `field_synonyms.json`."
    ])

    OUTPUT_DOC_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_DOC_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(doc_lines) + "\n")

    print(f"Successfully generated {OUTPUT_DOC_PATH}")

if __name__ == "__main__":
    generate_report_format_doc()
