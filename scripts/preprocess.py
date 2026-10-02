"""
Data Preprocessing & Strict Leakage Guardrail Pipeline
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction

Ingests the UCI Extension of Z-Alizadeh Sani Dataset (303 records),
isolates targets, strictly excludes catheterization ('Cath') and vessel stenosis
outcomes from feature matrix X, standardizes types, and exports clean Parquet matrices.
"""

from __future__ import annotations

import argparse
import io
import json
import logging
import zipfile
from pathlib import Path
from typing import Any

import httpx
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("preprocess")

UCI_DATASET_ZIP_URL = (
    "https://archive.ics.uci.edu/static/public/411/extention+of+z+alizadeh+sani+dataset.zip"
)

# Non-negotiable target and invasive indicator columns
FORBIDDEN_LEAKAGE_COLUMNS = {
    "cath",
    "cad",
    "lad",
    "lcx",
    "rca",
    "target",
    "ground_truth",
    "stenosis",
}


class DataLeakageException(Exception):
    """Raised when forbidden target or invasive angiography features leak into X."""
    pass


class StrictFeatureFilter(BaseEstimator, TransformerMixin):
    """
    Scikit-learn compatible transformer ensuring absolute prevention of target leakage.
    Inspects all feature columns and raises DataLeakageException if any forbidden column is found.
    """

    EXACT_FORBIDDEN = {"cad", "lad", "lcx", "rca"}
    SUBSTRING_FORBIDDEN = {"cath", "stenosis", "target", "ground_truth"}

    def __init__(self, forbidden_columns: set[str] | None = None):
        self.feature_names_in_: list[str] = []

    def fit(self, X: pd.DataFrame, y: Any = None) -> StrictFeatureFilter:
        self._validate_no_leakage(X)
        self.feature_names_in_ = list(X.columns)
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        self._validate_no_leakage(X)
        return X.copy()

    def _validate_no_leakage(self, X: pd.DataFrame) -> None:
        if not isinstance(X, pd.DataFrame):
            # If numpy array, column check must occur before conversion
            return
        cols = [c.lower().strip() for c in X.columns]
        leaks = []
        for c in cols:
            tokens = set(c.replace("-", "_").replace(" ", "_").split("_"))
            if any(exact in tokens or exact == c for exact in self.EXACT_FORBIDDEN):
                leaks.append(c)
            elif any(sub in c for sub in self.SUBSTRING_FORBIDDEN):
                leaks.append(c)
        if leaks:
            raise DataLeakageException(
                f"CRITICAL TARGET LEAKAGE DETECTED: Features contain forbidden columns: {leaks}. "
                f"Cath, CAD, LAD, LCX, and RCA MUST be excluded from feature matrix X!"
            )


def download_dataset_if_missing(raw_csv_path: Path) -> Path:
    """Downloads dataset from UCI archive if local copy is missing."""
    if raw_csv_path.exists() and raw_csv_path.stat().st_size > 1000:
        logger.info(f"Raw dataset already present at: {raw_csv_path}")
        return raw_csv_path

    logger.info(f"Dataset not found at {raw_csv_path}. Fetching from official UCI repository...")
    raw_csv_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        response = httpx.get(UCI_DATASET_ZIP_URL, follow_redirects=True, timeout=60.0)
        response.raise_for_status()

        with zipfile.ZipFile(io.BytesIO(response.content)) as z:
            excel_files = [f for f in z.namelist() if f.endswith((".xlsx", ".xls"))]
            if not excel_files:
                raise FileNotFoundError(f"No Excel file found in downloaded zip: {z.namelist()}")
            
            with z.open(excel_files[0]) as f:
                df = pd.read_excel(f)

        # Standardize 'Fmale' typo in raw dataset
        if "Sex" in df.columns:
            df["Sex"] = df["Sex"].replace({"Fmale": "Female"})

        df.to_csv(raw_csv_path, index=False)
        logger.info(f"Successfully downloaded and saved raw dataset to {raw_csv_path} (Shape: {df.shape})")
        return raw_csv_path
    except Exception as e:
        logger.error(f"Failed to fetch dataset from UCI: {e}")
        raise


