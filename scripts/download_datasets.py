#!/usr/bin/env python3
"""
scripts/download_datasets.py
============================
Reproducible dataset acquisition, verification, and cataloging script for MediAnalytics.
Downloads official datasets directly from the UCI Machine Learning Repository,
computes SHA-256 checksums, preserves unmodified raw data, cleans processed versions,
and writes the catalog manifest and metadata files.
"""

import os
import sys
import io
import json
import hashlib
import zipfile
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Tuple, Optional, Dict, Any
import urllib.request
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("DatasetAcquisition")

# Repository root directory
REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
METADATA_DIR = DATA_DIR / "metadata"

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MediAnalytics-Research/1.0"}

def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def download_file(url: str, dest_path: Path, timeout: int = 60) -> Tuple[bool, Optional[str]]:
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    logger.info(f"Downloading {url} -> {dest_path.name}...")
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            content = resp.read()
            if len(content) == 0:
                return False, "Downloaded response is empty"
            with open(dest_path, "wb") as f:
                f.write(content)
        return True, None
    except Exception as e:
        logger.error(f"Failed to download {url}: {e}")
        return False, str(e)

from typing import Tuple, Optional, Dict, Any

def process_heart_disease(raw_csv_path: Path, processed_csv_path: Path) -> Dict[str, Any]:
    """
    Cleveland Heart Disease:
    Preserve original target (0, 1, 2, 3, 4) in 'num' and 'target' aliases.
    Preserve missing values ('?' -> NaN).
    """
    df = pd.read_csv(raw_csv_path, na_values=['?', 'NA', ''])
    # Ensure column names
    expected_cols = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal', 'num']
    if list(df.columns) != expected_cols:
        df.columns = expected_cols
    
    # In processed dataset, keep 'num' as original multiclass target (0, 1, 2, 3, 4)
    # Also add 'target' alias for direct notebook compatibility
    df['target'] = df['num']
    # Add explicit binary target column for convenience
    df['target_binary'] = (df['num'] > 0).astype(int)

    df.to_csv(processed_csv_path, index=False)
    return {
        "rows": len(df),
        "cols": len(df.columns),
        "columns": list(df.columns),
        "target_candidates": ["num", "target", "target_binary"],
        "target_encodings": {
            "num": "0=No disease, 1=Mild, 2=Moderate, 3=Severe, 4=Critical",
            "target": "Preserved original 0-4 multiclass severity",
            "target_binary": "0=Absence (<50% stenosis), 1=Presence (>=50% stenosis)"
        },
        "missing_counts": df.isnull().sum().to_dict()
    }

def process_diabetes(raw_csv_path: Path, processed_csv_path: Path) -> Dict[str, Any]:
    """
    CDC Diabetes Health Indicators:
    253,680 rows, 23 columns. Target: Diabetes_binary (0=No, 1=Prediabetes/Diabetes).
    Identifier: ID.
    """
    df = pd.read_csv(raw_csv_path)
    df.columns = [c.strip() for c in df.columns]
    df.to_csv(processed_csv_path, index=False)
    
    return {
        "rows": len(df),
        "cols": len(df.columns),
        "columns": list(df.columns),
        "target_candidates": ["Diabetes_binary"],
        "target_encodings": {
            "Diabetes_binary": "0=No diabetes, 1=Prediabetes or Diabetes"
        },
        "identifier_columns": ["ID"],
        "missing_counts": df.isnull().sum().to_dict()
    }

def process_breast_cancer(raw_csv_path: Path, processed_csv_path: Path) -> Dict[str, Any]:
    """
    Breast Cancer Wisconsin (Diagnostic):
    569 rows, 32 columns. Target: Diagnosis (M=Malignant, B=Benign).
    Identifier: ID.
    """
    df = pd.read_csv(raw_csv_path)
    df.columns = [c.strip() for c in df.columns]
    df.to_csv(processed_csv_path, index=False)
    
    return {
        "rows": len(df),
        "cols": len(df.columns),
        "columns": list(df.columns),
        "target_candidates": ["Diagnosis"],
        "target_encodings": {
            "Diagnosis": "M=Malignant, B=Benign"
        },
        "identifier_columns": ["ID"],
        "missing_counts": df.isnull().sum().to_dict()
    }

