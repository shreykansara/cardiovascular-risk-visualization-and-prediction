#!/usr/bin/env python3
"""
scripts/check_cavity_contrast.py
Computes the WCAG contrast of CAVITY_MID and CAVITY_EDGE against the three risk
colours of BOTH themes (Paper and Monitor). Every pair must be at least 3:1.
"""

import sys

def relative_luminance(hex_str: str) -> float:
    hex_clean = hex_str.strip().lstrip('#')
    r, g, b = [int(hex_clean[i:i+2], 16) / 255.0 for i in (0, 2, 4)]
    r_lin = r / 12.92 if r <= 0.04045 else ((r + 0.055) / 1.055) ** 2.4
    g_lin = g / 12.92 if g <= 0.04045 else ((g + 0.055) / 1.055) ** 2.4
    b_lin = b / 12.92 if b <= 0.04045 else ((b + 0.055) / 1.055) ** 2.4
    return 0.2126 * r_lin + 0.7152 * g_lin + 0.0722 * b_lin

def contrast_ratio(hex1: str, hex2: str) -> float:
    l1 = relative_luminance(hex1)
    l2 = relative_luminance(hex2)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

def main():
    # Cavity colors from task 2.2
    cavity_colors = {
        'CAVITY_EDGE': '#0F0809',
        'CAVITY_MID': '#1E1315',
    }

    # Theme risk colors from tokens.css
    themes = {
        'Paper (Light)': {
            'low': '#2E8B57',
            'mod': '#B87700',
            'high': '#C81D3A',
        },
        'Monitor (Dark)': {
            'low': '#3FD08A',
            'mod': '#FFC24D',
            'high': '#FF6B7A',
        }
    }

    print("Checking Cavity Color Contrast (WCAG 2.1 threshold: >= 3.0:1):")
    print("=" * 65)

    all_passed = True
    for cav_name, cav_hex in cavity_colors.items():
        print(f"\nTarget: {cav_name} ({cav_hex})")
        for theme_name, risk_dict in themes.items():
            for risk_label, risk_hex in risk_dict.items():
                ratio = contrast_ratio(cav_hex, risk_hex)
                status = "PASS" if ratio >= 3.0 else "FAIL"
                if ratio < 3.0:
                    all_passed = False
                print(f"  [{status}] {theme_name} {risk_label} ({risk_hex}) vs {cav_name}: {ratio:.2f}:1")

    print("\n" + "=" * 65)
    if all_passed:
        print("RESULT: All cavity color contrast checks PASSED (>= 3.0:1)")
        sys.exit(0)
    else:
        print("RESULT: Some contrast checks FAILED (< 3.0:1)")
        sys.exit(1)

if __name__ == '__main__':
    main()
