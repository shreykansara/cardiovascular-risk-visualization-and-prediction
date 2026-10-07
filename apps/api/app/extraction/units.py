"""
Clinical unit conversion, normalization, and physiological boundary validation.
Strictly implements conversion factors for SI units, US customary units, and alternate clinical scales.
"""

from dataclasses import dataclass
import re
from typing import Optional, Tuple
from .normalize import normalize_text
from .report_types import get_field_spec

@dataclass
class ConvertedValue:
    value: float
    converted: bool
    confidence_check: bool
    unit_in_report: Optional[str]
    rejection_reason: Optional[str] = None
    found_snippet: Optional[str] = None

def normalize_unit_str(unit: Optional[str]) -> str:
    """Normalizes unit strings for robust canonical matching."""
    if not unit:
        return ""
    u = normalize_text(unit).lower().strip()
    u = u.replace(" ", "").replace("⋅", "*").replace("×", "x")
    u = u.replace("micro", "u").replace("µ", "u").replace("mc", "u")
    u = u.replace("gm/dl", "g/dl").replace("gms/dl", "g/dl")
    u = u.replace("gm/l", "g/l").replace("gms/l", "g/l")
    u = u.replace("mg%", "mg/dl").replace("mg/100ml", "mg/dl")
    u = u.replace("mm-hg", "mmhg")
    return u

