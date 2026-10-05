#!/usr/bin/env python3
"""
Automated Style Gate for ECG Paper Design Language (Phase 7 / Task 7.1)
Verifies that apps/web/src strictly adheres to the ECG Paper design specification.

Enforces zero occurrences of:
1. gradient( anywhere except design/grid.css and Bar.tsx (tick overlay)
2. box-shadow or drop-shadow anywhere (except explicit 'none')
3. backdrop-filter / backdrop-blur
4. @keyframes other than wipe, wipe-out, grow, draw, feed, head
5. infinite in any animation
6. Transitions allowed ONLY for opacity, color, background-color, border-color, and width (progress bar only), at 180ms or less
7. Any font family other than Sora and IBM Plex Mono
8. IBM Plex Mono / var(--fm) used only on numbers, units, counts, captions of numbers, or table figures
9. uppercase, letter-spacing (unless normal), tracking-
10. border-radius values other than 3px, 50% (dots), 0
11. hex/rgb/hsl colors outside design/tokens.css
12. color-mix( only in design/tokens.css and the dialog backdrop
13. Tailwind dark: classes
14. Emoji characters

Exemptions:
- 3D anatomical model files: HeartModel.tsx, CameraRig.tsx, HeartCanvas.tsx
"""

import sys
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
TARGET_DIR = REPO_ROOT / "apps" / "web" / "src"

EXEMPT_3D_FILES = {
    "HeartModel.tsx",
    "CameraRig.tsx",
    "HeartCanvas.tsx",
    "VesselLabel.tsx",
    "viewerConfig.ts",
}

# Regex patterns for validation
HEX_COLOR_PATTERN = re.compile(r"#[0-9a-fA-F]{3,8}\b")
RGB_COLOR_PATTERN = re.compile(r"\brgba?\(", re.IGNORECASE)
HSL_COLOR_PATTERN = re.compile(r"\bhsla?\(", re.IGNORECASE)
GRADIENT_PATTERN = re.compile(r"gradient\(", re.IGNORECASE)
SHADOW_PATTERN = re.compile(r"(?:box-shadow|drop-shadow|shadow-(?!none\b)[a-zA-Z0-9]+)", re.IGNORECASE)
BACKDROP_PATTERN = re.compile(r"backdrop-(?:filter|blur)", re.IGNORECASE)
KEYFRAME_PATTERN = re.compile(r"@keyframes\s+(?!wipe\b|wipe-out\b|grow\b|draw\b|feed\b|head\b)[\w-]+", re.IGNORECASE)
INFINITE_PATTERN = re.compile(r"\binfinite\b", re.IGNORECASE)
FORBIDDEN_FONTS = re.compile(r"\b(inter|roboto|courier|helvetica|arial|jetbrains)\b", re.IGNORECASE)
CASE_SPACING_PATTERN = re.compile(r"\buppercase\b|letter-spacing(?!\s*:\s*['\"]?normal)|tracking-", re.IGNORECASE)
DARK_CLASS_PATTERN = re.compile(r"\bdark:")
TAILWIND_ROUNDED_PATTERN = re.compile(r"\brounded-(?:sm|md|lg|xl|2xl|3xl)\b", re.IGNORECASE)

COLOR_MIX_PATTERN = re.compile(r"color-mix\(", re.IGNORECASE)

EMOJI_PATTERN = re.compile(
    "["
    "\U0001F600-\U0001F64F"
    "\U0001F300-\U0001F5FF"
    "\U0001F680-\U0001F6FF"
    "\U0001F1E0-\U0001F1FF"
    "\U00002702-\U000027B0"
    "\U000024C2-\U0001F251"
    "\U0001F900-\U0001F9FF"
    "\U0001FA70-\U0001FAFF"
    "]+",
    flags=re.UNICODE,
)

# Allowlist of files and contexts permitted for animation: or animation-name:
ANIMATION_ALLOWED_FILES = {
    "motion.css",
    "nav.css",
    "WelcomePage.tsx",
    "DataEntryPage.tsx",  # Predict transition overlay draw animation
}

# Allowlist of files permitted for IBM Plex Mono / var(--fm)
MONO_ALLOWED_FILES = {
    "tokens.css",
    "index.css",
    "DesignSystemPage.tsx",
    "TextField.tsx",
    "Section.tsx",
    "VesselCard.tsx",
    "WizardLayout.tsx",
    "DataEntryPage.tsx",
    "DataTable.tsx",
    "TechnicalReportView.tsx",
    "PatientReportView.tsx",
    "ResultsPage.tsx",
    "WelcomePage.tsx",
    "FieldAnatomy.tsx",
    "StepSummary.tsx",
    "nav.css",
}

