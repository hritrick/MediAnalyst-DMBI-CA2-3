import logging
from typing import List, Dict, Any
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.schemas.responses import (
    DatasetMeta, DatasetProfileResponse, RecommendationsResponse, DatasetCatalogItem
)
from app.services.loader import (
    process_and_store_upload, load_or_create_cleveland_example,
    load_metadata, list_all_datasets, load_dataset_as_dataframe
)
from app.services.catalog import get_dataset_catalog, load_catalog_dataset
from app.services.profiler import profile_dataframe
from app.services.recommender import generate_recommendations

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.get("/catalog", response_model=List[DatasetCatalogItem])
def get_catalog():
    """Retrieve catalog of all verified official datasets with status."""
    return get_dataset_catalog(include_unavailable=True)

@router.post("/catalog/{dataset_id}/load", response_model=DatasetMeta)
def load_catalog_item(dataset_id: str):
    """Load an official verified dataset from the catalog into the active workspace."""
    return load_catalog_dataset(dataset_id)

@router.get("", response_model=List[DatasetMeta])
def get_datasets():
    """List all available and previously uploaded datasets."""
    return list_all_datasets()

@router.post("/upload", response_model=DatasetMeta)
async def upload_dataset(file: UploadFile = File(...)):
    """Upload a CSV or Excel dataset for medical analysis."""
    dataset_id, meta = await process_and_store_upload(file)
    return meta

@router.post("/example/heart-disease", response_model=DatasetMeta)
def load_heart_disease_example():
    """Load the built-in UCI Cleveland Heart Disease benchmark dataset (DMBI CA2)."""
    dataset_id, meta = load_or_create_cleveland_example()
    return meta

@router.get("/{dataset_id}/profile", response_model=DatasetProfileResponse)
def get_dataset_profile(dataset_id: str):
    """Retrieve full structural, statistical, and data-quality profiling for a dataset."""
    meta = load_metadata(dataset_id)
    df = load_dataset_as_dataframe(dataset_id)
    return profile_dataframe(df, dataset_id, meta.get("filename", "dataset.csv"))

@router.post("/{dataset_id}/recommendations", response_model=RecommendationsResponse)
def get_dataset_recommendations(dataset_id: str):
    """Generate intelligent machine-learning and statistical recommendations."""
    meta = load_metadata(dataset_id)
    df = load_dataset_as_dataframe(dataset_id)
    profile = profile_dataframe(df, dataset_id, meta.get("filename", "dataset.csv"))
    return generate_recommendations(profile, df)
