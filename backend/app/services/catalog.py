import json
import shutil
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
import pandas as pd

from app.config import settings
from app.schemas.responses import DatasetCatalogItem, DatasetMeta
from app.services.loader import save_metadata, NA_VALUES

logger = logging.getLogger(__name__)

def get_dataset_catalog(include_unavailable: bool = True) -> List[DatasetCatalogItem]:
    """
    Retrieve all verified datasets from the central catalog.
    Verifies disk presence and file integrity.
    """
    if not settings.CATALOG_PATH.exists():
        logger.warning(f"Catalog file not found at {settings.CATALOG_PATH}")
        return []

    try:
        with open(settings.CATALOG_PATH, "r", encoding="utf-8") as f:
            raw_entries: List[Dict[str, Any]] = json.load(f)
    except Exception as e:
        logger.error(f"Failed to read catalog at {settings.CATALOG_PATH}: {e}")
        return []

    catalog_items: List[DatasetCatalogItem] = []
    
    for entry in raw_entries:
        rel_path = entry.get("relative_path", "")
        file_path = settings.ROOT_DIR / rel_path if rel_path else None
        
        is_available = file_path is not None and file_path.exists() and file_path.stat().st_size > 0
        
        status = "ready" if is_available else "unavailable"
        status_reason = None
        if not is_available:
            status_reason = (
                f"Dataset file is missing at '{rel_path}'. "
                "Execute 'python scripts/download_datasets.py' to acquire the official dataset from the UCI repository."
            )

        item_dict = dict(entry)
        item_dict["status"] = status
        item_dict["status_reason"] = status_reason

        try:
            catalog_items.append(DatasetCatalogItem(**item_dict))
        except Exception as e:
            logger.warning(f"Catalog entry validation error for {entry.get('id')}: {e}")

    if not include_unavailable:
        catalog_items = [c for c in catalog_items if c.status == "ready"]

    return catalog_items

def load_catalog_dataset(dataset_id: str) -> DatasetMeta:
    """
    Loads a catalog dataset into the active workspace / uploads directory,
    making it immediately available for profiling, recommendations, and analysis.
    """
    catalog = get_dataset_catalog(include_unavailable=True)
    matching = next((item for item in catalog if item.id == dataset_id), None)
    
    if not matching:
        raise HTTPException(
            status_code=404,
            detail=f"Dataset with ID '{dataset_id}' not found in catalog."
        )

    if matching.status != "ready":
        raise HTTPException(
            status_code=400,
            detail=matching.status_reason or f"Dataset '{dataset_id}' is currently unavailable."
        )

    source_path = settings.ROOT_DIR / matching.relative_path
    dest_path = settings.UPLOAD_DIR / f"{dataset_id}.csv"

    # Copy to uploads directory so loader & analyzer services have uniform access
    shutil.copyfile(source_path, dest_path)

    meta = {
        "dataset_id": dataset_id,
        "filename": source_path.name,
        "row_count": matching.row_count,
        "column_count": matching.column_count,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "file_size_bytes": dest_path.stat().st_size,
        "is_example": True,
        "catalog_id": dataset_id,
        "domain": matching.domain,
        "default_target": matching.default_target,
        "notes": matching.description
    }
    save_metadata(dataset_id, meta)
    logger.info(f"Loaded catalog dataset '{dataset_id}' into active uploads ({meta['row_count']} rows)")
    
    return DatasetMeta(**meta)
