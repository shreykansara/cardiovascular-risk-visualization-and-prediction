"""
LaTeX compilation helper for synthetic clinical reports.
Locates pdflatex on Windows/Linux, compiles .tex files to PDF,
validates logs for Overfull \\hbox, and cleans intermediate files.
"""

import os
from pathlib import Path
import re
import shutil
import subprocess
from typing import List, Optional, Tuple

DEFAULT_MIKTEX_PATH = Path(r"C:\Users\Shrey\AppData\Local\Programs\MiKTeX\miktex\bin\x64\pdflatex.exe")

def find_pdflatex() -> Path:
    """Finds the pdflatex executable path."""
    env_path = os.environ.get("PDFLATEX_PATH")
    if env_path and Path(env_path).exists():
        return Path(env_path)

    which_path = shutil.which("pdflatex")
    if which_path:
        return Path(which_path)

    if DEFAULT_MIKTEX_PATH.exists():
        return DEFAULT_MIKTEX_PATH

    raise FileNotFoundError("Could not find pdflatex. Please ensure MiKTeX or TeXLive is installed.")

def compile_tex(
    tex_path: Path,
    output_dir: Optional[Path] = None,
    clean_intermediates: bool = True,
) -> Tuple[Path, List[str]]:
    """
    Compiles a .tex file to PDF using pdflatex.
    Returns (pdf_path, overfull_warnings).
    """
    tex_path = tex_path.resolve()
    if not tex_path.exists():
        raise FileNotFoundError(f"TeX file does not exist: {tex_path}")

    out_dir = (output_dir or tex_path.parent).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    pdflatex_bin = find_pdflatex()

    # Ensure parent directory of pdflatex is in PATH for any DLL dependencies
    env = os.environ.copy()
    bin_dir = str(pdflatex_bin.parent)
    if bin_dir not in env.get("PATH", ""):
        env["PATH"] = f"{bin_dir};{env.get('PATH', '')}"

    cmd = [
        str(pdflatex_bin),
        "-interaction=nonstopmode",
        f"-output-directory={out_dir}",
        str(tex_path),
    ]

    res = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        cwd=str(tex_path.parent),
        env=env,
    )

    stem = tex_path.stem
    pdf_path = out_dir / f"{stem}.pdf"
    log_path = out_dir / f"{stem}.log"

    overfull_warnings: List[str] = []
    if log_path.exists():
        log_text = log_path.read_text(encoding="latin-1", errors="replace")
        for match in re.finditer(r"Overfull \\hbox \(([0-9.]+pt) too wide\)[^\n]*\n([^\n]*)", log_text):
            overfull_warnings.append(f"{match.group(1)} too wide: {match.group(2).strip()}")

    if res.returncode != 0 or not pdf_path.exists():
        log_snippet = ""
        if log_path.exists():
            lines = log_path.read_text(encoding="latin-1", errors="replace").splitlines()
            log_snippet = "\n".join(lines[-40:])
        raise RuntimeError(
            f"pdflatex failed with exit code {res.returncode}.\n"
            f"Tail of log ({log_path}):\n{log_snippet}\n"
            f"stdout tail:\n{res.stdout[-500:]}"
        )

    if clean_intermediates:
        for ext in [".aux", ".log", ".out", ".fls", ".fdb_latexmk"]:
            inter = out_dir / f"{stem}{ext}"
            if inter.exists():
                try:
                    inter.unlink()
                except OSError:
                    pass

    return pdf_path, overfull_warnings
