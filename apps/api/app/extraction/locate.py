"""
Value location primitives within document rows and tables.
Supports header-guided column resolution, adjacent cell fallback, and inline punctuation patterns.
"""

from dataclasses import dataclass
import re
from typing import List, Optional, Tuple

from .matcher import MatchResult
from .normalize import normalize_text
from .pdf_text import Row
from .values import ParsedValue, parse_numeric_value_and_unit

RESULT_HEADER_KEYWORDS = {"result", "value", "observed", "patient value", "finding", "status", "parameter value"}
UNIT_HEADER_KEYWORDS = {"unit", "units"}
IGNORE_HEADER_KEYWORDS = {"reference", "normal", "range", "flag", "flags", "method", "ref range", "ref."}

@dataclass
class LocatedValue:
    raw_value: str
    unit: Optional[str]
    evidence: str
    parsed: Optional[ParsedValue] = None

def find_header_columns(page_rows: List[Row], match_row_idx: int) -> Tuple[Optional[int], Optional[int]]:
    """
    Scans upwards from match_row_idx to find the nearest table header row.
    Returns (result_col_idx, unit_col_idx).
    """
    for r_idx in range(match_row_idx - 1, max(-1, match_row_idx - 15), -1):
        row = page_rows[r_idx]
        result_col: Optional[int] = None
        unit_col: Optional[int] = None

        for c_idx, cell in enumerate(row.cells):
            clean = cell.lower().strip()
            if any(re.search(r"\b" + re.escape(kw) + r"\b", clean) for kw in RESULT_HEADER_KEYWORDS):
                result_col = c_idx
            elif any(re.search(r"\b" + re.escape(kw) + r"\b", clean) for kw in UNIT_HEADER_KEYWORDS):
                unit_col = c_idx

        if result_col is not None:
            return result_col, unit_col

    return None, None

def locate_value_for_match(
    match: MatchResult,
    page_rows: List[Row],
    row_index: int,
) -> Optional[LocatedValue]:
    """
    Locates the value and unit for a matched label using:
    (a) Table column matching via nearest header row, or first value cell after label
    (b) Inline patterns: 'Label: value unit', 'Label = value unit', 'Label ..... value unit'
    """
    row = match.row
    label_cell_idx = match.cell_index

    # Strategy (b): Inline pattern inside the label cell or row text
    # e.g., "FBS: 110 mg/dL" or "FBS = 110 mg/dL" or "FBS ..... 110 mg/dL"
    pattern = (
        r"\b" + re.escape(match.synonym_matched) +
        r"\s*(?:[:=]|\.{2,})\s*([^\n\r]+)"
    )
    m = re.search(pattern, row.text, re.IGNORECASE)
    if m:
        after_label = m.group(1).strip()
        parsed = parse_numeric_value_and_unit(after_label)
        if parsed and (parsed.value is not None or parsed.is_censored):
            val_str = parsed.censored_snippet if parsed.is_censored else str(parsed.value)
            evidence = f"{match.label_text}: {val_str} {parsed.unit or ''}".strip()[:80]
            return LocatedValue(
                raw_value=val_str,
                unit=parsed.unit,
                evidence=evidence,
                parsed=parsed,
            )

    # Strategy (a): Table cells
    result_col_idx, unit_col_idx = find_header_columns(page_rows, row_index)

    # If header identified a result column and it's within row cells
    if result_col_idx is not None and result_col_idx < len(row.cells) and result_col_idx != label_cell_idx:
        candidate_cell = row.cells[result_col_idx]
        unit_str: Optional[str] = None
        if unit_col_idx is not None and unit_col_idx < len(row.cells):
            unit_str = row.cells[unit_col_idx].strip() or None

        parsed = parse_numeric_value_and_unit(candidate_cell)
        if parsed and (parsed.value is not None or parsed.is_censored):
            effective_unit = unit_str or parsed.unit
            parsed.unit = effective_unit
            val_str = parsed.censored_snippet if parsed.is_censored else str(parsed.value)
            evidence = f"{match.label_text} {val_str} {effective_unit or ''}".strip()[:80]
            return LocatedValue(
                raw_value=val_str,
                unit=effective_unit,
                evidence=evidence,
                parsed=parsed,
            )
        # Even if not purely numeric, return the cell text for categorical evaluation
        if candidate_cell.strip():
            evidence = f"{match.label_text}: {candidate_cell.strip()}"[:80]
            return LocatedValue(
                raw_value=candidate_cell.strip(),
                unit=unit_str,
                evidence=evidence,
                parsed=None,
            )

    # Fallback in table: look at subsequent cells after label cell
    for next_idx in range(label_cell_idx + 1, len(row.cells)):
        candidate_cell = row.cells[next_idx].strip()
        if not candidate_cell:
            continue

        # Check if next cell has unit
        candidate_unit: Optional[str] = None
        if next_idx + 1 < len(row.cells):
            next_next = row.cells[next_idx + 1].strip()
            # If next_next looks like a unit, e.g. mg/dL, %
            if re.match(r"^[a-zA-Z0-9^/%*µu\-\.\(\)]+$", next_next) and len(next_next) <= 10:
                candidate_unit = next_next

        parsed = parse_numeric_value_and_unit(candidate_cell)
        if parsed and (parsed.value is not None or parsed.is_censored):
            effective_unit = candidate_unit or parsed.unit
            parsed.unit = effective_unit
            val_str = parsed.censored_snippet if parsed.is_censored else str(parsed.value)
            evidence = f"{match.label_text}: {val_str} {effective_unit or ''}".strip()[:80]
            return LocatedValue(
                raw_value=val_str,
                unit=effective_unit,
                evidence=evidence,
                parsed=parsed,
            )

        # Non-numeric candidate for categoricals (e.g., "Normal", "Present", "Absent", "Mild")
        evidence = f"{match.label_text}: {candidate_cell}"[:80]
        return LocatedValue(
            raw_value=candidate_cell,
            unit=candidate_unit,
            evidence=evidence,
            parsed=None,
        )

    return None
