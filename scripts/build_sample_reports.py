"""
Batch generation script for synthetic clinical test reports.
Produces LaTeX sources and compiled text-layer PDFs for all 4 presets,
variant reports (SI units, partial, impression-only, narrative-only),
and intake edge cases.
"""

import argparse
from datetime import date, datetime
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from typing import List, Optional

from scripts.sample_reports.compiler import compile_tex
from scripts.sample_reports.data import generate_patient_header, load_presets
from scripts.sample_reports.ecg import generate_ecg_tex
from scripts.sample_reports.echo import generate_echo_tex
from scripts.sample_reports.edge_cases import (
    generate_encrypted_pdf,
    generate_not_a_pdf,
    generate_scanned_pdf,
)
from scripts.sample_reports.ehr import generate_ehr_tex
from scripts.sample_reports.lab import generate_lab_tex

ROOT_DIR = Path(__file__).resolve().parent.parent
DEFAULT_OUT_DIR = ROOT_DIR / "docs" / "sample-reports"

def build_preset_reports(
    preset_id: str,
    preset,
    index: int,
    report_date: date,
    out_root: Path,
    clean_intermediates: bool = True,
) -> None:
    preset_dir = out_root / "presets" / preset_id
    preset_dir.mkdir(parents=True, exist_ok=True)
    header = generate_patient_header(preset, index, report_date)

    tasks = [
        ("ecg_report", generate_ecg_tex(preset, header)),
        ("echo_report", generate_echo_tex(preset, header)),
        ("blood_lab_report", generate_lab_tex(preset, header)),
        ("outpatient_note", generate_ehr_tex(preset, header)),
    ]

    for filename_stem, tex_content in tasks:
        tex_path = preset_dir / f"{filename_stem}.tex"
        tex_path.write_text(tex_content, encoding="utf-8")
        print(f"  Compiling {preset_id}/{filename_stem}.pdf ...")
        pdf_path, overfull_warnings = compile_tex(tex_path, output_dir=preset_dir, clean_intermediates=clean_intermediates)
        if overfull_warnings:
            for w in overfull_warnings:
                print(f"    [WARN Overfull hbox] {w}")

def build_variant_reports(
    preset_id: str,
    preset,
    index: int,
    report_date: date,
    out_root: Path,
    clean_intermediates: bool = True,
) -> None:
    variant_dir = out_root / "variants" / preset_id
    variant_dir.mkdir(parents=True, exist_ok=True)
    header = generate_patient_header(preset, index, report_date)

    tasks = [
        ("lab_si_units", generate_lab_tex(preset, header, use_si_units=True)),
        ("lab_partial", generate_lab_tex(preset, header, omit_partial=True)),
        ("ecg_impression_only", generate_ecg_tex(preset, header, impression_only=True)),
        ("ehr_narrative", generate_ehr_tex(preset, header, narrative_only=True)),
    ]

    for filename_stem, tex_content in tasks:
        tex_path = variant_dir / f"{filename_stem}.tex"
        tex_path.write_text(tex_content, encoding="utf-8")
        print(f"  Compiling variant {preset_id}/{filename_stem}.pdf ...")
        pdf_path, overfull_warnings = compile_tex(tex_path, output_dir=variant_dir, clean_intermediates=clean_intermediates)
        if overfull_warnings:
            for w in overfull_warnings:
                print(f"    [WARN Overfull hbox] {w}")

def build_edge_cases(out_root: Path) -> None:
    edge_dir = out_root / "edge-cases"
    edge_dir.mkdir(parents=True, exist_ok=True)

    print("  Generating scanned_no_text.pdf ...")
    generate_scanned_pdf(edge_dir / "scanned_no_text.pdf")

    print("  Generating encrypted.pdf ...")
    generate_encrypted_pdf(edge_dir / "encrypted.pdf")

    print("  Generating not_a_pdf.pdf ...")
    generate_not_a_pdf(edge_dir / "not_a_pdf.pdf")

def main():
    parser = argparse.ArgumentParser(description="Generate synthetic clinical PDF reports for presets.")
    parser.add_argument("--preset", type=str, default=None, help="Specific preset ID to generate (default: all)")
    parser.add_argument("--date", type=str, default="2026-03-15", help="Report date YYYY-MM-DD (default: 2026-03-15)")
    parser.add_argument("--no-variants", action="store_true", help="Skip variant PDF generation")
    parser.add_argument("--no-edge-cases", action="store_true", help="Skip edge cases generation")
    parser.add_argument("--keep-intermediates", action="store_true", help="Keep .aux/.log files")
    parser.add_argument("--out-dir", type=str, default=str(DEFAULT_OUT_DIR), help="Output base directory")

    args = parser.parse_args()
    report_date = datetime.strptime(args.date, "%Y-%m-%d").date()
    out_root = Path(args.out_dir).resolve()
    clean = not args.keep_intermediates

    presets = load_presets()
    target_presets = [args.preset] if args.preset else list(presets.keys())

    print(f"Generating reports for presets: {target_presets}")
    for idx, pid in enumerate(target_presets, start=1):
        if pid not in presets:
            print(f"Error: preset '{pid}' not found in presets!", file=sys.stderr)
            sys.exit(1)
        p = presets[pid]
        print(f"\n[{idx}/{len(target_presets)}] Generating preset reports for {pid} ({p.name}) ...")
        build_preset_reports(pid, p, idx, report_date, out_root, clean_intermediates=clean)

        if not args.no_variants:
            print(f"  Generating variant reports for {pid} ...")
            build_variant_reports(pid, p, idx, report_date, out_root, clean_intermediates=clean)

    if not args.no_edge_cases:
        print("\nGenerating edge cases ...")
        build_edge_cases(out_root)

    print("\nReport generation completed successfully!")

if __name__ == "__main__":
    main()