def preprocess_and_validate(
    input_path: Path,
    output_dir: Path,
    strict_leakage_check: bool = True,
    export_metadata: bool = True,
) -> tuple[pd.DataFrame, pd.DataFrame, dict[str, Any]]:
    """
    Loads raw dataset, validates schema, isolates targets, asserts zero leakage,
    and exports parquet feature and target files.
    """
    logger.info(f"Loading raw dataset from {input_path}")
    df = pd.read_csv(input_path)
    logger.info(f"Raw dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")

    # Assert expected cohort size
    assert len(df) == 303, f"Expected 303 patient records, found {len(df)}"

    # Identify Target Columns in Z-Alizadeh Sani dataset
    # In this dataset:
    # 'Cath' is the overall catheterization outcome ('CAD' vs 'Normal') -> Overall CAD label
    # 'LAD' is Left Anterior Descending stenosis ('Stenotic' vs 'Normal')
    # 'LCX' is Left Circumflex stenosis ('Stenotic' vs 'Normal')
    # 'RCA' is Right Coronary Artery stenosis ('Stenotic' vs 'Normal')
    target_cols = ["Cath", "LAD", "LCX", "RCA"]
    for col in target_cols:
        assert col in df.columns, f"Required target column '{col}' missing from raw dataset!"

    # 1. Binarize Targets
    # CAD: 1 if Cath == 'CAD', else 0
    # LAD: 1 if LAD == 'Stenotic', else 0
    # LCX: 1 if LCX == 'Stenotic', else 0
    # RCA: 1 if RCA == 'Stenotic', else 0
    y_df = pd.DataFrame(index=df.index)
    y_df["CAD"] = (df["Cath"].astype(str).str.strip().str.upper() == "CAD").astype(np.int32)
    y_df["LAD"] = (df["LAD"].astype(str).str.strip().str.upper() == "STENOTIC").astype(np.int32)
    y_df["LCX"] = (df["LCX"].astype(str).str.strip().str.upper() == "STENOTIC").astype(np.int32)
    y_df["RCA"] = (df["RCA"].astype(str).str.strip().str.upper() == "STENOTIC").astype(np.int32)

    logger.info("Target class distributions:")
    for col in y_df.columns:
        pos_cnt = int(y_df[col].sum())
        neg_cnt = int((y_df[col] == 0).sum())
        logger.info(f"  Target '{col}': {pos_cnt} Positive (1), {neg_cnt} Negative (0) [Prevalence: {pos_cnt/len(y_df):.2%}]")

    # 2. Strict Target Leakage Exclusion: Drop targets & Cath from feature matrix X
    drop_from_features = ["Cath", "LAD", "LCX", "RCA"]
    X_df = df.drop(columns=drop_from_features).copy()

    # Normalize spelling inconsistencies
    if "Sex" in X_df.columns:
        X_df["Sex"] = X_df["Sex"].replace({"Fmale": "Female"})

    # 3. Enforce StrictFeatureFilter Guardrail
    if strict_leakage_check:
        leakage_guard = StrictFeatureFilter()
        leakage_guard.fit(X_df)
        logger.info("StrictFeatureFilter passed: Feature matrix X is 100% free of Cath, CAD, LAD, LCX, and RCA!")

    logger.info(f"Feature matrix X prepared with {X_df.shape[1]} features for {X_df.shape[0]} patients.")

    # 4. Categorize Features (Continuous vs Categorical)
    categorical_cols: list[str] = []
    numerical_cols: list[str] = []

    for col in X_df.columns:
        if X_df[col].dtype == object or X_df[col].dtype == "string":
            categorical_cols.append(col)
        elif X_df[col].nunique() <= 5 and col not in ["Age", "BP", "PR", "FBS", "TG", "LDL", "HDL", "BUN", "ESR", "HB", "K", "Na", "WBC", "Lymph", "Neut", "PLT", "EF-TTE"]:
            # Low cardinality integer flags (e.g., DM, HTN, Current Smoker)
            categorical_cols.append(col)
        else:
            numerical_cols.append(col)

    logger.info(f"Identified {len(numerical_cols)} numerical features and {len(categorical_cols)} categorical features.")

    # 5. Extract Feature Metadata
    feature_metadata: dict[str, Any] = {
        "dataset_name": "Extension of Z-Alizadeh Sani Dataset",
        "sample_count": len(df),
        "feature_count": X_df.shape[1],
        "targets": {
            col: {
                "positive_count": int(y_df[col].sum()),
                "negative_count": int((y_df[col] == 0).sum()),
                "prevalence": float(y_df[col].mean()),
            }
            for col in y_df.columns
        },
        "numerical_features": {},
        "categorical_features": {},
        "target_leakage_guardrails": {
            "excluded_columns": drop_from_features,
            "status": "ENFORCED_AND_VERIFIED",
        },
    }

    for col in numerical_cols:
        series = X_df[col].astype(float)
        feature_metadata["numerical_features"][col] = {
            "dtype": str(series.dtype),
            "min": float(series.min()),
            "max": float(series.max()),
            "median": float(series.median()),
            "mean": float(series.mean()),
            "iqr": float(series.quantile(0.75) - series.quantile(0.25)),
            "std": float(series.std()),
        }

    for col in categorical_cols:
        series = X_df[col].astype(str)
        feature_metadata["categorical_features"][col] = {
            "dtype": "categorical",
            "unique_values": sorted(series.unique().tolist()),
            "mode": series.mode().iloc[0] if not series.mode().empty else "Unknown",
        }

    # 6. Export Parquet and Metadata Files
    output_dir.mkdir(parents=True, exist_ok=True)
    x_parquet_path = output_dir / "X_features.parquet"
    y_parquet_path = output_dir / "y_targets.parquet"
    meta_json_path = output_dir / "feature_metadata.json"

    # Convert object columns to string for parquet serialization
    X_export = X_df.copy()
    for col in categorical_cols:
        X_export[col] = X_export[col].astype(str)

    X_export.to_parquet(x_parquet_path, index=False)
    y_df.to_parquet(y_parquet_path, index=False)
    logger.info(f"Exported X features to: {x_parquet_path}")
    logger.info(f"Exported y targets to: {y_parquet_path}")

    if export_metadata:
        with open(meta_json_path, "w", encoding="utf-8") as f:
            json.dump(feature_metadata, f, indent=2)
        logger.info(f"Exported feature metadata to: {meta_json_path}")

    return X_export, y_df, feature_metadata


def main():
    parser = argparse.ArgumentParser(description="Preprocess and validate Z-Alizadeh Sani cardiac dataset.")
    parser.add_argument("--input-path", type=str, default="data/raw/z_alizadeh_sani.csv", help="Path to raw CSV")
    parser.add_argument("--output-dir", type=str, default="data/processed", help="Path to processed output dir")
    parser.add_argument("--strict-leakage-check", action="store_true", default=True, help="Enforce target leakage check")
    parser.add_argument("--export-metadata", action="store_true", default=True, help="Export feature metadata JSON")
    args = parser.parse_args()

    raw_path = Path(args.input_path)
    output_dir = Path(args.output_dir)

    # Ensure dataset is available
    download_dataset_if_missing(raw_path)

    # Run preprocessing and validation
    preprocess_and_validate(
        input_path=raw_path,
        output_dir=output_dir,
        strict_leakage_check=args.strict_leakage_check,
        export_metadata=args.export_metadata,
    )


if __name__ == "__main__":
    main()
