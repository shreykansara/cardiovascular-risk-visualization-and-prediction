#!/usr/bin/env python3
"""
Automated Style Gate (Task 5.2)
Verifies that apps/web/src strictly adheres to the Clinical Paper design language.
Enforces zero occurrences of:
1. gradient(
2. box-shadow (other than --shadow-overlay token)
3. backdrop-filter / backdrop-blur
4. @keyframes (other than the spinner)
5. animation: (other than the spinner)
6. font-mono / monospace / JetBrains
7. uppercase
8. letter-spacing / tracking-
9. Hex color outside tokens.css
10. dark: classes or prefers-color-scheme: dark
11. Any emoji

Exemptions:
- apps/web/src/components/3d/HeartModel.tsx (3D anatomical mesh rendering)
- apps/web/src/components/3d/CameraRig.tsx (3D camera animation math)
"""

import sys
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
TARGET_DIR = REPO_ROOT / "apps" / "web" / "src"

EXEMPT_FILES = {
    "HeartModel.tsx",
    "CameraRig.tsx",
}

# Regex patterns for forbidden tokens
FORBIDDEN_RULES = [
    ("gradient(", re.compile(r"gradient\(", re.IGNORECASE)),
    ("box-shadow (unauthorized)", re.compile(r"(?:box-shadow(?!.*--shadow-overlay)|(?<!--)shadow-(?!overlay)[a-zA-Z0-9]+)")),
    ("backdrop-filter / backdrop-blur", re.compile(r"backdrop-(?:filter|blur)", re.IGNORECASE)),
    ("@keyframes (non-spinner)", re.compile(r"@keyframes\s+(?!spin\b)[\w-]+")),
    ("animation (non-spinner)", re.compile(r"(?:animation:\s*(?!spin\b|none\b)[\w-]+|animate-(?!spin\b)[\w-]+)")),
    ("monospace / JetBrains / font-mono", re.compile(r"(?:font-mono|monospace|JetBrains)", re.IGNORECASE)),
    ("uppercase", re.compile(r"\buppercase\b", re.IGNORECASE)),
    ("letter-spacing / tracking-", re.compile(r"(?:letter-spacing|tracking-)", re.IGNORECASE)),
    ("dark mode classes / media queries", re.compile(r"(?:\bdark:|prefers-color-scheme:\s*dark)")),
]

# Unicode emoji range regex
EMOJI_PATTERN = re.compile(
    "["
    "\U0001F600-\U0001F64F"  # emoticons
    "\U0001F300-\U0001F5FF"  # symbols & pictographs
    "\U0001F680-\U0001F6FF"  # transport & map
    "\U0001F1E0-\U0001F1FF"  # flags (iOS)
    "\U00002702-\U000027B0"
    "\U000024C2-\U0001F251"
    "\U0001F900-\U0001F9FF"  # supplemental symbols
    "\U0001FA70-\U0001FAFF"
    "]+",
    flags=re.UNICODE,
)

HEX_PATTERN = re.compile(r"#[0-9a-fA-F]{3,8}\b")


def check_style():
    print(f"=== Running Clinical Paper Style Gate (Task 5.2) ===")
    print(f"Target Directory: {TARGET_DIR}")
    print(f"Exempted 3D Files: {sorted(list(EXEMPT_FILES))}\n")

    violations = []
    files_checked = 0

    for file_path in TARGET_DIR.rglob("*"):
        if not file_path.is_file():
            continue
        if file_path.suffix not in (".ts", ".tsx", ".css", ".html", ".js", ".jsx"):
            continue

        rel_path = file_path.relative_to(REPO_ROOT)
        file_name = file_path.name

        # Check exemptions for 3D model files
        if file_name in EXEMPT_FILES:
            continue

        files_checked += 1
        try:
            content = file_path.read_text(encoding="utf-8")
        except Exception as e:
            print(f"Error reading {rel_path}: {e}")
            continue

        lines = content.splitlines()
        for line_num, line in enumerate(lines, 1):
            # 1. Check general forbidden rules
            for rule_name, pattern in FORBIDDEN_RULES:
                # Allow spinner keyframes & animation in index.css
                match = pattern.search(line)
                if match:
                    violations.append(
                        f"[{rule_name}] at {rel_path}:{line_num}\n  Line: {line.strip()}"
                    )

            # 2. Check emojis
            emoji_match = EMOJI_PATTERN.search(line)
            if emoji_match:
                violations.append(
                    f"[emoji detected] at {rel_path}:{line_num}\n  Line: {line.strip()}"
                )

            # 3. Check hex color outside tokens.css
            if file_name != "tokens.css":
                hex_match = HEX_PATTERN.search(line)
                if hex_match:
                    violations.append(
                        f"[hex color outside tokens.css: {hex_match.group(0)}] at {rel_path}:{line_num}\n  Line: {line.strip()}"
                    )

    print(f"Total source files evaluated: {files_checked}")

    if violations:
        print(f"\n[FAIL] Style Gate FAILED with {len(violations)} violation(s):\n")
        for v in violations:
            print(f" - {v}\n")
        sys.exit(1)
    else:
        print("\n[PASS] Style Gate PASSED with 0 violations.")
        print("All audited source files conform strictly to the Clinical Paper specification.")
        sys.exit(0)


if __name__ == "__main__":
    check_style()