def convert_and_validate_numeric(
    key: str,
    raw_value: float,
    stated_unit: Optional[str],
    is_urea_source: bool = False,
) -> ConvertedValue:
    """
    Converts raw numeric value to the schema's required unit and enforces hard min/max limits.
    Rules:
    - If stated_unit is None, assumes schema unit and sets confidence_check = True.
    - If stated_unit matches schema unit, no conversion.
    - Standard conversion factors applied when stated_unit matches recognized SI/alternate unit.
    - If stated_unit is unrecognised and differs from schema unit, rejects with 'unknown_unit'.
    - If converted value is outside schema hard min/max, rejects with 'out_of_range'.
    """
    spec = get_field_spec(key)
    schema_unit = spec.get("unit", "")
    hard_min = spec.get("min")
    hard_max = spec.get("max")

    norm_stated = normalize_unit_str(stated_unit)
    norm_schema = normalize_unit_str(schema_unit)

    val = float(raw_value)
    converted = False
    confidence_check = False

    # 1. No unit provided in report
    if not norm_stated:
        confidence_check = True
    elif norm_stated == norm_schema:
        # Matches schema unit directly
        converted = False
    else:
        # Need unit conversion based on field key
        if key == "FBS":  # Glucose
            if norm_stated in {"mmol/l", "mm/l"}:
                val = round(val * 18.016, 2)
                converted = True
            else:
                return ConvertedValue(
                    value=val, converted=False, confidence_check=False,
                    unit_in_report=stated_unit, rejection_reason="unknown_unit",
                    found_snippet=stated_unit,
                )

        elif key == "CR":  # Creatinine
            if norm_stated in {"umol/l", "micromol/l"}:
                val = round(val / 88.4, 2)
                converted = True
            else:
                return ConvertedValue(
                    value=val, converted=False, confidence_check=False,
                    unit_in_report=stated_unit, rejection_reason="unknown_unit",
                    found_snippet=stated_unit,
                )

        elif key == "TG":  # Triglycerides
            if norm_stated in {"mmol/l", "mm/l"}:
                val = round(val * 88.57, 2)
                converted = True
            else:
                return ConvertedValue(
                    value=val, converted=False, confidence_check=False,
                    unit_in_report=stated_unit, rejection_reason="unknown_unit",
                    found_snippet=stated_unit,
                )

        elif key in {"LDL", "HDL"}:  # Cholesterol
            if norm_stated in {"mmol/l", "mm/l"}:
                val = round(val * 38.67, 2)
                converted = True
            else:
                return ConvertedValue(
                    value=val, converted=False, confidence_check=False,
                    unit_in_report=stated_unit, rejection_reason="unknown_unit",
                    found_snippet=stated_unit,
                )

        elif key == "HB":  # Hemoglobin
            if norm_stated in {"g/l", "gm/l"}:
                val = round(val / 10.0, 2)
                converted = True
            else:
                return ConvertedValue(
                    value=val, converted=False, confidence_check=False,
                    unit_in_report=stated_unit, rejection_reason="unknown_unit",
                    found_snippet=stated_unit,
                )

        elif key == "BUN":  # Blood Urea Nitrogen
            if is_urea_source or "urea" in norm_stated:
                if norm_stated in {"mmol/l", "mm/l"}:
                    val = round(val * 2.801, 2)
                    converted = True
                    confidence_check = True
                elif norm_stated in {"mg/dl", "mg%"}:
                    val = round(val / 2.14, 2)
                    converted = True
                    confidence_check = True
                else:
                    return ConvertedValue(
                        value=val, converted=False, confidence_check=False,
                        unit_in_report=stated_unit, rejection_reason="unknown_unit",
                        found_snippet=stated_unit,
                    )
            elif norm_stated in {"mmol/l", "mm/l"}:
                val = round(val * 2.801, 2)
                converted = True
                confidence_check = True
            else:
                return ConvertedValue(
                    value=val, converted=False, confidence_check=False,
                    unit_in_report=stated_unit, rejection_reason="unknown_unit",
                    found_snippet=stated_unit,
                )

        elif key in {"Na", "K"}:  # Sodium and Potassium
            if norm_stated in {"mmol/l", "meq/l"}:
                converted = False
            else:
                return ConvertedValue(
                    value=val, converted=False, confidence_check=False,
                    unit_in_report=stated_unit, rejection_reason="unknown_unit",
                    found_snippet=stated_unit,
                )

        elif key == "WBC":  # Schema unit: /mcL (1000 - 50000)
            if norm_stated in {"cells/ul", "cells/mcl", "/ul", "/mcl", "cumm", "/cumm"}:
                converted = False
            elif any(u in norm_stated for u in ["x10^3", "x10*3", "10^3", "10*3", "10^9/l", "x10^9/l", "k/ul", "k/mcl"]):
                val = round(val * 1000.0, 1)
                converted = True
            elif "lakh" in norm_stated:
                val = round(val * 100000.0, 1)
                converted = True
            else:
                return ConvertedValue(
                    value=val, converted=False, confidence_check=False,
                    unit_in_report=stated_unit, rejection_reason="unknown_unit",
                    found_snippet=stated_unit,
                )

        elif key == "PLT":  # Schema unit: x10³/mcL (10 - 1500)
            if any(u in norm_stated for u in ["x10^3", "x10*3", "10^3", "10*3", "10^9/l", "x10^9/l", "k/ul", "k/mcl"]):
                converted = False
            elif norm_stated in {"cells/ul", "cells/mcl", "/ul", "/mcl", "cumm", "/cumm"}:
                val = round(val / 1000.0, 2)
                converted = True
            elif "lakh" in norm_stated:
                val = round(val * 100.0, 2)
                converted = True
            else:
                return ConvertedValue(
                    value=val, converted=False, confidence_check=False,
                    unit_in_report=stated_unit, rejection_reason="unknown_unit",
                    found_snippet=stated_unit,
                )

        elif key == "Length":  # Height in cm (100 - 240)
            if norm_stated in {"m", "meter", "meters"}:
                val = round(val * 100.0, 1)
                converted = True
            elif norm_stated in {"in", "inch", "inches"}:
                val = round(val * 2.54, 1)
                converted = True
            elif norm_stated in {"cm"}:
                converted = False
            else:
                return ConvertedValue(
                    value=val, converted=False, confidence_check=False,
                    unit_in_report=stated_unit, rejection_reason="unknown_unit",
                    found_snippet=stated_unit,
                )

        elif key == "Weight":  # Weight in kg (30 - 250)
            if norm_stated in {"lb", "lbs", "pound", "pounds"}:
                val = round(val * 0.453592, 1)
                converted = True
            elif norm_stated in {"kg", "kgs"}:
                converted = False
            else:
                return ConvertedValue(
                    value=val, converted=False, confidence_check=False,
                    unit_in_report=stated_unit, rejection_reason="unknown_unit",
                    found_snippet=stated_unit,
                )
        elif key in {"Lymph", "Neut"}:
            if norm_stated not in {"%"}:
                return ConvertedValue(
                    value=val, converted=False, confidence_check=False,
                    unit_in_report=stated_unit, rejection_reason="not_percent",
                    found_snippet=stated_unit or str(raw_value),
                )
        else:
            # Check if norm_stated is compatible with schema unit
            if norm_stated != norm_schema:
                return ConvertedValue(
                    value=val, converted=False, confidence_check=False,
                    unit_in_report=stated_unit, rejection_reason="unknown_unit",
                    found_snippet=stated_unit,
                )

    # 2. Hard min/max range check
    if hard_min is not None and val < hard_min:
        return ConvertedValue(
            value=val, converted=converted, confidence_check=confidence_check,
            unit_in_report=stated_unit, rejection_reason="out_of_range",
            found_snippet=f"{raw_value} {stated_unit or ''}".strip(),
        )
    if hard_max is not None and val > hard_max:
        return ConvertedValue(
            value=val, converted=converted, confidence_check=confidence_check,
            unit_in_report=stated_unit, rejection_reason="out_of_range",
            found_snippet=f"{raw_value} {stated_unit or ''}".strip(),
        )

    return ConvertedValue(
        value=val,
        converted=converted,
        confidence_check=confidence_check,
        unit_in_report=stated_unit,
        rejection_reason=None,
    )
