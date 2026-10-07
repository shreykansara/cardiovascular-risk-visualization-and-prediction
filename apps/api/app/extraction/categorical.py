"""
Categorical parsing primitives matching schema allowed values.
Includes boolean resolution for '0'/'1' and 'N'/'Y', sex, NYHA function class,
VHD severity grading, BBB taxonomy, and backward-window negation detection.
"""

import re
from typing import Optional, Tuple
from .normalize import normalize_text
from .report_types import get_field_spec

YES_TOKENS = {"yes", "present", "positive", "true", "y", "+"}
NO_TOKENS = {"no", "absent", "negative", "false", "n", "-", "nil", "normal", "wnl", "none"}

NEGATION_PATTERNS = [
    r"\bno\b",
    r"\bwithout\b",
    r"\babsence\s+of\b",
    r"\bnot\s+seen\b",
    r"\bnot\s+present\b",
    r"\bnil\b",
    r"\bnegative\s+for\b",
]

def check_negation_in_prefix(prefix_text: str) -> bool:
    """
    Checks if a negation word appears within 3 words before the finding.
    """
    words = re.findall(r"\b\w+(?:-\w+)?\b", prefix_text.lower())
    if not words:
        return False
    # Check the last 3 words
    last_three = " ".join(words[-3:])
    for neg_pat in NEGATION_PATTERNS:
        if re.search(neg_pat, last_three):
            return True
    return False

def parse_yes_no_value(key: str, text: str) -> Optional[str]:
    """
    Parses a finding into the schema's boolean format ('0'/'1' or 'N'/'Y').
    """
    cleaned = normalize_text(text).lower().strip()
    spec = get_field_spec(key)
    allowed = spec.get("allowed_values") or ["0", "1"]

    is_yes = cleaned in YES_TOKENS
    is_no = cleaned in NO_TOKENS

    if not is_yes and not is_no:
        # Check if first word is yes/no
        first_word = re.split(r"\s+", cleaned)[0]
        if first_word in YES_TOKENS:
            is_yes = True
        elif first_word in NO_TOKENS:
            is_no = True

    if is_yes:
        if "1" in allowed:
            return "1"
        if "Y" in allowed:
            return "Y"
        return allowed[-1]

    if is_no:
        if "0" in allowed:
            return "0"
        if "N" in allowed:
            return "N"
        return allowed[0]

    return None

def parse_sex_value(text: str) -> Optional[str]:
    """Parses biological sex into 'Male' or 'Female'."""
    s = normalize_text(text).lower().strip()
    if s in {"male", "m", "man", "boy"}:
        return "Male"
    if s in {"female", "f", "woman", "girl"}:
        return "Female"
    # Check word boundary match
    if re.search(r"\b(?:female|f)\b", s):
        return "Female"
    if re.search(r"\b(?:male|m)\b", s):
        return "Male"
    return None

def parse_vhd_value(text: str) -> Optional[str]:
    """
    Maps valvular heart disease severity to schema values:
    'N' (None), 'mild', 'Moderate', 'Severe'.
    """
    s = normalize_text(text).lower().strip()
    if any(k in s for k in ["severe", "sev"]):
        return "Severe"
    if any(k in s for k in ["moderate", "mod"]):
        return "Moderate"
    if any(k in s for k in ["mild", "trivial", "trace"]):
        return "mild"
    if any(k in s for k in ["normal", "none", "nil", "absent", "no"]):
        return "N"
    return None

def parse_function_class(text: str) -> Optional[str]:
    """
    Maps NYHA functional class to schema numeric values '0', '1', '2', '3'.
    """
    s = normalize_text(text).lower().strip()
    if "iv" in s or "4" in s or "class 4" in s:
        return "3"  # Clamped to schema max Class III
    if "iii" in s or "3" in s or "class 3" in s:
        return "3"
    if "ii" in s or "2" in s or "class 2" in s:
        return "2"
    if "i" in s or "1" in s or "class 1" in s:
        return "1"
    if "0" in s or "none" in s or "asymptomatic" in s:
        return "0"
    return None

def parse_bbb_value(text: str) -> Optional[str]:
    """
    Maps bundle branch block to schema values:
    'N', 'LBBB', 'RBBB'.
    """
    s = normalize_text(text).lower().strip()
    if any(k in s for k in ["no bundle branch", "none", "nil", "absent", "normal", "no bbb", "no block", "without bbb"]) or s in {"n", "no"}:
        return "N"
    if "lbbb" in s or "left bundle branch" in s or "left bundle" in s:
        return "LBBB"
    if "rbbb" in s or "right bundle branch" in s or "right bundle" in s:
        return "RBBB"
    return None
