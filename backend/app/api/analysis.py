import logging
from fastapi import APIRouter, HTTPException
from app.schemas.requests import AnalysisRequest
from app.schemas.responses import AnalysisResponse
from app.services.evaluator import run_dataset_analysis, load_analysis

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Analysis"])

@router.post("/datasets/{dataset_id}/analyze", response_model=AnalysisResponse)
def analyze_dataset(dataset_id: str, request: AnalysisRequest):
    """
    Execute machine learning and statistical modeling on the specified dataset.
    Supports classification, regression, and clustering with data quality safeguards.
    """
    try:
        return run_dataset_analysis(dataset_id, request)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Analysis failure: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Model execution error: {str(e)}")

@router.get("/analyses/{analysis_id}", response_model=AnalysisResponse)
def get_analysis_result(analysis_id: str):
    """Retrieve full results for a previously completed analysis."""
    data = load_analysis(analysis_id)
    return data
