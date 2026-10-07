"""
Data layer for synthetic clinical report generation.
Loads presets from apps/web/src/store/usePatientStore.ts and provides
formatting primitives, fake identifier generation, decorative constants,
and derived lab distractor calculations.
"""

from datetime import date, timedelta
import json
from pathlib import Path
import re
from typing import Any, Dict, NamedTuple, Optional

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
STORE_TS_PATH = ROOT_DIR / "apps" / "web" / "src" / "store" / "usePatientStore.ts"
SPECS_JSON_PATH = ROOT_DIR / "apps" / "api" / "app" / "extraction" / "field_specs.json"

class PatientPreset(NamedTuple):
    id: str
    name: str
    description: str
    data: Dict[str, Any]

class PatientHeader(NamedTuple):
    name: str
    mrn: str
    dob: str
    age: int
    sex: str
    date_str: str
    facility: str
    physician: str
    synthetic_notice: str

def parse_ts_patient_profiles(ts_content: str) -> Dict[str, Dict[str, Any]]:
    """
    Parses PATIENT_PROFILES object literal from TypeScript file into a Python dict.
    """
    match = re.search(r"export const PATIENT_PROFILES[^=]*=\s*({[\s\S]*?\n};)", ts_content)
    if not match:
        raise ValueError("Could not find PATIENT_PROFILES in usePatientStore.ts")

    raw = match.group(1).rstrip(";").strip()

    # Remove single line comments
    raw = re.sub(r"//.*", "", raw)

    # Replace keys: either unquoted identifiers or single-quoted keys
    # Match key: followed by value
    # We can use a tokenizer approach or regex normalization
    # 1. replace 'key': with "key":
    raw = re.sub(r"'([^']+)'\s*:", r'"\1":', raw)
    # 2. replace unquoted word keys: with "key":
    raw = re.sub(r'(?<=[\s,{])([a-zA-Z0-9_]+)\s*:', r'"\1":', raw)
    # 3. replace single-quoted string values 'val' with "val"
    raw = re.sub(r":\s*'([^']*)'", r': "\1"', raw)
    # 4. remove trailing commas before } or ]
    raw = re.sub(r",\s*([}\]])", r"\1", raw)

    profiles = json.loads(raw)
    return profiles

def load_presets(ts_path: Optional[Path] = None) -> Dict[str, PatientPreset]:
    """
    Loads and validates all presets from usePatientStore.ts.
    """
    path = ts_path or STORE_TS_PATH
    if not path.exists():
        raise FileNotFoundError(f"usePatientStore.ts not found at {path}")

    content = path.read_text(encoding="utf-8")
    raw_profiles = parse_ts_patient_profiles(content)

    # Load field specs to verify all 55 schema fields
    specs: Dict[str, Any] = {}
    if SPECS_JSON_PATH.exists():
        specs = json.loads(SPECS_JSON_PATH.read_text(encoding="utf-8"))

    expected_fields = {item["key"] for item in specs} if isinstance(specs, list) else set(specs.keys())

    presets: Dict[str, PatientPreset] = {}
    for preset_id, info in raw_profiles.items():
        data = info.get("data", {})
        if expected_fields:
            missing = expected_fields - set(data.keys())
            if missing:
                raise ValueError(f"Preset {preset_id} is missing schema fields: {missing}")

        presets[preset_id] = PatientPreset(
            id=preset_id,
            name=info.get("name", preset_id),
            description=info.get("description", ""),
            data=data,
        )

    return presets

# -----------------------------------------------------------------------------
# Formatting Primitives (Task 1.2)
# -----------------------------------------------------------------------------

def format_number(key: str, val: Any) -> str:
    """Formats numeric schema values according to clinical conventions."""
    if val is None:
        return ""
    float_val = float(val)

    # 2 decimals
    if key == "BMI":
        return f"{float_val:.2f}"

    # 1 decimal
    if key in {"CR", "HB", "K"}:
        return f"{float_val:.1f}"

    # WBC: comma separator if >= 1000
    if key == "WBC":
        int_val = int(round(float_val))
        return f"{int_val:,}"

    # Integers (never print with decimal point)
    int_keys = {
        "Age", "Weight", "Length", "BP", "PR", "FBS", "TG",
        "LDL", "HDL", "BUN", "ESR", "Na", "Lymph", "Neut", "PLT", "EF-TTE"
    }
    if key in int_keys or float_val.is_integer():
        return str(int(round(float_val)))

    return str(float_val)

def format_yes_no_ecg(val: Any) -> str:
    """ECG categorical: Present or Absent."""
    s = str(val).strip().upper()
    if s in {"1", "Y", "YES", "TRUE", "PRESENT"}:
        return "Present"
    return "Absent"