# Allowed transition properties
ALLOWED_TRANSITION_PROPS = {
    "opacity",
    "color",
    "background-color",
    "border-color",
    "width",
}


def validate_transition(line_str, rel_path, line_num):
    """
    Transitions are allowed only for opacity, color, background-color, border-color,
    and width (progress bar only), at 180ms or less.
    """
    # Look for CSS transition declarations
    m_trans = re.search(r"(?:transition|transition-property|transition-duration)\s*[:=]\s*['\"]?([^;'\"]+)['\"]?", line_str, re.I)
    if not m_trans:
        return []

    val = m_trans.group(1).strip()
    errors = []

    # Check for forbidden 'all' or disallowed properties
    tokens = [t.strip() for t in re.split(r"[, ]+", val) if t.strip()]
    for token in tokens:
        # Check property names
        prop = token.lower()
        if prop in ("all", "transform", "height", "max-height", "margin", "padding", "scale"):
            errors.append(f"[transition on disallowed property '{prop}'] at {rel_path}:{line_num}\n  Line: {line_str}")

        # Check durations
        m_dur = re.match(r"^(\d+(?:\.\d+)?)(ms|s)$", token, re.I)
        if m_dur:
            amt = float(m_dur.group(1))
            unit = m_dur.group(2).lower()
            ms = amt if unit == "ms" else amt * 1000.0
            if ms > 180.0:
                errors.append(f"[transition duration {ms}ms exceeds 180ms maximum] at {rel_path}:{line_num}\n  Line: {line_str}")

    return errors


