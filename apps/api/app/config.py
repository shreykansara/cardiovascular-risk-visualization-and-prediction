"""
Application Configuration
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
"""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR: Path = Path(__file__).resolve().parent.parent.parent.parent

from dotenv import load_dotenv
load_dotenv(ROOT_DIR / ".env")


class Settings(BaseSettings):
    PROJECT_NAME: str = "Perfusion3D API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    # Paths - resolve relative to repository root
    ROOT_DIR: Path = ROOT_DIR
    MODELS_DIR: Path = ROOT_DIR / "models"
    DATA_DIR: Path = ROOT_DIR / "data"
    WEB_DIST_DIR: Path = ROOT_DIR / "apps" / "web" / "dist"

    # CORS configuration for React 19 / Vite development
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",
    ]

    # Clinical Safety Disclaimer (FDA / CE SaMD Decision Support Boundary)
    CLINICAL_DISCLAIMER: str = (
        "DECISION SUPPORT ONLY: This system is an investigational AI prototype for clinical "
        "decision support and research. Predictions and 3D visualizations DO NOT constitute formal "
        "medical diagnosis or replace invasive coronary angiography or diagnostic imaging."
    )

    # Groq Reporting LLM Configuration (Phase B)
    GROQ_API_KEY: str | None = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=str(ROOT_DIR / ".env"),
        extra="ignore",
    )


settings = Settings()