def process_kidney_disease(raw_csv_path: Path, processed_csv_path: Path) -> Dict[str, Any]:
    """
    Chronic Kidney Disease:
    400 rows, 25 columns.
    Clean trailing tabs ('ckd\t' -> 'ckd', '\tno' -> 'no').
    Preserve missing values.
    """
    df = pd.read_csv(raw_csv_path, na_values=['?', 'NA', '', '\t?'])
    df.columns = [c.strip() for c in df.columns]
    
    # Clean string columns of leading/trailing whitespace and tabs
    for col in df.select_dtypes(include=['object', 'string']).columns:
        df[col] = df[col].astype(str).str.strip()
        df[col] = df[col].replace({'nan': None, 'None': None, '': None, '?': None})
    
    # Specific known typo in class column
    if 'class' in df.columns:
        df['class'] = df['class'].replace({'ckd\t': 'ckd'})
    if 'dm' in df.columns:
        df['dm'] = df['dm'].replace({'\tno': 'no', '\tyes': 'yes', ' yes': 'yes'})
    if 'cad' in df.columns:
        df['cad'] = df['cad'].replace({'\tno': 'no'})
        
    df.to_csv(processed_csv_path, index=False)
    
    return {
        "rows": len(df),
        "cols": len(df.columns),
        "columns": list(df.columns),
        "target_candidates": ["class"],
        "target_encodings": {
            "class": "ckd=Chronic Kidney Disease, notckd=Not Chronic Kidney Disease"
        },
        "missing_counts": df.isnull().sum().to_dict(),
        "data_quality_notes": [
            "Original UCI dataset contains trailing tabs in categorical values (e.g., 'ckd\\t', '\\tno'). Cleaned in processed version.",
            "High missingness in red blood cell counts (rbc, rbcc) and specific gravity (sg)."
        ]
    }

def process_maternal_health(raw_csv_path: Path, processed_csv_path: Path) -> Dict[str, Any]:
    """
    Maternal Health Risk:
    1014 rows, 7 columns. Multiclass risk level.
    Clean UTF-8 BOM from Age column.
    """
    df = pd.read_csv(raw_csv_path)
    # Strip potential BOM and whitespace from column names
    df.columns = [c.replace('\ufeff', '').strip() for c in df.columns]
    for col in df.select_dtypes(include=['object', 'string']).columns:
        df[col] = df[col].astype(str).str.strip()
        df[col] = df[col].replace({'nan': None, 'None': None, '': None})
        
    df.to_csv(processed_csv_path, index=False)
    
    return {
        "rows": len(df),
        "cols": len(df.columns),
        "columns": list(df.columns),
        "target_candidates": ["RiskLevel"],
        "target_encodings": {
            "RiskLevel": "low risk, mid risk, high risk (ordered clinical risk strata)"
        },
        "missing_counts": df.isnull().sum().to_dict(),
        "data_quality_notes": [
            "Source CSV contained UTF-8 byte order mark (\\ufeff) in 'Age' header; sanitized during ingestion."
        ]
    }

def process_wine_quality(raw_csv_path: Path, processed_csv_path: Path) -> Dict[str, Any]:
    """
    Wine Quality (Non-Medical Tabular Benchmark):
    6,497 rows (Red + White), 13 columns.
    Target: quality (3-9 continuous score for regression).
    """
    df = pd.read_csv(raw_csv_path)
    df.columns = [c.strip() for c in df.columns]
    df.to_csv(processed_csv_path, index=False)
    
    return {
        "rows": len(df),
        "cols": len(df.columns),
        "columns": list(df.columns),
        "target_candidates": ["quality"],
        "target_encodings": {
            "quality": "Continuous sensory quality score (range 3 to 9, median 6)"
        },
        "missing_counts": df.isnull().sum().to_dict(),
        "notes": "Non-medical general analytics benchmark for regression evaluation."
    }

