"""
Text normalization primitives for deterministic clinical extraction.
Handles unicode unification, whitespace collapsing, and decimal comma / thousands separator resolution.
"""

import re
import unicodedata

# Superscript mapping
SUPERSCRIPT_MAP = {
    "⁰": "0",
    "¹": "1",
    "²": "2",
    "³": "3",
    "⁴": "4",
    "⁵": "5",
    "⁶": "6",
    "⁷": "7",
    "⁸": "8",
    "⁹": "9",
    "⁺": "+",
    "⁻": "-",
}

def normalize_text(text: str) -> str:
    """
    Normalizes a text string:
    - Normalizes unicode characters
    - Unifies mu sign to 'u'
    - Unifies multiplication signs to 'x'
    - Unifies en/em dash and minus to '-'
    - Replaces non-breaking spaces with standard space
    - Converts superscript digits to standard digits
    - Resolves decimal commas vs thousands separators
    - Collapses multiple whitespace
    """
    if not text:
        return ""

    # Replace specific unicode characters
    s = text

    # Superscripts
    for sup_char, norm_char in SUPERSCRIPT_MAP.items():
        s = s.replace(sup_char, norm_char)

    # Mu signs
    s = s.replace("µ", "u").replace("μ", "u")

    # Multiplication signs
    s = s.replace("×", "x").replace("✕", "x").replace("✖", "x").replace("⋅", "*")

    # Dashes and minus signs
    s = s.replace("–", "-").replace("—", "-").replace("−", "-").replace("‐", "-")

    # Non-breaking and special spaces
    s = re.sub(r"[\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]", " ", s)

    # Thousands separator: a comma followed by exactly 3 digits not followed by another digit
    # e.g., "7,500" -> "7500", "1,250,000" -> "1250000"
    s = re.sub(r"(?<=\d),(?=\d{3}(?!\d))", "", s)

    # Decimal comma: remaining commas between digits e.g. "1,05" -> "1.05", "4,2" -> "4.2"
    s = re.sub(r"(?<=\d),(?=\d)", ".", s)

    # Collapse multiple whitespace
    s = re.sub(r"[ \t]+", " ", s)

    return s.strip()
