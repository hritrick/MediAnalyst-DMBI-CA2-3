export interface DatasetMeta {
  dataset_id: string;
  filename: string;
  row_count: number;
  column_count: number;
  uploaded_at: string;
  file_size_bytes: number;
  is_example: boolean;
  notes?: string;
}

export interface DatasetCatalogItem {
  id: string;
  name: string;
  domain: string;
  category: string;
  source: string;
  source_id?: number | null;
  source_url: string;
  license?: string | null;
  citation?: string | null;
  description: string;
  file_format: string;
  row_count: number;
  column_count: number;
  features: string[];
  target_candidates: string[];
  default_target?: string | null;
  target_encodings?: Record<string, string>;
  identifier_columns?: string[];
  has_missing_values: boolean;
  missing_summary?: Record<string, number>;
  suitable_tasks: string[];
  supports_multiclass: boolean;
  supports_binary: boolean;
  supports_regression: boolean;
  relative_path: string;
  sha256: string;
  status: 'ready' | 'unavailable';
  status_reason?: string | null;
  is_medical: boolean;
  is_dmbi_benchmark: boolean;
}

export interface ColumnProfile {
  name: string;
  original_dtype: string;
  inferred_type: 'numeric' | 'categorical' | 'binary' | 'text' | 'id' | 'constant';
  missing_count: number;
  missing_percentage: number;
  unique_count: number;
  sample_values: (string | number)[];
  suggested_role: 'feature' | 'target_candidate' | 'identifier' | 'ignore';
  is_constant: boolean;
  is_id: boolean;
  is_high_missing: boolean;
  min_value?: number | null;
  max_value?: number | null;
  mean_value?: number | null;
  std_value?: number | null;
  median_value?: number | null;
  skewness?: number | null;
  top_categories?: { category: string; count: number; percentage: number }[] | null;
}

export interface OutlierSummary {
  column: string;
  outlier_count: number;
  outlier_percentage: number;
  lower_bound: number;
  upper_bound: number;
  outlier_values: number[];
}

export interface DatasetProfile {
  dataset_id: string;
  filename: string;
  row_count: number;
  column_count: number;
  total_cells: number;
  missing_cells: number;
  missing_percentage: number;
  duplicate_rows: number;
  duplicate_percentage: number;
  numeric_column_count: number;
  categorical_column_count: number;
  columns: ColumnProfile[];
  preview_rows: Record<string, any>[];
  correlation_matrix?: {
    columns: string[];
    matrix: number[][];
  } | null;
  outliers: OutlierSummary[];
  warnings: string[];
  is_cleveland_heart_disease: boolean;
}

export interface RecommendationItem {
  task_type: 'eda' | 'classification' | 'regression' | 'clustering' | 'association';
  title: string;
  is_recommended: boolean;
  confidence: 'high' | 'moderate' | 'low';
  reason: string;
  candidate_targets: string[];
  candidate_features: string[];
  suggested_models: string[];
}

export interface RecommendationsResponse {
  dataset_id: string;
  recommendations: RecommendationItem[];
  inferred_domain?: string | null;
}

export interface CurvePoint {
  x: number;
  y: number;
}

export interface ConfusionMatrixData {
  labels: string[];
  matrix: number[][];
}

export interface ModelEvaluationResult {
  model_name: string;
  training_time_ms: number;
  metrics: Record<string, number>;
  formatted_metrics: Record<string, string>;
  confusion_matrix?: ConfusionMatrixData | null;
  roc_curve?: CurvePoint[] | null;
  pr_curve?: CurvePoint[] | null;
  roc_auc?: number | null;
  feature_importances?: { feature: string; importance: number }[] | null;
  tree_rules?: Record<string, any> | null;
  cluster_labels?: number[] | null;
  cluster_centers?: Record<string, any>[] | null;
  pca_2d?: { x: number; y: number; cluster: number }[] | null;
  threshold_analysis?: {
    default_threshold: number;
    optimal_threshold: number;
    goal_precision: number;
    adjusted_precision: number;
    adjusted_recall: number;
    adjusted_f1: number;
    confusion_matrix: number[][];
    clinical_rationale: string;
  } | null;
  warnings: string[];
}

export interface HeartDiseaseNotebookAdapterResults {
  age_cohort_summary: {
    cohort: string;
    total_patients: number;
    disease_cases: number;
    prevalence_rate: number;
    prevalence_formatted: string;
  }[];
  chol_outlier_analysis: {
    q1: number;
    q3: number;
    iqr: number;
    upper_bound_cutoff: number;
    outlier_count: number;
    outlier_disease_rate: number;
    overall_disease_rate: number;
    clinical_insight: string;
  };
  optimal_threshold: {
    strategy: string;
    threshold_value: number;
    precision_achieved: number;
    recall_achieved: number;
    clinical_benefit: string;
  };
  decision_tree_narrative: string[];
}

export interface AnalysisResponse {
  analysis_id: string;
  dataset_id: string;
  task_type: string;
  target_column?: string | null;
  created_at: string;
  dataset_summary: Record<string, any>;
  model_results: Record<string, ModelEvaluationResult>;
  comparison_table: Record<string, any>[];
  best_model?: {
    name: string;
    primary_metric: string;
    score: number;
    accuracy?: number;
    r2?: number;
  } | null;
  interpretation: string;
  clinical_recommendation?: string | null;
  warnings: string[];
  heart_disease_adapter?: HeartDiseaseNotebookAdapterResults | null;
}

export interface AnalysisRequest {
  task_type: 'classification' | 'regression' | 'clustering';
  target_column?: string | null;
  feature_columns?: string[];
  excluded_columns?: string[];
  models?: string[];
  test_size?: number;
  random_state?: number;
  stratify?: boolean;
  imputer_strategy?: 'median' | 'mean' | 'mode';
  scaler?: 'standard' | 'minmax' | 'none';
  target_binarize?: boolean;
  threshold_tuning?: boolean;
  target_precision_goal?: number;
}
