"""
Task 2.3: Unit Survival Test
Tests how various LaTeX unit formulations survive extraction by pdfminer / pdfplumber.
"""

from pathlib import Path
import tempfile
from apps.api.app.extraction.pdf_text import Document
from scripts.sample_reports.compiler import compile_tex

TEST_TEX_CONTENT = r"""\documentclass[10pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage{textcomp}

\begin{document}

\section*{Unit Survival Test}

Candidate 1: mg/dL\par
Candidate 2: mmol/L\par
Candidate 3: mEq/L\par
Candidate 4: cells/uL\par
Candidate 5: cells/\textmu L\par
Candidate 6: 10\textasciicircum 3/uL\par
Candidate 7: $10^3$/uL\par
Candidate 8: 10*3/uL\par
Candidate 9: umol/L\par
Candidate 10: \textmu mol/L\par
Candidate 11: $\mu$mol/L\par
Candidate 12: g/dL\par
Candidate 13: mm/hr\par
Candidate 14: kg/m2\par
Candidate 15: kg/m$^2$\par
Candidate 16: kg/m\textsuperscript{2}\par

\end{document}
"""

def run_test():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        tex_path = tmp_path / "test_units.tex"
        tex_path.write_text(TEST_TEX_CONTENT, encoding="utf-8")

        pdf_path, _ = compile_tex(tex_path, output_dir=tmp_path, clean_intermediates=False)
        doc = Document.from_pdf_bytes(pdf_path.read_bytes())

        print("=== Extracted Text ===")
        for p_idx, page in enumerate(doc.pages):
            print(f"--- Page {p_idx+1} ---")
            for r_idx, r in enumerate(page.rows):
                print(f"Row {r_idx}: '{r.text}'")

if __name__ == "__main__":
    run_test()