def format_yes_no_ehr(val: Any) -> str:
    """EHR categorical: Yes or No."""
    s = str(val).strip().upper()
    if s in {"1", "Y", "YES", "TRUE", "PRESENT"}:
        return "Yes"
    return "No"

def format_bbb(val: Any) -> str:
    """BBB categorical: None, LBBB, or RBBB."""
    s = str(val).strip().upper()
    if s == "LBBB":
        return "LBBB"
    if s == "RBBB":
        return "RBBB"
    return "None"

def format_vhd(val: Any) -> str:
    """VHD categorical: Normal, Mild, Moderate, or Severe."""
    s = str(val).strip().lower()
    if "sev" in s:
        return "Severe"
    if "mod" in s:
        return "Moderate"
    if "mild" in s:
        return "Mild"
    return "Normal"

def format_rwma(val: Any) -> str:
    """RWMA integer count: '0', '1', '2', '4'."""
    s = str(val).strip()
    return s

def format_function_class(val: Any) -> str:
    """NYHA functional class: Class 0, Class I, Class II, Class III, Class IV."""
    s = str(val).strip()
    mapping = {
        "0": "Class 0",
        "1": "Class I",
        "2": "Class II",
        "3": "Class III",
        "4": "Class IV",
    }
    return mapping.get(s, f"Class {s}")

def format_sex(val: Any) -> str:
    s = str(val).strip().capitalize()
    return "Female" if s.startswith("F") else "Male"

# -----------------------------------------------------------------------------
# Fake Identifiers & Header Generator (Task 1.3)
# -----------------------------------------------------------------------------

def generate_patient_header(
    preset: PatientPreset,
    index: int,
    report_date: Optional[date] = None,
) -> PatientHeader:
    """
    Generates synthetic, deterministic patient header metadata.
    """
    d = report_date or date(2026, 3, 15)
    age = int(preset.data.get("Age", 50))
    sex = format_sex(preset.data.get("Sex", "Male"))

    # Fake DOB: report_date - age years - 40 days
    dob_year = d.year - age
    # Approximate DOB
    try:
        dob = date(dob_year, 1, 15)
    except ValueError:
        dob = date(dob_year, 1, 1)

    name_label = preset.name.upper()
    return PatientHeader(
        name=f"SAMPLE, {name_label}",
        mrn=f"SYN-{index:04d}",
        dob=dob.strftime("%Y-%m-%d"),
        age=age,
        sex=sex,
        date_str=d.strftime("%Y-%m-%d"),
        facility="Synthetic Hospital CAD Research Unit",
        physician="Dr. S. Synthetic, MD",
        synthetic_notice="Synthetic sample. Not a real patient.",
    )

# -----------------------------------------------------------------------------
# Decorative Constants (Task 1.4)
# -----------------------------------------------------------------------------

class DecorativeConstants:
    # ECG constants
    ECG_PR_INTERVAL_MS = 160
    ECG_QRS_DURATION_MS = 92
    ECG_QT_MS = 400
    ECG_QTC_MS = 420
    ECG_RHYTHM = "Normal Sinus Rhythm"

    # Echo constants
    ECHO_LVEDD_MM = 48
    ECHO_LVESD_MM = 32
    ECHO_IVS_MM = 10
    ECHO_LA_MM = 36
    ECHO_AO_ROOT_MM = 30

    # EHR constants
    EHR_TEMP_C = 36.8
    EHR_RESP_RATE = 16
    EHR_SPO2 = 98

    @staticmethod
    def get_diastolic_bp(systolic: float) -> int:
        return int(round(systolic * 0.62))

# -----------------------------------------------------------------------------
# Derived Lab Calculations (Task 1.5)
# -----------------------------------------------------------------------------

class DerivedLipids(NamedTuple):
    total_cholesterol: int
    vldl: int
    non_hdl: int
    chol_hdl_ratio: float

def compute_derived_lipids(data: Dict[str, Any]) -> DerivedLipids:
    """
    Computes Friedewald lipid panel values and distractor rows.
    total = HDL + LDL + (TG / 5)
    """
    hdl = float(data.get("HDL", 50))
    ldl = float(data.get("LDL", 100))
    tg = float(data.get("TG", 150))

    vldl = int(round(tg / 5.0))
    total_chol = int(round(hdl + ldl + vldl))
    non_hdl = total_chol - int(round(hdl))
    ratio = round(total_chol / hdl, 2) if hdl > 0 else 0.0

    return DerivedLipids(
        total_cholesterol=total_chol,
        vldl=vldl,
        non_hdl=non_hdl,
        chol_hdl_ratio=ratio,
    )
