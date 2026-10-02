"""
Model Service: In-Memory Artifact Manager
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any
import joblib

from apps.api.app.config import settings
from apps.api.app.utils.logger import logger


class ModelService:
    """
    Singleton service managing the lifecycle and memory state of trained models,
    preprocessors, TreeSHAP explainers, and metadata.
    """

    _instance: ModelService | None = None

    def __new__(cls) -> ModelService:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if getattr(self, "_initialized", False):
            return

        self.models_dir: Path = settings.MODELS_DIR
        self.preprocessor: Any = None
        self.models: dict[str, dict[str, Any]] = {}
        self.shap_bundle: dict[str, Any] = {}
        self.metadata: dict[str, Any] = {}
        self.is_ready: bool = False
        self._initialized = True

    def load_artifacts(self) -> None:
        """Loads all serialized joblib pipelines and explainers into memory."""
        logger.info(f"Loading model artifacts from {self.models_dir.resolve()}...")

        preprocessor_path = self.models_dir / "preprocessor.joblib"
        metadata_path = self.models_dir / "model_metadata.json"
        shap_path = self.models_dir / "shap_explainers.joblib"

        if not preprocessor_path.exists():
            raise FileNotFoundError(
                f"Missing preprocessor artifact at {preprocessor_path}. "
                "Ensure scripts/train.py has been executed."
            )

        # 1. Load Preprocessor
        self.preprocessor = joblib.load(preprocessor_path)
        logger.info("Loaded shared preprocessor ColumnTransformer.")

        # 2. Load Model Heads (CAD, LAD, LCX, RCA)
        for target in ["cad", "lad", "lcx", "rca"]:
            model_file = self.models_dir / f"{target}_model.joblib"
            if not model_file.exists():
                raise FileNotFoundError(f"Missing model artifact: {model_file}")
            self.models[target.upper()] = joblib.load(model_file)
            logger.info(f"Loaded calibrated model head: {target.upper()}")

        # 3. Load TreeSHAP Explainers
        if shap_path.exists():
            self.shap_bundle = joblib.load(shap_path)
            logger.info("Loaded TreeSHAP explainers for all 4 targets.")
        else:
            logger.warning(f"SHAP explainers bundle not found at {shap_path}.")

        # 4. Load Metadata
        if metadata_path.exists():
            with open(metadata_path, "r", encoding="utf-8") as f:
                self.metadata = json.load(f)
            logger.info("Loaded model metadata.")

        self.is_ready = True
        logger.info("All model artifacts and TreeSHAP explainers loaded successfully.")

    def get_model_bundle(self, target: str) -> dict[str, Any]:
        """Returns the model bundle for a specific target head."""
        target_upper = target.upper()
        if target_upper not in self.models:
            raise KeyError(f"Target '{target}' not loaded. Permissible targets: {list(self.models.keys())}")
        return self.models[target_upper]

    def get_explainer(self, target: str) -> Any:
        """Returns the TreeExplainer instance for a specific target head."""
        target_upper = target.upper()
        explainers = self.shap_bundle.get("explainers", {})
        if target_upper not in explainers:
            raise KeyError(f"No TreeSHAP explainer available for target '{target}'.")
        return explainers[target_upper]


# Global Singleton Instance
model_service = ModelService()
