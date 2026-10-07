"""
Field label matcher for clinical document rows.
Enforces case-insensitivity, whole-word matching, longest-synonym priority,
abbreviation safeguards, exclusion words (LDL/HDL), and patient identifier header skipping.
"""

from dataclasses import dataclass
import json
from pathlib import Path
import re
from typing import List, Optional, Set, Tuple

from .normalize import normalize_text
from .pdf_text import Row

SYNONYMS_PATH = Path(__file__).resolve().parent / "field_synonyms.json"

SHORT_ABBREVIATIONS: Set[str] = {
    "na", "k", "cr", "hb", "tg", "pr", "bp", "dm", "ef", "tlc", "plt", "esr"
}

HEADER_IDENTIFIER_KEYWORDS: Set[str] = {
    "name", "patient id", "dob", "mrn", "uhid"
}

def _load_synonyms() -> dict:
    with open(SYNONYMS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    # Sort synonyms for each key by length descending (longest first)
    return {
        key: sorted(syns, key=lambda s: len(s), reverse=True)
        for key, syns in data.items()
    }

FIELD_SYNONYMS = _load_synonyms()

@dataclass
class MatchResult:
    key: str
    synonym_matched: str
    cell_index: int
    row: Row
    label_text: str

def is_header_identifier_row(row: Row, row_index: int) -> bool:
    """
    Checks if a row is inside the patient identifier header block:
    First 8 rows of page 1, only when containing patient identifier keywords.
    """
    if row.page_number == 1 and row_index < 8:
        row_lower = row.text.lower()
        for kw in HEADER_IDENTIFIER_KEYWORDS:
            if re.search(r"\b" + re.escape(kw) + r"\b", row_lower):
                return True
    return False

def matches_synonym(synonym: str, cell_text: str, cell_index: int, row_text: str) -> bool:
    """
    Checks whether a specific synonym matches within cell_text:
    - Case-insensitive
    - Whole words only
    - Short abbreviations match only if cell_index == 0 or followed by ':' or '='
    """
    syn_lower = synonym.lower().strip()
    cell_lower = normalize_text(cell_text).lower()

    # Short abbreviation restriction
    if syn_lower in SHORT_ABBREVIATIONS:
        # Check if cell_index is 0 or followed by : or =
        if cell_index != 0:
            # Check if immediately followed by : or = in cell or row
            pattern = r"\b" + re.escape(syn_lower) + r"\s*[:=]"
            if not re.search(pattern, cell_lower):
                return False

    # Regex for whole-word match
    # If synonym ends with special char like '+', avoid trailing \b
    prefix = r"\b" if syn_lower[0].isalnum() else ""
    suffix = r"\b" if syn_lower[-1].isalnum() else ""
    pattern = prefix + re.escape(syn_lower) + suffix

    return bool(re.search(pattern, cell_lower))

def has_ldl_hdl_exclusions(cell_text: str) -> bool:
    """Checks if cell contains exclusion terms for LDL/HDL."""
    lower = cell_text.lower()
    exclusions = ["non-hdl", "non hdl", "vldl", "ratio", "/"]
    for exc in exclusions:
        if exc in lower:
            return True
    return False

def match_field_in_row(row: Row, row_index: int, target_keys: List[str]) -> Optional[MatchResult]:
    """
    Searches row cells for a match among target_keys.
    Returns the first MatchResult found or None.
    """
    if is_header_identifier_row(row, row_index):
        return None

    for cell_idx, cell in enumerate(row.cells):
        clean_cell = normalize_text(cell)
        if not clean_cell:
            continue

        best_match: Optional[MatchResult] = None
        best_syn_len = -1

        for key in target_keys:
            # LDL/HDL exclusion check on label cell
            if key in {"LDL", "HDL"} and has_ldl_hdl_exclusions(clean_cell):
                continue

            synonyms = FIELD_SYNONYMS.get(key, [])
            for syn in synonyms:
                if matches_synonym(syn, clean_cell, cell_idx, row.text):
                    if len(syn) > best_syn_len:
                        best_match = MatchResult(
                            key=key,
                            synonym_matched=syn,
                            cell_index=cell_idx,
                            row=row,
                            label_text=clean_cell,
                        )
                        best_syn_len = len(syn)
                    break

        if best_match:
            return best_match

    return None