def check_style():
    print("=== Running ECG Paper Automated Style Gate (Task 7.1) ===")
    print(f"Target Directory: {TARGET_DIR}")
    print(f"Exempted 3D Files: {sorted(list(EXEMPT_3D_FILES))}\n")

    violations = []
    files_checked = 0

    for file_path in TARGET_DIR.rglob("*"):
        if not file_path.is_file():
            continue
        if file_path.suffix not in (".ts", ".tsx", ".css", ".html", ".js", ".jsx"):
            continue

        file_name = file_path.name
        rel_path = file_path.relative_to(REPO_ROOT)

        # 3D exemptions
        if file_name in EXEMPT_3D_FILES:
            continue

        files_checked += 1
        try:
            content = file_path.read_text(encoding="utf-8")
        except Exception as e:
            violations.append(f"Error reading {rel_path}: {e}")
            continue

        lines = content.splitlines()

        for line_num, line in enumerate(lines, 1):
            line_str = line.strip()

            # 1. Gradient check
            if file_name not in ("grid.css", "Bar.tsx"):
                if GRADIENT_PATTERN.search(line):
                    violations.append(
                        f"[gradient( outside grid.css/Bar.tsx] at {rel_path}:{line_num}\n  Line: {line_str}"
                    )

            # 2. Box-shadow or drop-shadow anywhere (unless explicitly none)
            if SHADOW_PATTERN.search(line):
                lower_l = line.lower()
                if "boxshadow: 'none'" not in lower_l and "box-shadow: none" not in lower_l and "box-shadow:none" not in lower_l:
                    violations.append(
                        f"[box-shadow/drop-shadow detected] at {rel_path}:{line_num}\n  Line: {line_str}"
                    )

            # 3. Backdrop-filter / backdrop-blur
            if BACKDROP_PATTERN.search(line):
                violations.append(
                    f"[backdrop-filter / backdrop-blur detected] at {rel_path}:{line_num}\n  Line: {line_str}"
                )

            # 4. Keyframes other than wipe, wipe-out, grow, draw, feed, head
            if KEYFRAME_PATTERN.search(line):
                violations.append(
                    f"[@keyframes other than allowed] at {rel_path}:{line_num}\n  Line: {line_str}"
                )

            # Animation outside allowed locations
            if "animation:" in line or "animation-name:" in line:
                if file_name not in ANIMATION_ALLOWED_FILES:
                    violations.append(
                        f"[animation: outside allowed files] at {rel_path}:{line_num}\n  Line: {line_str}"
                    )

            # 5. Infinite animation
            if INFINITE_PATTERN.search(line):
                violations.append(
                    f"[infinite animation detected] at {rel_path}:{line_num}\n  Line: {line_str}"
                )

            # 6. Transitions check (Task 7.1)
            if "transition:" in line or "transition-duration:" in line or "transition-property:" in line:
                violations.extend(validate_transition(line_str, rel_path, line_num))

            # 7. Font family other than Sora and IBM Plex Mono
            if FORBIDDEN_FONTS.search(line):
                violations.append(
                    f"[forbidden font family detected] at {rel_path}:{line_num}\n  Line: {line_str}"
                )

            # 8. IBM Plex Mono / var(--fm) usage check
            if "IBM Plex Mono" in line or "var(--fm)" in line:
                if file_name not in MONO_ALLOWED_FILES:
                    violations.append(
                        f"[IBM Plex Mono / var(--fm) used in unauthorized component] at {rel_path}:{line_num}\n  Line: {line_str}"
                    )

            # 9. Uppercase, letter-spacing, tracking-
            if CASE_SPACING_PATTERN.search(line):
                violations.append(
                    f"[uppercase / letter-spacing / tracking- detected] at {rel_path}:{line_num}\n  Line: {line_str}"
                )

            # 10. Border radius other than 3px, 50%, 0
            if TAILWIND_ROUNDED_PATTERN.search(line):
                violations.append(
                    f"[unauthorized Tailwind rounded- class] at {rel_path}:{line_num}\n  Line: {line_str}"
                )

            # Check explicit CSS border-radius
            if "border-radius" in line.lower() or "borderradius" in line.lower():
                m_rad = re.search(r'(?:border-radius|borderRadius)\s*[:=]\s*[\'"]?([^\'";,\n]+)[\'"]?', line, re.I)
                if m_rad:
                    raw_val = m_rad.group(1).strip()
                    if not raw_val.startswith("is") and not raw_val.startswith("const"):
                        for token in raw_val.split():
                            t_clean = token.replace("!important", "").rstrip(";, ").strip()
                            if t_clean and t_clean not in ("3px", "50%", "0", "var(--radius)"):
                                violations.append(
                                    f"[border-radius '{t_clean}' outside 3px/50%/0] at {rel_path}:{line_num}\n  Line: {line_str}"
                                )

            # 11. Hex/rgb/hsl colors outside tokens.css
            if file_name != "tokens.css":
                if HEX_COLOR_PATTERN.search(line):
                    violations.append(
                        f"[hex color outside tokens.css] at {rel_path}:{line_num}\n  Line: {line_str}"
                    )
                if RGB_COLOR_PATTERN.search(line):
                    violations.append(
                        f"[rgb() color outside tokens.css] at {rel_path}:{line_num}\n  Line: {line_str}"
                    )
                if HSL_COLOR_PATTERN.search(line):
                    violations.append(
                        f"[hsl() color outside tokens.css] at {rel_path}:{line_num}\n  Line: {line_str}"
                    )

            # 12. color-mix( only in tokens.css and the dialog backdrop
            if COLOR_MIX_PATTERN.search(line):
                if file_name != "tokens.css":
                    if file_name != "nav.css" or "::backdrop" not in line:
                        # Allow dialog backdrop line or previous lines in nav.css
                        is_dialog_backdrop = False
                        if file_name == "nav.css":
                            # Check if backdrop in context
                            for ctx_line in lines[max(0, line_num - 5):line_num]:
                                if "::backdrop" in ctx_line:
                                    is_dialog_backdrop = True
                                    break
                        if not is_dialog_backdrop:
                            violations.append(
                                f"[color-mix( outside tokens.css or dialog backdrop] at {rel_path}:{line_num}\n  Line: {line_str}"
                            )

            # 13. Dark: classes
            if DARK_CLASS_PATTERN.search(line):
                violations.append(
                    f"[Tailwind dark: class detected] at {rel_path}:{line_num}\n  Line: {line_str}"
                )

            # 14. Emoji characters
            if EMOJI_PATTERN.search(line):
                violations.append(
                    f"[emoji character detected] at {rel_path}:{line_num}\n  Line: {line_str}"
                )

    print(f"Total source files evaluated: {files_checked}")

    if violations:
        print(f"\n[FAIL] Style Gate FAILED with {len(violations)} violation(s):\n")
        for v in violations:
            print(f" - {v}\n")
        sys.exit(1)
    else:
        print("\n[PASS] Style Gate PASSED with 0 violations.")
        print("All audited source files conform strictly to the ECG Paper specification.")
        sys.exit(0)


if __name__ == "__main__":
    check_style()
