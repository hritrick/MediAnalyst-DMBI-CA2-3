from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class AnalysisRequest(BaseModel):
    task_type: str = Field(..., description="Task type: 'classification', 'regression', or 'clustering'")
    target_column: Optional[str] = Field(None, description="Outcome / target column name")
    feature_columns: Optional[List[str]] = Field(None, description="Subset of columns to use as predictors")
    excluded_columns: Optional[List[str]] = Field(default_factory=list, description="Columns to ignore (e.g. IDs)")
    models: Optional[List[str]] = Field(default_factory=list, description="Model names to train and evaluate")
    test_size: float = Field(0.20, ge=0.05, le=0.50, description="Test partition ratio")
    random_state: int = Field(42, description="Reproducibility seed")
    stratify: bool = Field(True, description="Stratify split for classification")
    imputer_strategy: str = Field("median", description="Missing value strategy: 'mean', 'median', 'mode'")
    scaler: str = Field("standard", description="Feature scaling: 'standard', 'minmax', 'none'")
    target_binarize: Optional[bool] = Field(False, description="Convert multi-level target >0 to 1")
    threshold_tuning: Optional[bool] = Field(True, description="Perform clinical decision threshold optimization")
    target_precision_goal: Optional[float] = Field(0.80, ge=0.5, le=0.99, description="Target precision for threshold search")

class HeartDiseaseConfig(BaseModel):
    binarize: bool = True
    test_size: float = 0.20
    random_state: int = 42
    threshold_goal: float = 0.80
