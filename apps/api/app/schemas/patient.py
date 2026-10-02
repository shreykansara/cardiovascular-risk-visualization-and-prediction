"""
Patient Clinical Input Schema & Physiological Validators
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction

Enforces physiological boundaries on all 55 clinical, ECG, and echocardiographic features.
Provides robust coercion and aliases for seamless frontend interaction.
"""

from __future__ import annotations

from typing import Any, Literal
import pandas as pd
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class PatientInputSchema(BaseModel):
    """
    Complete clinical input schema for cardiovascular risk prediction.
    Contains all 55 clinical parameters extracted from the Z-Alizadeh Sani cohort.
    Excludes Cath, CAD, LAD, LCX, and RCA to strictly prevent data leakage.
    """

    model_config = ConfigDict(
        populate_by_name=True,
        extra="forbid",
        json_schema_extra={
            "example": {
                "Age": 62.0,
                "Weight": 78.0,
                "Length": 172.0,
                "Sex": "Male",
                "BMI": 26.37,
                "DM": "1",
                "HTN": "1",
                "Current Smoker": "1",
                "EX-Smoker": "0",
                "FH": "0",
                "Obesity": "N",
                "CRF": "N",
                "CVA": "N",
                "Airway disease": "N",
                "Thyroid Disease": "N",
                "CHF": "N",
                "DLP": "Y",
                "BP": 140.0,
                "PR": 80.0,
                "Edema": "0",
                "Weak Peripheral Pulse": "N",
                "Lung rales": "N",
                "Systolic Murmur": "N",
                "Diastolic Murmur": "N",
                "Typical Chest Pain": "1",
                "Dyspnea": "N",
                "Function Class": "2",
                "Atypical": "N",
                "Nonanginal": "N",
                "Exertional CP": "N",
                "LowTH Ang": "N",
                "Q Wave": "0",
                "St Elevation": "1",
                "St Depression": "0",
                "Tinversion": "1",
                "LVH": "N",
                "Poor R Progression": "N",
                "BBB": "N",
                "FBS": 125.0,
                "CR": 1.1,
                "TG": 190.0,
                "LDL": 135.0,
                "HDL": 38.0,
                "BUN": 22.0,
                "ESR": 24.0,
                "HB": 13.8,
                "K": 4.4,
                "Na": 141.0,
                "WBC": 7800.0,
                "Lymph": 28.0,
                "Neut": 64.0,
                "PLT": 235.0,
                "EF-TTE": 45.0,
                "Region RWMA": "1",
                "VHD": "N",
            }
        },
    )

    # Patient identifier (optional for tracking)
    patient_id: str | None = Field(default=None, description="Optional anonymous patient identifier")

    # --- Demographics & Anthropometrics ---
    Age: float = Field(default=58.0, ge=18.0, le=110.0, description="Patient age in years (18-110)")
    Weight: float = Field(default=74.0, ge=30.0, le=250.0, description="Patient weight in kg (30-250)")
    Length: float = Field(default=165.0, ge=100.0, le=240.0, description="Patient height/length in cm (100-240)")
    Sex: Literal["Male", "Female"] = Field(default="Male", description="Biological sex")
    BMI: float = Field(default=26.8, ge=12.0, le=65.0, description="Body Mass Index (kg/m^2)")

    # --- Anamnesis & Medical History (Binary/Categorical) ---
    DM: str = Field(default="0", description="Diabetes Mellitus ('0' or '1')")
    HTN: str = Field(default="1", description="Hypertension history ('0' or '1')")
    Current_Smoker: str = Field(default="0", alias="Current Smoker", description="Current smoker status ('0' or '1')")
    EX_Smoker: str = Field(default="0", alias="EX-Smoker", description="Ex-smoker status ('0' or '1')")
    FH: str = Field(default="0", description="Family History of CAD ('0' or '1')")
    Obesity: Literal["Y", "N"] = Field(default="N", description="Clinically diagnosed obesity ('Y' or 'N')")
    CRF: Literal["Y", "N"] = Field(default="N", description="Chronic Renal Failure ('Y' or 'N')")
    CVA: Literal["Y", "N"] = Field(default="N", description="Cerebrovascular Accident history ('Y' or 'N')")
    Airway_disease: Literal["Y", "N"] = Field(default="N", alias="Airway disease", description="Airway/pulmonary disease ('Y' or 'N')")
    Thyroid_Disease: Literal["Y", "N"] = Field(default="N", alias="Thyroid Disease", description="Thyroid dysfunction ('Y' or 'N')")
    CHF: Literal["Y", "N"] = Field(default="N", description="Congestive Heart Failure ('Y' or 'N')")
    DLP: Literal["Y", "N"] = Field(default="N", description="Dyslipidemia ('Y' or 'N')")

    # --- Physical Examination & Vitals ---
    BP: float = Field(default=130.0, ge=50.0, le=260.0, description="Systolic Blood Pressure in mmHg (50-260)")
    PR: float = Field(default=70.0, ge=35.0, le=220.0, description="Resting Pulse Rate in bpm (35-220)")
    Edema: str = Field(default="0", description="Peripheral edema ('0' or '1')")
    Weak_Peripheral_Pulse: Literal["Y", "N"] = Field(default="N", alias="Weak Peripheral Pulse", description="Diminished peripheral pulses ('Y' or 'N')")
    Lung_rales: Literal["Y", "N"] = Field(default="N", alias="Lung rales", description="Auscultated lung rales ('Y' or 'N')")
    Systolic_Murmur: Literal["Y", "N"] = Field(default="N", alias="Systolic Murmur", description="Cardiac systolic murmur ('Y' or 'N')")
    Diastolic_Murmur: Literal["Y", "N"] = Field(default="N", alias="Diastolic Murmur", description="Cardiac diastolic murmur ('Y' or 'N')")

    # --- Symptoms & Functional Status ---
    Typical_Chest_Pain: str = Field(default="0", alias="Typical Chest Pain", description="Substernal chest pain provoked by exertion ('0' or '1')")
    Dyspnea: Literal["Y", "N"] = Field(default="N", description="Exertional dyspnea ('Y' or 'N')")
    Function_Class: str = Field(default="0", alias="Function Class", description="NYHA Functional Class ('0', '1', '2', '3')")
    Atypical: Literal["Y", "N"] = Field(default="N", description="Atypical angina ('Y' or 'N')")
    Nonanginal: Literal["Y", "N"] = Field(default="N", description="Non-anginal chest pain ('Y' or 'N')")
    Exertional_CP: Literal["N", "Y"] = Field(default="N", alias="Exertional CP", description="Exertional chest pain ('N' or 'Y')")
    LowTH_Ang: Literal["Y", "N"] = Field(default="N", alias="LowTH Ang", description="Low-threshold angina ('Y' or 'N')")

    # --- Electrocardiogram (ECG) Findings ---
    Q_Wave: str = Field(default="0", alias="Q Wave", description="Pathologic Q Wave present ('0' or '1')")
    St_Elevation: str = Field(default="0", alias="St Elevation", description="ST segment elevation on resting ECG ('0' or '1')")
    St_Depression: str = Field(default="0", alias="St Depression", description="ST segment depression on resting ECG ('0' or '1')")
    Tinversion: str = Field(default="0", description="T-wave inversion on resting ECG ('0' or '1')")
    LVH: Literal["Y", "N"] = Field(default="N", description="Left Ventricular Hypertrophy ('Y' or 'N')")
    Poor_R_Progression: Literal["Y", "N"] = Field(default="N", alias="Poor R Progression", description="Poor R-wave progression in precordial leads ('Y' or 'N')")
    BBB: Literal["N", "LBBB", "RBBB"] = Field(default="N", description="Bundle Branch Block ('N', 'LBBB', 'RBBB')")

    # --- Laboratory Blood Biomarkers ---
    FBS: float = Field(default=98.0, ge=40.0, le=600.0, description="Fasting Blood Sugar in mg/dL (40-600)")
    CR: float = Field(default=1.0, ge=0.1, le=15.0, description="Serum Creatinine in mg/dL (0.1-15.0)")
    TG: float = Field(default=122.0, ge=20.0, le=2000.0, description="Serum Triglycerides in mg/dL (20-2000)")
    LDL: float = Field(default=100.0, ge=10.0, le=500.0, description="Low-Density Lipoprotein in mg/dL (10-500)")
    HDL: float = Field(default=39.0, ge=5.0, le=180.0, description="High-Density Lipoprotein in mg/dL (5-180)")
    BUN: float = Field(default=16.0, ge=2.0, le=150.0, description="Blood Urea Nitrogen in mg/dL (2-150)")
    ESR: float = Field(default=15.0, ge=1.0, le=150.0, description="Erythrocyte Sedimentation Rate in mm/hr (1-150)")
    HB: float = Field(default=13.2, ge=5.0, le=25.0, description="Hemoglobin in g/dL (5-25)")
    K: float = Field(default=4.2, ge=1.5, le=9.0, description="Serum Potassium in mEq/L (1.5-9.0)")
    Na: float = Field(default=141.0, ge=100.0, le=180.0, description="Serum Sodium in mEq/L (100-180)")
    WBC: float = Field(default=7100.0, ge=1000.0, le=50000.0, description="White Blood Cell count per mcL (1000-50000)")
    Lymph: float = Field(default=32.0, ge=1.0, le=90.0, description="Lymphocyte percentage (1-90%)")
    Neut: float = Field(default=60.0, ge=5.0, le=95.0, description="Neutrophil percentage (5-95%)")
    PLT: float = Field(default=210.0, ge=10.0, le=1500.0, description="Platelet count x10^3/mcL (10-1500)")

    # --- Echocardiographic Findings ---
    EF_TTE: float = Field(default=50.0, ge=10.0, le=85.0, alias="EF-TTE", description="Left Ventricular Ejection Fraction % (10-85%)")
    Region_RWMA: str = Field(
        default="0",
        alias="Region RWMA",
        description="Regional Wall Motion Abnormality score: 0=None, 1=Anterior, 2=Inferior, 3=Lateral, 4=Septal/Multiple",
    )
    VHD: Literal["N", "mild", "Moderate", "Severe"] = Field(default="N", description="Valvular Heart Disease severity")

    @field_validator(
        "DM", "HTN", "Current_Smoker", "EX_Smoker", "FH", "Edema",
        "Typical_Chest_Pain", "Q_Wave", "St_Elevation", "St_Depression",
        "Tinversion", "Function_Class", "Region_RWMA",
        mode="before",
    )
    @classmethod
    def coerce_to_str(cls, v: Any) -> str:
        """Coerce boolean/int inputs to clean string representations matching metadata."""
        if isinstance(v, bool):
            return "1" if v else "0"
        return str(v).strip()

    @model_validator(mode="after")
    def compute_or_validate_bmi(self) -> PatientInputSchema:
        """If BMI is default or slightly out of sync, recalculates based on Weight and Length."""
        if self.Length > 0:
            height_m = self.Length / 100.0
            expected_bmi = self.Weight / (height_m * height_m)
            # If user did not provide custom BMI, auto-calculate
            if abs(self.BMI - expected_bmi) > 5.0 and self.BMI == 26.8:
                self.BMI = round(expected_bmi, 2)
        return self

    def to_feature_dataframe(self) -> pd.DataFrame:
        """
        Converts the patient input into a single-row pandas DataFrame matching
        the exact 55 feature column names and order of the trained model preprocessor.
        """
        data_dict = {
            "Age": float(self.Age),
            "Weight": float(self.Weight),
            "Length": float(self.Length),
            "Sex": str(self.Sex),
            "BMI": float(self.BMI),
            "DM": str(self.DM),
            "HTN": str(self.HTN),
            "Current Smoker": str(self.Current_Smoker),
            "EX-Smoker": str(self.EX_Smoker),
            "FH": str(self.FH),
            "Obesity": str(self.Obesity),
            "CRF": str(self.CRF),
            "CVA": str(self.CVA),
            "Airway disease": str(self.Airway_disease),
            "Thyroid Disease": str(self.Thyroid_Disease),
            "CHF": str(self.CHF),
            "DLP": str(self.DLP),
            "BP": float(self.BP),
            "PR": float(self.PR),
            "Edema": str(self.Edema),
            "Weak Peripheral Pulse": str(self.Weak_Peripheral_Pulse),
            "Lung rales": str(self.Lung_rales),
            "Systolic Murmur": str(self.Systolic_Murmur),
            "Diastolic Murmur": str(self.Diastolic_Murmur),
            "Typical Chest Pain": str(self.Typical_Chest_Pain),
            "Dyspnea": str(self.Dyspnea),
            "Function Class": str(self.Function_Class),
            "Atypical": str(self.Atypical),
            "Nonanginal": str(self.Nonanginal),
            "Exertional CP": str(self.Exertional_CP),
            "LowTH Ang": str(self.LowTH_Ang),
            "Q Wave": str(self.Q_Wave),
            "St Elevation": str(self.St_Elevation),
            "St Depression": str(self.St_Depression),
            "Tinversion": str(self.Tinversion),
            "LVH": str(self.LVH),
            "Poor R Progression": str(self.Poor_R_Progression),
            "BBB": str(self.BBB),
            "FBS": float(self.FBS),
            "CR": float(self.CR),
            "TG": float(self.TG),
            "LDL": float(self.LDL),
            "HDL": float(self.HDL),
            "BUN": float(self.BUN),
            "ESR": float(self.ESR),
            "HB": float(self.HB),
            "K": float(self.K),
            "Na": float(self.Na),
            "WBC": float(self.WBC),
            "Lymph": float(self.Lymph),
            "Neut": float(self.Neut),
            "PLT": float(self.PLT),
            "EF-TTE": float(self.EF_TTE),
            "Region RWMA": str(self.Region_RWMA),
            "VHD": str(self.VHD),
        }
        return pd.DataFrame([data_dict])
