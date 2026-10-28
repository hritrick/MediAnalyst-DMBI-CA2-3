from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field

class DatasetMeta(BaseModel):
    dataset_id: str
    filename: str
    row_count: int
    column_count: int
    uploaded_at: str
    file_size_bytes: int
    is_example: bool = False
    notes: Optional[str] = None

class ColumnProfile(BaseModel):
    name: str
    original_dtype: str
    inferred_type: str  # 'numeric', 'categorical', 'binary', 'text', 'id', 'constant'
    missing_count: int
    missing_percentage: float
    unique_count: int
    sample_values: List[Any]
    suggested_role: str  # 'feature', 'target_candidate', 'identifier', 'ignore'
    is_constant: bool = False
    is_id: bool = False
    is_high_missing: bool = False
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    mean_value: Optional[float] = None
    std_value: Optional[float] = None
    median_value: Optional[float] = None
    skewness: Optional[float] = None
    top_categories: Optional[List[Dict[str, Any]]] = None

class OutlierSummary(BaseModel):
    column: str
    outlier_count: int
    outlier_percentage: float
    lower_bound: float
    upper_bound: float
    outlier_values: List[float]

class DatasetProfileResponse(BaseModel):
    dataset_id: str
    filename: str
    row_count: int
    column_count: int
    total_cells: int
    missing_cells: int
    missing_percentage: float
    duplicate_rows: int
    duplicate_percentage: float
    numeric_column_count: int
    categorical_column_count: int
    columns: List[ColumnProfile]
    preview_rows: List[Dict[str, Any]]
    correlation_matrix: Optional[Dict[str, Any]] = None
    outliers: List[OutlierSummary] = []
    warnings: List[str] = []
    is_cleveland_heart_disease: bool = False

class RecommendationItem(BaseModel):
    task_type: str  # 'eda', 'classification', 'regression', 'clustering', 'association'
    title: str
    is_recommended: bool
    confidence: str  # 'high', 'moderate', 'low'
    reason: str
    candidate_targets: List[str] = []
    candidate_features: List[str] = []
    suggested_models: List[str] = []

class RecommendationsResponse(BaseModel):
    dataset_id: str
    recommendations: List[RecommendationItem]
    inferred_domain: Optional[str] = None

class MetricValue(BaseModel):
    name: str
    value: float
    formatted: str

class ConfusionMatrixData(BaseModel):
    labels: List[str]
    matrix: List[List[int]]

class CurvePoint(BaseModel):
    x: float
    y: float

class ModelEvaluationResult(BaseModel):
    model_name: str
    training_time_ms: float
    metrics: Dict[str, float]
    formatted_metrics: Dict[str, str]
    confusion_matrix: Optional[ConfusionMatrixData] = None
    roc_curve: Optional[List[CurvePoint]] = None
    pr_curve: Optional[List[CurvePoint]] = None
    roc_auc: Optional[float] = None
    feature_importances: Optional[List[Dict[str, Any]]] = None
    tree_rules: Optional[Dict[str, Any]] = None
    cluster_labels: Optional[List[int]] = None
    cluster_centers: Optional[List[Dict[str, float]]] = None
    pca_2d: Optional[List[Dict[str, Any]]] = None
    threshold_analysis: Optional[Dict[str, Any]] = None
    warnings: List[str] = []

class HeartDiseaseNotebookAdapterResults(BaseModel):
    age_cohort_summary: List[Dict[str, Any]]
    chol_outlier_analysis: Dict[str, Any]
    optimal_threshold: Dict[str, Any]
    decision_tree_narrative: List[str]

class AnalysisResponse(BaseModel):
    analysis_id: str
    dataset_id: str
    task_type: str
    target_column: Optional[str] = None
    created_at: str
    dataset_summary: Dict[str, Any]
    model_results: Dict[str, ModelEvaluationResult]
    comparison_table: List[Dict[str, Any]]
    best_model: Optional[Dict[str, Any]] = None
    interpretation: str
    clinical_recommendation: Optional[str] = None
    warnings: List[str] = []
    heart_disease_adapter: Optional[HeartDiseaseNotebookAdapterResults] = None

class HealthResponse(BaseModel):
    status: str
    version: str
    project: str
    uptime: str
