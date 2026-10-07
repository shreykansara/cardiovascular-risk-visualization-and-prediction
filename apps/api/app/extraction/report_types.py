"""
Report Types, Display Names, and Schema-Derived Field Ownership.
Strictly maps each ReportType to its owned clinical schema keys.
"""

from enum import Enum
import json
from pathlib import Path
from typing import Dict, List, Set

FIELD_SPECS_PATH = Path(__file__).resolve().parent / "field_specs.json"

class ReportType(str, Enum):
    ecg = "ecg"
    echo = "echo"
    lab = "lab"
    ehr = "ehr"

REPORT_DISPLAY_NAMES: Dict[ReportType, str] = {
    ReportType.ecg: "ECG report",
    ReportType.echo: "Echo report",
    ReportType.lab: "Blood lab report",
    ReportType.ehr: "Outpatient note",
}

REPORT_SECTIONS: Dict[ReportType, Set[str]] = {
    ReportType.ecg: {"ECG"},
    ReportType.echo: {"Echocardiography"},
    ReportType.lab: {"Laboratory"},
    ReportType.ehr: {"Demographics", "Clinical Examination"},
}

def _load_field_specs() -> List[dict]:
    if not FIELD_SPECS_PATH.exists():
        raise FileNotFoundError(f"field_specs.json not found at {FIELD_SPECS_PATH}")
    with open(FIELD_SPECS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

ALL_FIELD_SPECS = _load_field_specs()
ALL_FIELD_KEYS: List[str] = [spec["key"] for spec in ALL_FIELD_SPECS]

# Derive owned keys strictly from schema section attribute
_OWNED_KEYS_BY_TYPE: Dict[ReportType, List[str]] = {}
for r_type, sections in REPORT_SECTIONS.items():
    _OWNED_KEYS_BY_TYPE[r_type] = [
        spec["key"] for spec in ALL_FIELD_SPECS if spec["section"] in sections
    ]

def owned_keys(report_type: ReportType) -> List[str]:
    """Returns the ordered list of schema keys owned by the report type."""
    return list(_OWNED_KEYS_BY_TYPE[report_type])

def get_field_spec(key: str) -> dict:
    """Returns the specification dict for a given schema key."""
    for spec in ALL_FIELD_SPECS:
        if spec["key"] == key:
            return spec
    raise KeyError(f"Unknown field key: {key}")

# --- Import-time integrity assertions ---
ecg_keys = set(owned_keys(ReportType.ecg))
echo_keys = set(owned_keys(ReportType.echo))
lab_keys = set(owned_keys(ReportType.lab))
ehr_keys = set(owned_keys(ReportType.ehr))

# Check counts
if len(ecg_keys) != 7:
    raise AssertionError(f"Expected 7 ECG keys, got {len(ecg_keys)}: {ecg_keys}")
if len(echo_keys) != 3:
    raise AssertionError(f"Expected 3 Echo keys, got {len(echo_keys)}: {echo_keys}")
if len(lab_keys) != 14:
    raise AssertionError(f"Expected 14 Lab keys, got {len(lab_keys)}: {lab_keys}")
if len(ehr_keys) != 31:
    raise AssertionError(f"Expected 31 EHR keys, got {len(ehr_keys)}: {ehr_keys}")

# Check pairwise disjointness
all_sets = [ecg_keys, echo_keys, lab_keys, ehr_keys]
for i in range(len(all_sets)):
    for j in range(i + 1, len(all_sets)):
        intersection = all_sets[i] & all_sets[j]
        if intersection:
            raise AssertionError(f"Overlapping keys between report types: {intersection}")

# Check union equals all 55 keys
total_owned = ecg_keys | echo_keys | lab_keys | ehr_keys
all_keys_set = set(ALL_FIELD_KEYS)
if total_owned != all_keys_set:
    missing = all_keys_set - total_owned
    extra = total_owned - all_keys_set
    raise AssertionError(f"Discrepancy in owned keys! Missing: {missing}, Extra: {extra}")

if len(total_owned) != 55:
    raise AssertionError(f"Expected total 55 owned keys, got {len(total_owned)}")
