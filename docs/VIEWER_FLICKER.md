# 3D Viewer Stability & Flicker Audit Report (Task 3)

## 1. Executive Summary

This document details the reproduction, diagnosis, and remediation of visual stability issues in the Perfusion3D interactive viewer. Following the reversion of the experimental chest cavity backdrop, the viewer was restored to clean clinical studio lighting against a solid flat deep-red background (`#3A0812`), with zero flicker, zero black flashes during rotation, robust DOM label overlays, and preserved heart luminance.

---

## 2. Root Cause Analysis of Pre-Revert Defects

1. **Cavity Backdrop Clipping / Black Flash**:
   The inverted ellipsoid backdrop had a radius of 2.21 units while the camera was positioned at distance 3.10. During rotation, the camera passed outside the ellipsoid, causing the scene background and back geometry to be culled or occluded by the unlit back-face geometry.
2. **Radial Fog Near Distance**:
   `scene.fog` with near distance configured at `distance * 1.2` rendered far coronary geometry pitch black during rotation transitions.
3. **`useFrame` Layout Thrashing & React State Re-render Loop**:
   Inside `HeartModel.tsx`, `getBoundingClientRect()` was invoked synchronously on each frame to compute callout box collisions, triggering `setLabelVisuals` React state updates at 60fps.
4. **WebGL Context Recreation Thrashing**:
   Inline object literals for `<Canvas gl={{ ... }}>` caused React to re-instantiate the Three.js WebGL renderer and context upon every component re-render, leading to browser warnings ("Too many active WebGL contexts") and WebGL context loss.

---

## 3. Comparative Stability Metrics (Before vs. After)

| Metric | Cavity State (Before) | Reverted State (After) | Pass Criteria | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Idle Max Changed-Pixel %** | 19.18% (due to intro sway & context thrash) | **0.0000%** | <= 0.05% | **PASS** |
| **Front View Heart Occupancy** | 18.97% | **18.97%** | >= 10.00% | **PASS** |
| **Left View Heart Occupancy** | 15.84% | **16.19%** | >= 10.00% | **PASS** |
| **Back View Heart Occupancy** | 1.29% (dim/occluded) | **17.43%** | >= 10.00% | **PASS** |
| **Right View Heart Occupancy** | 13.55% | **14.12%** | >= 10.00% | **PASS** |
| **Right View Lost Heart** | Reproduced during cavity thrash | **NO** | NO | **PASS** |
| **Minimum Rotation Luminance** | 0.0140 (pitch black flash) | **0.0428** | > 0.0422 (50% idle) | **PASS** |
| **Black Flash (< 50% idle)** | YES (FAIL) | **NONE (PASS)** | NONE | **PASS** |
| **Scene Clear Color** | Plum brown (`#1F0E14`) | **Solid Deep Red (`#3A0812`)** | `#3A0812` | **PASS** |

---

## 4. Vessel Contrast Audit against `#3A0812`

Audited via `scripts/check_viewer_bg.py`:

| Vessel Risk Tier | Hex Color | Contrast Ratio vs. `#3A0812` | Required WCAG UI Ratio | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Low Risk** | `#10B981` (Emerald) | **6.77:1** | >= 3.0:1 | **PASS** |
| **Moderate Risk** | `#F59E0B` (Amber) | **7.99:1** | >= 3.0:1 | **PASS** |
| **High Risk** | `#EF4444` (Coral Red) | **4.56:1** | >= 3.0:1 | **PASS** |

---

## 5. Heart Luminance Verification (Task 3.6)

Measured against Phase 0 baseline (`BASELINE_SHA 64e9f33`), where mean myocardium luminance was **59.08 / 255**:

| Patient Sample | Observed Mean RGB | Observed Mean Luminance | Baseline Comparison |
| :--- | :--- | :--- | :--- |
| **Healthy Normal (Low)** | (119.0, 82.0, 71.9) | **89.16 / 255** | +50.9% brighter than baseline |
| **LAD Ischemia (Moderate)** | (128.4, 77.8, 69.4) | **87.98 / 255** | +48.9% brighter than baseline |
| **Triple-Vessel (High)** | (144.3, 69.9, 64.6) | **85.32 / 255** | +44.4% brighter than baseline |

All configurations exceed baseline luminance while preserving photographic clinical realism.

---

## 6. Label Stability & Selected Vessel Chip (Task 3.7 & 3.8)

- **DOM Anchors**: Vessel badges (`VesselLabel.tsx`) are mounted outside the `<Canvas>` in a single persistent DOM overlay.
- **Hardware-Accelerated Position**: Positions update via `style.transform = translate3d(x, y, 0)` in `useFrame`, completely bypassing React state updates.
- **Hysteresis Facing**: Badges fade in when normal-to-camera dot product exceeds `+0.1` and fade out when below `-0.1`.
- **CSS Transitions**: Opacity transitions use `opacity 120ms ease` with `pointer-events: none` when hidden.
- **Selected Vessel Chip**: When a vessel is focused, a solid chip appears top-left (8px margin) with a 24px icon button (Lucide `X`, `aria-label="Clear selection"`). Keyboard `Escape` clears selection.
