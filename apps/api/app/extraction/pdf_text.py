"""
Document and Text Representation for Deterministic PDF Extraction.
Groups pdfplumber words into rows and cells without relying on explicit table borders.
"""

from __future__ import annotations
from dataclasses import dataclass, field
import io
import re
from typing import List, Optional
import pdfplumber

@dataclass
class Row:
    """A horizontal row of cells in a document page."""
    page_number: int
    cells: List[str]
    text: str
    y: float = 0.0

    def get_cell(self, index: int) -> Optional[str]:
        if 0 <= index < len(self.cells):
            return self.cells[index]
        return None

@dataclass
class Page:
    """A document page containing extracted rows."""
    page_number: int
    rows: List[Row] = field(default_factory=list)

    @property
    def text(self) -> str:
        return "\n".join(r.text for r in self.rows)

@dataclass
class Document:
    """Document representation containing pages, rows, and cells."""
    pages: List[Page] = field(default_factory=list)

    @property
    def total_non_whitespace_chars(self) -> int:
        count = 0
        for p in self.pages:
            for r in p.rows:
                count += len(re.sub(r"\s+", "", r.text))
        return count

    @classmethod
    def from_text(cls, text: str) -> Document:
        """
        Builds a Document from plain text (used for testing and text fixtures).
        Splits pages on form-feed '\\f' if present, otherwise single page.
        Splits cells on 2 or more spaces.
        """
        page_chunks = text.split("\f") if "\f" in text else [text]
        pages: List[Page] = []

        for p_idx, chunk in enumerate(page_chunks, start=1):
            lines = chunk.splitlines()
            rows: List[Row] = []
            for y_idx, line in enumerate(lines):
                stripped = line.strip()
                if not stripped:
                    continue
                # Split cells wherever 2 or more spaces appear
                raw_cells = re.split(r"\s{2,}", stripped)
                cells = [c.strip() for c in raw_cells if c.strip()]
                rows.append(Row(
                    page_number=p_idx,
                    cells=cells,
                    text=stripped,
                    y=float(y_idx * 12),
                ))
            pages.append(Page(page_number=p_idx, rows=rows))

        return cls(pages=pages)

    @classmethod
    def from_pdf_bytes(cls, pdf_bytes: bytes) -> Document:
        """
        Builds a Document from in-memory PDF bytes using pdfplumber word extraction.
        Groups words into rows by vertical position (tolerance 3 pt) and splits
        cells where horizontal gap > 1.5 * average character width of that row.
        """
        pages: List[Page] = []

        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for p_idx, pdf_page in enumerate(pdf.pages, start=1):
                words = pdf_page.extract_words(
                    x_tolerance=3,
                    y_tolerance=3,
                    keep_blank_chars=False,
                    use_text_flow=False,
                )
                if not words:
                    pages.append(Page(page_number=p_idx, rows=[]))
                    continue

                # Sort words primarily by vertical top position, secondarily by x0
                words = sorted(words, key=lambda w: (w["top"], w["x0"]))

                # Group words into rows with 3pt vertical tolerance
                word_groups: List[List[dict]] = []
                for w in words:
                    placed = False
                    for group in word_groups:
                        # Compare to average top of the group
                        group_avg_top = sum(item["top"] for item in group) / len(group)
                        if abs(w["top"] - group_avg_top) <= 3.0:
                            group.append(w)
                            placed = True
                            break
                    if not placed:
                        word_groups.append([w])

                # Sort groups vertically by their minimum top
                word_groups.sort(key=lambda g: min(item["top"] for item in g))

                rows: List[Row] = []
                for group in word_groups:
                    # Sort words within the row horizontally
                    sorted_row_words = sorted(group, key=lambda w: w["x0"])
                    row_text = " ".join(w["text"] for w in sorted_row_words).strip()
                    if not row_text:
                        continue

                    # Calculate average character width in this row
                    total_chars = sum(len(w["text"]) for w in sorted_row_words)
                    total_width = sum(w["x1"] - w["x0"] for w in sorted_row_words)
                    avg_char_width = (total_width / total_chars) if total_chars > 0 else 5.0
                    gap_threshold = 1.5 * avg_char_width

                    # Split row into cells based on gap threshold
                    cells: List[str] = []
                    current_cell_words: List[str] = [sorted_row_words[0]["text"]]

                    for i in range(1, len(sorted_row_words)):
                        prev_w = sorted_row_words[i - 1]
                        curr_w = sorted_row_words[i]
                        gap = curr_w["x0"] - prev_w["x1"]

                        if gap > gap_threshold:
                            cells.append(" ".join(current_cell_words).strip())
                            current_cell_words = [curr_w["text"]]
                        else:
                            current_cell_words.append(curr_w["text"])

                    if current_cell_words:
                        cells.append(" ".join(current_cell_words).strip())

                    # Filter empty cells
                    clean_cells = [c for c in cells if c]
                    avg_y = sum(w["top"] for w in sorted_row_words) / len(sorted_row_words)

                    rows.append(Row(
                        page_number=p_idx,
                        cells=clean_cells,
                        text=row_text,
                        y=avg_y,
                    ))

                pages.append(Page(page_number=p_idx, rows=rows))

        return cls(pages=pages)
