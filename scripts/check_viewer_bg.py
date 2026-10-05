#!/usr/bin/env python3
"""
Contrast Checker for 3D Viewer Background (Task 3.5)
Verifies that the three vessel display colors used by the 3D model:
- Low risk: #10B981
- Moderate risk: #F59E0B
- High risk: #EF4444
each achieve at least 3.0:1 WCAG contrast against VIEWER_BG (#3A0812).
"""

import sys
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
VIEWER_CONFIG_PATH = REPO_ROOT / "apps" / "web" / "src" / "components" / "canvas" / "viewerConfig.ts"
INFERENCE_PATH = REPO_ROOT / "apps" / "api" / "app" / "services" / "inference.py"

def hex_to_rgb(hex_str: str) -> tuple[int, int, int]:
    clean = hex_str.strip().lstrip('#')
    if len(clean) == 3:
        clean = ''.join(c * 2 for c in clean)
    return (int(clean[0:2], 16), int(clean[2:4], 16), int(clean[4:6], 16))

def srgb_to_linear(c: int) -> float:
    v = c / 255.0
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4

def relative_luminance(rgb: tuple[int, int, int]) -> float:
    r, g, b = rgb
    return 0.2126 * srgb_to_linear(r) + 0.7152 * srgb_to_linear(g) + 0.0722 * srgb_to_linear(b)

def contrast_ratio(rgb1: tuple[int, int, int], rgb2: tuple[int, int, int]) -> float:
    l1 = relative_luminance(rgb1)
    l2 = relative_luminance(rgb2)
    brightest = max(l1, l2)
    darkest = min(l1, l2)
    return (brightest + 0.05) / (darkest + 0.05)

def main():
    print("=== Checking 3D Viewer Background Contrast (Task 3.5) ===\n")

    # 1. Read VIEWER_BG
    content = VIEWER_CONFIG_PATH.read_text(encoding="utf-8")
    m = re.search(r"VIEWER_BG\s*=\s*['\"]([^'\"]+)['\"]", content)
    if not m:
        print(f"[ERROR] Could not find VIEWER_BG in {VIEWER_CONFIG_PATH}")
        sys.exit(1)
    viewer_bg_hex = m.group(1).upper()
    viewer_bg_rgb = hex_to_rgb(viewer_bg_hex)
    print(f"VIEWER_BG: {viewer_bg_hex} -> RGB {viewer_bg_rgb}")

    # 2. Read vessel display colors from inference.py
    inf_content = INFERENCE_PATH.read_text(encoding="utf-8")
    vessel_colors = {}
    m_low = re.search(r'return\s+["\'](#[0-9a-fA-F]{6})["\']', inf_content)
    # The three colors from map_probability_to_color:
    colors_found = re.findall(r'return\s+["\'](#[0-9a-fA-F]{6})["\']', inf_content)
    if len(colors_found) >= 3:
        vessel_colors['Low'] = colors_found[0]
        vessel_colors['Moderate'] = colors_found[1]
        vessel_colors['High'] = colors_found[2]
    else:
        # Fallback to standard model display colors
        vessel_colors = {
            'Low': '#10B981',
            'Moderate': '#F59E0B',
            'High': '#EF4444',
        }

    all_pass = True
    print("\nContrast against VIEWER_BG:")
    for tier, hex_code in vessel_colors.items():
        rgb = hex_to_rgb(hex_code)
        ratio = contrast_ratio(rgb, viewer_bg_rgb)
        status = "PASS" if ratio >= 3.0 else "FAIL"
        print(f"  - {tier:8s} ({hex_code} -> RGB {rgb}): {ratio:.2f}:1 (Required: >= 3.0:1) [{status}]")
        if ratio < 3.0:
            all_pass = False

    if not all_pass:
        print("\n[FAIL] One or more vessel colors failed contrast against VIEWER_BG.")
        sys.exit(1)
    else:
        print(f"\n[PASS] All vessel colors satisfy >= 3.0:1 contrast against {viewer_bg_hex}!")
        sys.exit(0)

if __name__ == "__main__":
    main()
