"""
Pydantic Data Transfer Models for Deterministic Clinical Report Extraction.
"""

from typing import Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field, field_validator

from .report_types import ReportType

ConfidenceLevel = Literal["high", "check"]
RejectionReason = Literal[
    "out_of_range",
    "unknown_unit",
    "censored_value",
    "not_percent",
    "unparseable",
]
ExtractionStatus = Literal["ok", "partial", "empty"]

class ExtractedField(BaseModel):
    """A successfully extracted clinical parameter."""
    value: Union[float, int, str, bool]
    confidence: ConfidenceLevel
    unit_in_report: Optional[str] = None
    converted: bool = False
    derived: bool = False
    evidence: str = Field(description="Matched label and value snippet (max 80 chars)")
    page: int = Field(ge=1, description="1-indexed page number where value was found")

    @field_validator("evidence")
    @classmethod
    def clamp_evidence(cls, v: str) -> str:
        s = v.strip() if v else ""
        return s[:80]

class RejectedField(BaseModel):
    """A candidate field that was rejected during extraction."""
    key: str
    reason: RejectionReason
    found: str = Field(description="Snippet of found value or unit (max 40 chars)")

    @field_validator("found")
    @classmethod
    def clamp_found(cls, v: str) -> str:
        s = v.strip() if v else ""
        return s[:40]

class ExtractionResult(BaseModel):
    """Complete response payload for a report extraction request."""
    report_type: ReportType
    status: ExtractionStatus
    pages: int = Field(ge=0)
    fields: Dict[str, ExtractedField] = Field(default_factory=dict)
    not_found: List[str] = Field(default_factory=list)
    rejected: List[RejectedField] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    elapsed_ms: int = Field(ge=0)

    @classmethod
    def compute_status(cls, filled_count: int, total_owned_count: int) -> ExtractionStatus:
        """Determines status according to specification:
        'ok' = every owned key found;
        'partial' = at least one found and at least one not found;
        'empty' = none found.
        """
        if filled_count == 0:
            return "empty"
        if filled_count >= total_owned_count:
            return "ok"
        return "partial"

class ErrorBody(BaseModel):
    """Standardized error response body."""
    code: str
    message: str
    suggested_type: Optional[ReportType] = None
