"""
Numeric value and unit parsing primitives.
Extracts numbers, units, handles ranges (midpoint), censored values (<0.5, >90), and flag characters (H/L).
Ignores parenthetical text and reference ranges.
"""

from dataclasses import dataclass
import re
from typing import Optional, Tuple
from .normalize import normalize_text

@dataclass
class ParsedValue:
    value: Optional[float]
    unit: Optional[str]
    raw_snippet: str
    is_censored: bool = False
    censored_snippet: str = ""
    is_range_midpoint: bool = False

def clean_non_result_text(text: str) -> str:
    """
    Removes text inside parentheses and text following 'ref', 'normal', 'range'.
    """
    s = normalize_text(text)
    # Remove parentheses and their contents: e.g. "14.2 (12-16 g/dL)" -> "14.2"
    s = re.sub(r"\([^)]*\)", " ", s)

    # Cut off at reference range markers
    ref_marker_match = re.search(r"\b(ref|reference|normal|range)\b", s, re.IGNORECASE)
    if ref_marker_match:
        s = s[:ref_marker_match.start()]

    return s.strip()

def parse_numeric_value_and_unit(text: str) -> Optional[ParsedValue]:
    """
    Parses a numeric value with optional unit from a string or table cell.
    Supports:
    - Standard floats/ints: "1.05", "140", "12.5"
    - Flags ignored: "12.5 H", "4.1 L", "15.0 High", "3.2 Low", "12.0 *"
    - Ranges: "50-55" -> midpoint 52.5 with is_range_midpoint=True
    - Censored: "<0.5", ">90", "<=1.0", ">=100" -> is_censored=True
    """
    cleaned = clean_non_result_text(text)
    if not cleaned:
        return None

    # Check for censored values: e.g. "<0.5", ">90", "< 10"
    censored_match = re.search(r"([<>]=?\s*[0-9]+(?:\.[0-9]+)?)", cleaned)
    if censored_match:
        return ParsedValue(
            value=None,
            unit=None,
            raw_snippet=cleaned,
            is_censored=True,
            censored_snippet=censored_match.group(1).replace(" ", ""),
        )

    # Check for range: e.g. "50-55", "50 - 55", "12.0 - 14.5"
    range_match = re.search(r"\b([0-9]+(?:\.[0-9]+)?)\s*-\s*([0-9]+(?:\.[0-9]+)?)\b", cleaned)
    if range_match:
        low = float(range_match.group(1))
        high = float(range_match.group(2))
        midpoint = round((low + high) / 2.0, 4)

        # Extract unit after range
        rest_of_text = cleaned[range_match.end():].strip()
        unit = extract_unit(rest_of_text)

        return ParsedValue(
            value=midpoint,
            unit=unit,
            raw_snippet=range_match.group(0),
            is_range_midpoint=True,
        )

    # Match single number with optional flag and optional unit
    # Matches: "12.5 mg/dL", "12.5 H mg/dL", "140", "4.1 L"
    num_match = re.search(r"\b([0-9]+(?:\.[0-9]+)?)\b", cleaned)
    if not num_match:
        return None

    val = float(num_match.group(1))
    after_num = cleaned[num_match.end():].strip()

    # Strip flag letters (H, L, High, Low, Critical, *)
    after_num = re.sub(r"^(?:H|L|HIGH|LOW|\*)\b", "", after_num, flags=re.IGNORECASE).strip()
    after_num = re.sub(r"^\*", "", after_num).strip()

    unit = extract_unit(after_num)

    return ParsedValue(
        value=val,
        unit=unit,
        raw_snippet=f"{num_match.group(1)} {unit}".strip() if unit else num_match.group(1),
    )

def extract_unit(text: str) -> Optional[str]:
    """Extracts and normalizes unit string if present."""
    if not text:
        return None
    s = text.strip()
    # Remove trailing/leading punctuation
    s = s.strip(":;,*")
    # Take the first token or unit-like expression (e.g., mg/dL, mmol/L, x10^3/uL, /mcL, bpm, mmHg, %)
    m = re.match(r"^([a-zA-Z0-9^/%*µu\-\.\(\)]+)", s)
    if m:
        candidate = m.group(1).strip()
        # Filter out common flag words or meaningless single non-unit letters
        if candidate.lower() in {"h", "l", "high", "low", "norm", "normal", "abnormal", "critical"}:
            return None
        return candidate
    return None