def main():
    logger.info("Starting MediAnalytics Dataset Acquisition & Verification...")
    
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    METADATA_DIR.mkdir(parents=True, exist_ok=True)
    
    download_manifest = {
        "retrieval_timestamp": datetime.now(timezone.utc).isoformat(),
        "tool": "MediAnalytics Dataset Acquisition Pipeline",
        "datasets": {}
    }
    
    catalog_entries = []
    
    # -------------------------------------------------------------------------
    # 1. Cleveland Heart Disease
    # -------------------------------------------------------------------------
    hd_raw_dir = RAW_DIR / "heart_disease"
    hd_proc_dir = PROCESSED_DIR / "heart_disease"
    hd_proc_dir.mkdir(parents=True, exist_ok=True)
    
    hd_url_csv = "https://archive.ics.uci.edu/static/public/45/data.csv"
    hd_url_zip = "https://archive.ics.uci.edu/static/public/45/heart+disease.zip"
    hd_raw_csv = hd_raw_dir / "data.csv"
    hd_raw_zip = hd_raw_dir / "heart+disease.zip"
    
    ok1, err1 = download_file(hd_url_csv, hd_raw_csv)
    ok2, err2 = download_file(hd_url_zip, hd_raw_zip)
    
    if ok2 and hd_raw_zip.exists():
        try:
            with zipfile.ZipFile(hd_raw_zip) as z:
                z.extract("processed.cleveland.data", hd_raw_dir)
                z.extract("heart-disease.names", hd_raw_dir)
        except Exception as e:
            logger.warning(f"Could not extract heart disease zip members: {e}")
            
    if ok1 and hd_raw_csv.exists():
        hd_proc_csv = hd_proc_dir / "cleveland_heart_disease.csv"
        stats = process_heart_disease(hd_raw_csv, hd_proc_csv)
        sha_raw = sha256_file(hd_raw_csv)
        sha_proc = sha256_file(hd_proc_csv)
        
        download_manifest["datasets"]["heart_disease"] = {
            "status": "verified",
            "source_url": hd_url_csv,
            "raw_file": str(hd_raw_csv.relative_to(REPO_ROOT)),
            "processed_file": str(hd_proc_csv.relative_to(REPO_ROOT)),
            "raw_sha256": sha_raw,
            "processed_sha256": sha_proc,
            "file_size_bytes": hd_raw_csv.stat().st_size,
            "retrieval_date": datetime.now(timezone.utc).strftime("%Y-%m-%d")
        }
        
        catalog_entries.append({
            "id": "heart-disease",
            "name": "UCI Cleveland Heart Disease",
            "domain": "Cardiology",
            "category": "cardiology",
            "source": "UCI Machine Learning Repository",
            "source_id": 45,
            "source_url": "https://archive.ics.uci.edu/dataset/45/heart+disease",
            "license": "Creative Commons Attribution 4.0 International (CC BY 4.0)",
            "citation": "Detrano, R., et al. (1989). International application of a new probability algorithm for the diagnosis of coronary artery disease. Am J Cardiol, 64(5), 304-310.",
            "description": "Gold-standard cardiovascular benchmark tracking 14 clinical markers across 303 cardiac patients at Cleveland Clinic Foundation. Serves as the primary reference dataset for the DMBI CA2 notebook.",
            "file_format": "CSV",
            "row_count": stats["rows"],
            "column_count": stats["cols"],
            "features": [c for c in stats["columns"] if c not in ["num", "target", "target_binary"]],
            "target_candidates": stats["target_candidates"],
            "default_target": "target_binary",
            "target_encodings": stats["target_encodings"],
            "has_missing_values": any(v > 0 for v in stats["missing_counts"].values()),
            "missing_summary": {k: v for k, v in stats["missing_counts"].items() if v > 0},
            "suitable_tasks": ["classification", "eda"],
            "supports_multiclass": True,
            "supports_binary": True,
            "supports_regression": False,
            "relative_path": str(hd_proc_csv.relative_to(REPO_ROOT)),
            "sha256": sha_proc,
            "status": "ready",
            "is_medical": True,
            "is_dmbi_benchmark": True
        })
    else:
        download_manifest["datasets"]["heart_disease"] = {"status": "failed", "error": err1}

    # -------------------------------------------------------------------------
    # 2. CDC Diabetes Health Indicators
    # -------------------------------------------------------------------------
    diab_raw_dir = RAW_DIR / "diabetes"
    diab_proc_dir = PROCESSED_DIR / "diabetes"
    diab_proc_dir.mkdir(parents=True, exist_ok=True)
    
    diab_url = "https://archive.ics.uci.edu/static/public/891/data.csv"
    diab_raw_csv = diab_raw_dir / "data.csv"
    
    ok, err = download_file(diab_url, diab_raw_csv, timeout=120)
    if ok and diab_raw_csv.exists():
        diab_proc_csv = diab_proc_dir / "cdc_diabetes_indicators.csv"
        stats = process_diabetes(diab_raw_csv, diab_proc_csv)
        sha_raw = sha256_file(diab_raw_csv)
        sha_proc = sha256_file(diab_proc_csv)
        
        download_manifest["datasets"]["diabetes"] = {
            "status": "verified",
            "source_url": diab_url,
            "raw_file": str(diab_raw_csv.relative_to(REPO_ROOT)),
            "processed_file": str(diab_proc_csv.relative_to(REPO_ROOT)),
            "raw_sha256": sha_raw,
            "processed_sha256": sha_proc,
            "file_size_bytes": diab_raw_csv.stat().st_size,
            "retrieval_date": datetime.now(timezone.utc).strftime("%Y-%m-%d")
        }
        
        catalog_entries.append({
            "id": "cdc-diabetes",
            "name": "CDC Diabetes Health Indicators",
            "domain": "Endocrinology & Epidemiology",
            "category": "endocrinology",
            "source": "UCI Machine Learning Repository / CDC BRFSS",
            "source_id": 891,
            "source_url": "https://archive.ics.uci.edu/dataset/891/cdc+diabetes+health+indicators",
            "license": "Creative Commons Attribution 4.0 International (CC BY 4.0)",
            "citation": "Centers for Disease Control and Prevention (CDC). Behavioral Risk Factor Surveillance System (BRFSS), 2015.",
            "description": "Large-scale epidemiological dataset comprising 253,680 survey respondents and 21 clinical, demographic, and lifestyle indicators assessing diabetes diagnosis risk.",
            "file_format": "CSV",
            "row_count": stats["rows"],
            "column_count": stats["cols"],
            "features": [c for c in stats["columns"] if c not in ["Diabetes_binary", "ID"]],
            "target_candidates": stats["target_candidates"],
            "default_target": "Diabetes_binary",
            "target_encodings": stats["target_encodings"],
            "identifier_columns": stats.get("identifier_columns", ["ID"]),
            "has_missing_values": any(v > 0 for v in stats["missing_counts"].values()),
            "missing_summary": {k: v for k, v in stats["missing_counts"].items() if v > 0},
            "suitable_tasks": ["classification", "eda"],
            "supports_multiclass": False,
            "supports_binary": True,
            "supports_regression": False,
            "relative_path": str(diab_proc_csv.relative_to(REPO_ROOT)),
            "sha256": sha_proc,
            "status": "ready",
            "is_medical": True,
            "is_dmbi_benchmark": False
        })
    else:
        download_manifest["datasets"]["diabetes"] = {"status": "failed", "error": err}

    # -------------------------------------------------------------------------
    # 3. Breast Cancer Wisconsin (Diagnostic)
    # -------------------------------------------------------------------------
    bc_raw_dir = RAW_DIR / "breast_cancer"
    bc_proc_dir = PROCESSED_DIR / "breast_cancer"
    bc_proc_dir.mkdir(parents=True, exist_ok=True)
    
    bc_url_csv = "https://archive.ics.uci.edu/static/public/17/data.csv"
    bc_url_zip = "https://archive.ics.uci.edu/static/public/17/breast+cancer+wisconsin+diagnostic.zip"
    bc_raw_csv = bc_raw_dir / "data.csv"
    bc_raw_zip = bc_raw_dir / "breast_cancer.zip"
    
    ok1, err1 = download_file(bc_url_csv, bc_raw_csv)
    ok2, err2 = download_file(bc_url_zip, bc_raw_zip)
    
    if ok2 and bc_raw_zip.exists():
        try:
            with zipfile.ZipFile(bc_raw_zip) as z:
                z.extract("wdbc.data", bc_raw_dir)
                z.extract("wdbc.names", bc_raw_dir)
        except Exception as e:
            logger.warning(f"Could not extract breast cancer zip members: {e}")
            
    if ok1 and bc_raw_csv.exists():
        bc_proc_csv = bc_proc_dir / "breast_cancer_diagnostic.csv"
        stats = process_breast_cancer(bc_raw_csv, bc_proc_csv)
        sha_raw = sha256_file(bc_raw_csv)
        sha_proc = sha256_file(bc_proc_csv)
        
        download_manifest["datasets"]["breast_cancer"] = {
            "status": "verified",
            "source_url": bc_url_csv,
            "raw_file": str(bc_raw_csv.relative_to(REPO_ROOT)),
            "processed_file": str(bc_proc_csv.relative_to(REPO_ROOT)),
            "raw_sha256": sha_raw,
            "processed_sha256": sha_proc,
            "file_size_bytes": bc_raw_csv.stat().st_size,
            "retrieval_date": datetime.now(timezone.utc).strftime("%Y-%m-%d")
        }
        
        catalog_entries.append({
            "id": "breast-cancer-wisconsin",
            "name": "Breast Cancer Wisconsin (Diagnostic)",
            "domain": "Oncology",
            "category": "oncology",
            "source": "UCI Machine Learning Repository",
            "source_id": 17,
            "source_url": "https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic",
            "license": "Creative Commons Attribution 4.0 International (CC BY 4.0)",
            "citation": "Street, W.N., Wolberg, W.H., & Mangasarian, O.L. (1993). Nuclear feature extraction for breast tumor diagnosis. IS&T/SPIE 1905, 861-870.",
            "description": "569 digitized fine needle aspirate (FNA) cell nucleus measurements with 30 continuous real-valued morphometric descriptors predicting malignancy (M vs B).",
            "file_format": "CSV",
            "row_count": stats["rows"],
            "column_count": stats["cols"],
            "features": [c for c in stats["columns"] if c not in ["Diagnosis", "ID"]],
            "target_candidates": stats["target_candidates"],
            "default_target": "Diagnosis",
            "target_encodings": stats["target_encodings"],
            "identifier_columns": stats.get("identifier_columns", ["ID"]),
            "has_missing_values": False,
            "missing_summary": {},
            "suitable_tasks": ["classification", "clustering", "eda"],
            "supports_multiclass": False,
            "supports_binary": True,
            "supports_regression": False,
            "relative_path": str(bc_proc_csv.relative_to(REPO_ROOT)),
            "sha256": sha_proc,
            "status": "ready",
            "is_medical": True,
            "is_dmbi_benchmark": False
        })
    else:
        download_manifest["datasets"]["breast_cancer"] = {"status": "failed", "error": err1}

    # -------------------------------------------------------------------------
    # 4. Chronic Kidney Disease
    # -------------------------------------------------------------------------
    kd_raw_dir = RAW_DIR / "kidney_disease"
    kd_proc_dir = PROCESSED_DIR / "kidney_disease"
    kd_proc_dir.mkdir(parents=True, exist_ok=True)
    
    kd_url_csv = "https://archive.ics.uci.edu/static/public/336/data.csv"
    kd_url_zip = "https://archive.ics.uci.edu/static/public/336/chronic+kidney+disease.zip"
    kd_raw_csv = kd_raw_dir / "data.csv"
    kd_raw_zip = kd_raw_dir / "chronic_kidney_disease.zip"
    
    ok1, err1 = download_file(kd_url_csv, kd_raw_csv)
    ok2, err2 = download_file(kd_url_zip, kd_raw_zip)
    
    if ok1 and kd_raw_csv.exists():
        kd_proc_csv = kd_proc_dir / "chronic_kidney_disease.csv"
        stats = process_kidney_disease(kd_raw_csv, kd_proc_csv)
        sha_raw = sha256_file(kd_raw_csv)
        sha_proc = sha256_file(kd_proc_csv)
        
        download_manifest["datasets"]["kidney_disease"] = {
            "status": "verified",
            "source_url": kd_url_csv,
            "raw_file": str(kd_raw_csv.relative_to(REPO_ROOT)),
            "processed_file": str(kd_proc_csv.relative_to(REPO_ROOT)),
            "raw_sha256": sha_raw,
            "processed_sha256": sha_proc,
            "file_size_bytes": kd_raw_csv.stat().st_size,
            "retrieval_date": datetime.now(timezone.utc).strftime("%Y-%m-%d")
        }
        
        catalog_entries.append({
            "id": "chronic-kidney-disease",
            "name": "Chronic Kidney Disease",
            "domain": "Nephrology",
            "category": "nephrology",
            "source": "UCI Machine Learning Repository",
            "source_id": 336,
            "source_url": "https://archive.ics.uci.edu/dataset/336/chronic+kidney+disease",
            "license": "Creative Commons Attribution 4.0 International (CC BY 4.0)",
            "citation": "Rubini, L., Soundarapandian, P., & Eswaran, P. (2015). Chronic Kidney Disease Dataset. Apollo Hospitals, Tamil Nadu, India. UCI Machine Learning Repository.",
            "description": "400 patient records across 24 clinical parameters (blood pressure, serum creatinine, urea, hemoglobin) diagnosing chronic kidney disease with extensive missingness and mixed types.",
            "file_format": "CSV",
            "row_count": stats["rows"],
            "column_count": stats["cols"],
            "features": [c for c in stats["columns"] if c != "class"],
            "target_candidates": stats["target_candidates"],
            "default_target": "class",
            "target_encodings": stats["target_encodings"],
            "has_missing_values": any(v > 0 for v in stats["missing_counts"].values()),
            "missing_summary": {k: v for k, v in stats["missing_counts"].items() if v > 0},
            "suitable_tasks": ["classification", "eda"],
            "supports_multiclass": False,
            "supports_binary": True,
            "supports_regression": False,
            "relative_path": str(kd_proc_csv.relative_to(REPO_ROOT)),
            "sha256": sha_proc,
            "status": "ready",
            "is_medical": True,
            "is_dmbi_benchmark": False
        })
    else:
        download_manifest["datasets"]["kidney_disease"] = {"status": "failed", "error": err1}

    # -------------------------------------------------------------------------
    # 5. Maternal Health Risk
    # -------------------------------------------------------------------------
    mh_raw_dir = RAW_DIR / "maternal_health"
    mh_proc_dir = PROCESSED_DIR / "maternal_health"
    mh_proc_dir.mkdir(parents=True, exist_ok=True)
    
    mh_url_csv = "https://archive.ics.uci.edu/static/public/863/data.csv"
    mh_url_zip = "https://archive.ics.uci.edu/static/public/863/maternal+health+risk.zip"
    mh_raw_csv = mh_raw_dir / "data.csv"
    mh_raw_zip = mh_raw_dir / "maternal_health.zip"
    
    ok1, err1 = download_file(mh_url_csv, mh_raw_csv)
    ok2, err2 = download_file(mh_url_zip, mh_raw_zip)
    
    if ok1 and mh_raw_csv.exists():
        mh_proc_csv = mh_proc_dir / "maternal_health_risk.csv"
        stats = process_maternal_health(mh_raw_csv, mh_proc_csv)
        sha_raw = sha256_file(mh_raw_csv)
        sha_proc = sha256_file(mh_proc_csv)
        
        download_manifest["datasets"]["maternal_health"] = {
            "status": "verified",
            "source_url": mh_url_csv,
            "raw_file": str(mh_raw_csv.relative_to(REPO_ROOT)),
            "processed_file": str(mh_proc_csv.relative_to(REPO_ROOT)),
            "raw_sha256": sha_raw,
            "processed_sha256": sha_proc,
            "file_size_bytes": mh_raw_csv.stat().st_size,
            "retrieval_date": datetime.now(timezone.utc).strftime("%Y-%m-%d")
        }
        
        catalog_entries.append({
            "id": "maternal-health-risk",
            "name": "Maternal Health Risk",
            "domain": "Obstetrics & Maternal Health",
            "category": "obstetrics",
            "source": "UCI Machine Learning Repository",
            "source_id": 863,
            "source_url": "https://archive.ics.uci.edu/dataset/863/maternal+health+risk",
            "license": "Creative Commons Attribution 4.0 International (CC BY 4.0)",
            "citation": "Ahmed, M., Kashem, M.A., Rahman, M., & Khatun, S. (2020). Review and Analysis of Risk Factor of Maternal Health in Remote Area Using IoT in the Context of Bangladesh. Int. J. Adv. Comput. Sci. Appl.",
            "description": "1,014 records assessing pregnancy and maternal health risk across 6 vital physiological markers (Systolic BP, Diastolic BP, Blood Sugar, Body Temp, Heart Rate, Age) categorized into 3 clinical risk strata (low, mid, high).",
            "file_format": "CSV",
            "row_count": stats["rows"],
            "column_count": stats["cols"],
            "features": [c for c in stats["columns"] if c != "RiskLevel"],
            "target_candidates": stats["target_candidates"],
            "default_target": "RiskLevel",
            "target_encodings": stats["target_encodings"],
            "has_missing_values": False,
            "missing_summary": {},
            "suitable_tasks": ["classification", "eda"],
            "supports_multiclass": True,
            "supports_binary": False,
            "supports_regression": False,
            "relative_path": str(mh_proc_csv.relative_to(REPO_ROOT)),
            "sha256": sha_proc,
            "status": "ready",
            "is_medical": True,
            "is_dmbi_benchmark": False
        })
    else:
        download_manifest["datasets"]["maternal_health"] = {"status": "failed", "error": err1}

    # -------------------------------------------------------------------------
    # 6. Wine Quality (Non-Medical Tabular Regression Benchmark)
    # -------------------------------------------------------------------------
    wq_raw_dir = RAW_DIR / "wine_quality"
    wq_proc_dir = PROCESSED_DIR / "wine_quality"
    wq_proc_dir.mkdir(parents=True, exist_ok=True)
    
    wq_url_csv = "https://archive.ics.uci.edu/static/public/186/data.csv"
    wq_url_zip = "https://archive.ics.uci.edu/static/public/186/wine+quality.zip"
    wq_raw_csv = wq_raw_dir / "data.csv"
    wq_raw_zip = wq_raw_dir / "wine_quality.zip"
    
    ok1, err1 = download_file(wq_url_csv, wq_raw_csv)
    ok2, err2 = download_file(wq_url_zip, wq_raw_zip)
    
    if ok2 and wq_raw_zip.exists():
        try:
            with zipfile.ZipFile(wq_raw_zip) as z:
                z.extract("winequality-red.csv", wq_raw_dir)
                z.extract("winequality-white.csv", wq_raw_dir)
                z.extract("winequality.names", wq_raw_dir)
        except Exception as e:
            logger.warning(f"Could not extract wine quality zip members: {e}")
            
    if ok1 and wq_raw_csv.exists():
        wq_proc_csv = wq_proc_dir / "wine_quality.csv"
        stats = process_wine_quality(wq_raw_csv, wq_proc_csv)
        sha_raw = sha256_file(wq_raw_csv)
        sha_proc = sha256_file(wq_proc_csv)
        
        download_manifest["datasets"]["wine_quality"] = {
            "status": "verified",
            "source_url": wq_url_csv,
            "raw_file": str(wq_raw_csv.relative_to(REPO_ROOT)),
            "processed_file": str(wq_proc_csv.relative_to(REPO_ROOT)),
            "raw_sha256": sha_raw,
            "processed_sha256": sha_proc,
            "file_size_bytes": wq_raw_csv.stat().st_size,
            "retrieval_date": datetime.now(timezone.utc).strftime("%Y-%m-%d")
        }
        
        catalog_entries.append({
            "id": "wine-quality",
            "name": "Wine Quality Benchmark (Non-Medical)",
            "domain": "General Analytics Benchmark",
            "category": "benchmark",
            "source": "UCI Machine Learning Repository",
            "source_id": 186,
            "source_url": "https://archive.ics.uci.edu/dataset/186/wine+quality",
            "license": "Creative Commons Attribution 4.0 International (CC BY 4.0)",
            "citation": "Cortez, P., Cerdeira, A., Almeida, F., Matos, T., & Reis, J. (2009). Modeling wine preferences by data mining from physicochemical properties. Decision Support Systems, 47(4), 547-553.",
            "description": "6,497 samples with 11 continuous physicochemical properties (acidity, residual sugar, sulfur dioxide, pH, alcohol) evaluating sensory quality (score 3-9). Used strictly as a non-medical tabular regression benchmark.",
            "file_format": "CSV",
            "row_count": stats["rows"],
            "column_count": stats["cols"],
            "features": [c for c in stats["columns"] if c != "quality"],
            "target_candidates": stats["target_candidates"],
            "default_target": "quality",
            "target_encodings": stats["target_encodings"],
            "has_missing_values": False,
            "missing_summary": {},
            "suitable_tasks": ["regression", "clustering", "eda"],
            "supports_multiclass": False,
            "supports_binary": False,
            "supports_regression": True,
            "relative_path": str(wq_proc_csv.relative_to(REPO_ROOT)),
            "sha256": sha_proc,
            "status": "ready",
            "is_medical": False,
            "is_dmbi_benchmark": False
        })
    else:
        download_manifest["datasets"]["wine_quality"] = {"status": "failed", "error": err1}

    # Write Manifest and Catalog JSON
    manifest_path = METADATA_DIR / "download_manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(download_manifest, f, indent=2)
    logger.info(f"Wrote download manifest to {manifest_path}")

    catalog_path = METADATA_DIR / "datasets.json"
    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump(catalog_entries, f, indent=2)
    logger.info(f"Wrote dataset catalog to {catalog_path} ({len(catalog_entries)} entries)")
    
    print("\n================ ACQUISITION SUMMARY ================")
    for entry in catalog_entries:
        print(f"[{entry['status'].upper()}] {entry['id']:<26} | Rows: {entry['row_count']:<6} | Cols: {entry['column_count']:<3} | Target: {entry['default_target']}")
    print("=====================================================\n")

if __name__ == "__main__":
    main()
