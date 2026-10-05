"""
Clinical Risk Bands & Thresholds Configuration (Single Source of Truth - Task 2.7)
Grounded in calibrated model thresholds:
- Low: <= 40% (0.0 to 0.40)
- Moderate: 41% - 70% (0.401 to 0.70)
- High: > 70% (0.701 to 1.0)
Words strictly standardized to: "Low" | "Moderate" | "High"
"""

from typing import Literal

RiskLabel = Literal["Low", "Moderate", "High"]


def risk_label(probability: float) -> RiskLabel:
    """Returns standardized clinical risk label: 'Low', 'Moderate', or 'High'."""
    p = max(0.0, min(1.0, float(probability)))
    if p <= 0.40:
        return "Low"
    elif p <= 0.70:
        return "Moderate"
    else:
        return "High"
