import logging
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from app.services.evaluator import load_analysis
from app.services.loader import load_metadata, load_dataset_as_dataframe
from app.services.report_generator import generate_pdf_report, generate_clean_csv

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Reports"])

@router.get("/analyses/{analysis_id}/report")
def get_analysis_report(analysis_id: str):
    """Retrieve full structured report document payload for an analysis."""
    analysis = load_analysis(analysis_id)
    dataset_id = analysis.get("dataset_id")
    meta = load_metadata(dataset_id)
    return {
        "analysis": analysis,
        "metadata": meta,
        "academic_citation": "DMBI CA2 Clinical Machine Learning Pipeline — Cleveland Heart Disease Benchmark (UCI)"
    }

@router.get("/analyses/{analysis_id}/pdf")
def download_pdf_report(analysis_id: str):
    """Download a publication-quality PDF report."""
    analysis = load_analysis(analysis_id)
    dataset_id = analysis.get("dataset_id")
    meta = load_metadata(dataset_id)
    
    pdf_path = generate_pdf_report(analysis, meta)
    if not pdf_path.exists():
        raise HTTPException(status_code=500, detail="Could not generate PDF report.")
        
    return FileResponse(
        path=str(pdf_path),
        filename=f"MediAnalytics_Report_{analysis_id}.pdf",
        media_type="application/pdf"
    )

@router.get("/analyses/{analysis_id}/export/clean-csv")
def export_clean_dataset(analysis_id: str):
    """Export the clean, deduplicated dataset as a downloadable CSV."""
    analysis = load_analysis(analysis_id)
    dataset_id = analysis.get("dataset_id")
    df = load_dataset_as_dataframe(dataset_id)
    
    stream = generate_clean_csv(df, drop_duplicates=True)
    return StreamingResponse(
        stream,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=cleaned_{dataset_id}.csv"}
    )
