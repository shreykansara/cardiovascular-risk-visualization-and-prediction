"""
Common API Schemas & Responses
"""

from datetime import datetime, timezone
from typing import Any
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    service: str = Field(default="Perfusion3D API", description="Service identifier")
    status: str = Field(..., description="System operational readiness status ('READY' or 'DEGRADED')")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    version: str = Field(..., description="API Version")
    models_loaded: list[str] = Field(..., description="List of active model prediction heads")
    feature_count: int = Field(..., description="Number of permissible input features")
    disclaimer: str = Field(..., description="Clinical decision support notice")


class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error type identifier")
    detail: str = Field(..., description="Human-readable error description")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
