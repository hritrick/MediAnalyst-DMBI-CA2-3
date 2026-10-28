import os
import uuid
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Tuple, Dict, Any, Optional
import pandas as pd
from fastapi import UploadFile, HTTPException

from app.config import settings

logger = logging.getLogger(__name__)

# Standard missing indicators commonly found in medical datasets (including '?' in Cleveland)
NA_VALUES = ['?', 'NA', 'N/A', 'na', 'null', 'Null', 'NULL', 'None', 'none', '', 'NaN', 'nan', ' - ', '-']

def generate_id() -> str:
    return str(uuid.uuid4())[:8]

def get_dataset_path(dataset_id: str) -> Path:
    # Look for both .csv and .xlsx
    csv_p = settings.UPLOAD_DIR / f"{dataset_id}.csv"
    if csv_p.exists():
        return csv_p
    xlsx_p = settings.UPLOAD_DIR / f"{dataset_id}.xlsx"
    if xlsx_p.exists():
        return xlsx_p

    # Auto-load from catalog if known catalog dataset ID
    try:
        from app.services.catalog import load_catalog_dataset
        load_catalog_dataset(dataset_id)
        if csv_p.exists():
            return csv_p
    except Exception:
        pass

    raise HTTPException(status_code=404, detail=f"Dataset with ID '{dataset_id}' not found.")

def get_metadata_path(dataset_id: str) -> Path:
    return settings.UPLOAD_DIR / f"{dataset_id}.meta.json"

def save_metadata(dataset_id: str, meta: Dict[str, Any]):
    meta_path = get_metadata_path(dataset_id)
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

def load_metadata(dataset_id: str) -> Dict[str, Any]:
    meta_path = get_metadata_path(dataset_id)
    if not meta_path.exists():
        # Attempt catalog auto-load
        try:
            from app.services.catalog import load_catalog_dataset
            load_catalog_dataset(dataset_id)
        except Exception:
            pass
    if not meta_path.exists():
        raise HTTPException(status_code=404, detail=f"Metadata for dataset '{dataset_id}' not found.")
    with open(meta_path, "r", encoding="utf-8") as f:
        return json.load(f)

def list_all_datasets() -> list[Dict[str, Any]]:
    datasets = []
    for meta_file in settings.UPLOAD_DIR.glob("*.meta.json"):
        try:
            with open(meta_file, "r", encoding="utf-8") as f:
                datasets.append(json.load(f))
        except Exception as e:
            logger.warning(f"Failed to read metadata file {meta_file}: {e}")
    # Sort newest first
    datasets.sort(key=lambda d: d.get("uploaded_at", ""), reverse=True)
    return datasets

def load_dataset_as_dataframe(dataset_id: str) -> pd.DataFrame:
    path = get_dataset_path(dataset_id)
    if path.suffix.lower() == ".csv":
        # Attempt to read with multiple encodings and separators
        for sep in [",", ";", "\t"]:
            try:
                df = pd.read_csv(path, sep=sep, na_values=NA_VALUES)
                if df.shape[1] > 1:
                    df.columns = [str(c).strip() for c in df.columns]
                    return df
            except Exception:
                continue
        # Fallback to default
        df = pd.read_csv(path, na_values=NA_VALUES)
        df.columns = [str(c).strip() for c in df.columns]
        return df
    elif path.suffix.lower() == ".xlsx":
        df = pd.read_excel(path, na_values=NA_VALUES)
        df.columns = [str(c).strip() for c in df.columns]
        return df
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format.")

async def process_and_store_upload(file: UploadFile) -> Tuple[str, Dict[str, Any]]:
    filename = file.filename or "uploaded_dataset.csv"
    ext = Path(filename).suffix.lower()
    
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )
    
    # Read content with size guard
    contents = await file.read()
    file_size = len(contents)
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )
    if file_size == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    dataset_id = generate_id()
    dest_path = settings.UPLOAD_DIR / f"{dataset_id}{ext}"
    
    with open(dest_path, "wb") as f:
        f.write(contents)
        
    try:
        # Validate that it can be parsed as a DataFrame
        df = load_dataset_as_dataframe(dataset_id)
        if df.empty or df.shape[1] == 0:
            dest_path.unlink(missing_ok=True)
            raise HTTPException(status_code=400, detail="The uploaded file contains no valid tabular data.")
        
        meta = {
            "dataset_id": dataset_id,
            "filename": filename,
            "row_count": int(df.shape[0]),
            "column_count": int(df.shape[1]),
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "file_size_bytes": file_size,
            "is_example": False,
            "notes": "User-uploaded medical dataset"
        }
        save_metadata(dataset_id, meta)
        return dataset_id, meta
    except HTTPException:
        raise
    except Exception as e:
        dest_path.unlink(missing_ok=True)
        logger.error(f"Failed to parse uploaded dataset: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

def load_or_create_cleveland_example() -> Tuple[str, Dict[str, Any]]:
    dataset_id = "cleveland-heart"
    dest_path = settings.UPLOAD_DIR / f"{dataset_id}.csv"
    meta_path = settings.UPLOAD_DIR / f"{dataset_id}.meta.json"
    
    columns = [
        'age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg',
        'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal', 'target'
    ]
    
    sample_file = settings.SAMPLE_DATA_DIR / "processed_cleveland_heart_disease.csv"
    
    if not dest_path.exists():
        if sample_file.exists():
            df = pd.read_csv(sample_file, na_values=NA_VALUES)
        else:
            # Fetch remote from UCI
            url = "https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/processed.cleveland.data"
            try:
                import urllib.request
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                df = pd.read_csv(urllib.request.urlopen(req, timeout=10), header=None, names=columns, na_values=NA_VALUES)
            except Exception as e:
                logger.error(f"Failed to fetch Cleveland remote data: {e}")
                raise HTTPException(status_code=500, detail="Could not load UCI Cleveland Heart Disease dataset.")
        
        df.to_csv(dest_path, index=False)
    else:
        df = pd.read_csv(dest_path, na_values=NA_VALUES)
        
    meta = {
        "dataset_id": dataset_id,
        "filename": "uci_cleveland_heart_disease.csv",
        "row_count": int(df.shape[0]),
        "column_count": int(df.shape[1]),
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "file_size_bytes": dest_path.stat().st_size,
        "is_example": True,
        "notes": "UCI Cleveland Heart Disease benchmark dataset (DMBI CA2)"
    }
    save_metadata(dataset_id, meta)
    return dataset_id, meta
