import { DatasetMeta, DatasetProfile, RecommendationsResponse, AnalysisResponse } from '../types';

export const CLEVELAND_META: DatasetMeta = {
  "dataset_id": "cleveland-heart",
  "filename": "uci_cleveland_heart_disease.csv",
  "row_count": 303,
  "column_count": 14,
  "uploaded_at": "2026-10-28T17:28:19.774764+00:00",
  "file_size_bytes": 18535,
  "is_example": true,
  "notes": "UCI Cleveland Heart Disease benchmark dataset (DMBI CA2)"
};

export const CLEVELAND_PROFILE: DatasetProfile = {
  "dataset_id": "cleveland-heart",
  "filename": "uci_cleveland_heart_disease.csv",
  "row_count": 303,
  "column_count": 14,
  "total_cells": 4242,
  "missing_cells": 6,
  "missing_percentage": 0.14,
  "duplicate_rows": 0,
  "duplicate_percentage": 0.0,
  "numeric_column_count": 13,
  "categorical_column_count": 1,
  "columns": [
    {
      "name": "age",
      "original_dtype": "float64",
      "inferred_type": "numeric",
      "missing_count": 0,
      "missing_percentage": 0.0,
      "unique_count": 41,
      "sample_values": [
        "63.0",
        "67.0",
        "67.0",
        "37.0",
        "41.0"
      ],
      "suggested_role": "feature",
      "is_constant": false,
      "is_id": false,
      "is_high_missing": false,
      "min_value": 29.0,
      "max_value": 77.0,
      "mean_value": 54.439,
      "std_value": 9.039,
      "median_value": 56.0,
      "skewness": -0.209,
      "top_categories": null
    },
    {
      "name": "sex",
      "original_dtype": "float64",
      "inferred_type": "binary",
      "missing_count": 0,
      "missing_percentage": 0.0,
      "unique_count": 2,
      "sample_values": [
        "1.0",
        "1.0",
        "1.0",
        "1.0",
        "0.0"
      ],
      "suggested_role": "target_candidate",
      "is_constant": false,
      "is_id": false,
      "is_high_missing": false,
      "min_value": 0.0,
      "max_value": 1.0,
      "mean_value": 0.68,
      "std_value": 0.467,
      "median_value": 1.0,
      "skewness": null,
      "top_categories": [
        {
          "category": "1.0",
          "count": 206,
          "percentage": 67.99
        },
        {
          "category": "0.0",
          "count": 97,
          "percentage": 32.01
        }
      ]
    },
    {
      "name": "cp",
      "original_dtype": "float64",
      "inferred_type": "numeric",
      "missing_count": 0,
      "missing_percentage": 0.0,
      "unique_count": 4,
      "sample_values": [
        "1.0",
        "4.0",
        "4.0",
        "3.0",
        "2.0"
      ],
      "suggested_role": "feature",
      "is_constant": false,
      "is_id": false,
      "is_high_missing": false,
      "min_value": 1.0,
      "max_value": 4.0,
      "mean_value": 3.158,
      "std_value": 0.96,
      "median_value": 3.0,
      "skewness": -0.842,
      "top_categories": null
    },
    {
      "name": "trestbps",
      "original_dtype": "float64",
      "inferred_type": "numeric",
      "missing_count": 0,
      "missing_percentage": 0.0,
      "unique_count": 50,
      "sample_values": [
        "145.0",
        "160.0",
        "120.0",
        "130.0",
        "130.0"
      ],
      "suggested_role": "feature",
      "is_constant": false,
      "is_id": false,
      "is_high_missing": false,
      "min_value": 94.0,
      "max_value": 200.0,
      "mean_value": 131.69,
      "std_value": 17.6,
      "median_value": 130.0,
      "skewness": 0.706,
      "top_categories": null
    },
    {
      "name": "chol",
      "original_dtype": "float64",
      "inferred_type": "numeric",
      "missing_count": 0,
      "missing_percentage": 0.0,
      "unique_count": 152,
      "sample_values": [
        "233.0",
        "286.0",
        "229.0",
        "250.0",
        "204.0"
      ],
      "suggested_role": "feature",
      "is_constant": false,
      "is_id": false,
      "is_high_missing": false,
      "min_value": 126.0,
      "max_value": 564.0,
      "mean_value": 246.693,
      "std_value": 51.777,
      "median_value": 241.0,
      "skewness": 1.136,
      "top_categories": null
    },
    {
      "name": "fbs",
      "original_dtype": "float64",
      "inferred_type": "binary",
      "missing_count": 0,
      "missing_percentage": 0.0,
      "unique_count": 2,
      "sample_values": [
        "1.0",
        "0.0",
        "0.0",
        "0.0",
        "0.0"
      ],
      "suggested_role": "target_candidate",
      "is_constant": false,
      "is_id": false,
      "is_high_missing": false,
      "min_value": 0.0,
      "max_value": 1.0,
      "mean_value": 0.149,
      "std_value": 0.356,
      "median_value": 0.0,
      "skewness": null,
      "top_categories": [
        {
          "category": "0.0",
          "count": 258,
          "percentage": 85.15
        },
        {
          "category": "1.0",
          "count": 45,
          "percentage": 14.85
        }
      ]
    },
    {
      "name": "restecg",
      "original_dtype": "float64",
      "inferred_type": "numeric",
      "missing_count": 0,
      "missing_percentage": 0.0,
      "unique_count": 3,
      "sample_values": [
        "2.0",
        "2.0",
        "2.0",
        "0.0",
        "2.0"
      ],
      "suggested_role": "feature",
      "is_constant": false,
      "is_id": false,
      "is_high_missing": false,
      "min_value": 0.0,
      "max_value": 2.0,
      "mean_value": 0.99,
      "std_value": 0.995,
      "median_value": 1.0,
      "skewness": 0.02,
      "top_categories": null
    },
    {
      "name": "thalach",
      "original_dtype": "float64",
      "inferred_type": "numeric",
      "missing_count": 0,
      "missing_percentage": 0.0,
      "unique_count": 91,
      "sample_values": [
        "150.0",
        "108.0",
        "129.0",
        "187.0",
        "172.0"
      ],
      "suggested_role": "feature",
      "is_constant": false,
      "is_id": false,
      "is_high_missing": false,
      "min_value": 71.0,
      "max_value": 202.0,
      "mean_value": 149.607,
      "std_value": 22.875,
      "median_value": 153.0,
      "skewness": -0.537,
      "top_categories": null
    },
    {
      "name": "exang",
      "original_dtype": "float64",
      "inferred_type": "binary",
      "missing_count": 0,
      "missing_percentage": 0.0,
      "unique_count": 2,
      "sample_values": [
        "0.0",
        "1.0",
        "1.0",
        "0.0",
        "0.0"
      ],
      "suggested_role": "target_candidate",
      "is_constant": false,
      "is_id": false,
      "is_high_missing": false,
      "min_value": 0.0,
      "max_value": 1.0,
      "mean_value": 0.327,
      "std_value": 0.47,
      "median_value": 0.0,
      "skewness": null,
      "top_categories": [
        {
          "category": "0.0",
          "count": 204,
          "percentage": 67.33
        },
        {
          "category": "1.0",
          "count": 99,
          "percentage": 32.67
        }
      ]
    },
    {
      "name": "oldpeak",
      "original_dtype": "float64",
      "inferred_type": "numeric",
      "missing_count": 0,
      "missing_percentage": 0.0,
      "unique_count": 40,
      "sample_values": [
        "2.3",
        "1.5",
        "2.6",
        "3.5",
        "1.4"
      ],
      "suggested_role": "feature",
      "is_constant": false,
      "is_id": false,
      "is_high_missing": false,
      "min_value": 0.0,
      "max_value": 6.2,
      "mean_value": 1.04,
      "std_value": 1.161,
      "median_value": 0.8,
      "skewness": 1.27,
      "top_categories": null
    },
    {
      "name": "slope",
      "original_dtype": "float64",
      "inferred_type": "numeric",
      "missing_count": 0,
      "missing_percentage": 0.0,
      "unique_count": 3,
      "sample_values": [
        "3.0",
        "2.0",
        "2.0",
        "3.0",
        "1.0"
      ],
      "suggested_role": "feature",
      "is_constant": false,
      "is_id": false,
      "is_high_missing": false,
      "min_value": 1.0,
      "max_value": 3.0,
      "mean_value": 1.601,
      "std_value": 0.616,
      "median_value": 2.0,
      "skewness": 0.508,
      "top_categories": null
    },
    {
      "name": "ca",
      "original_dtype": "float64",
      "inferred_type": "numeric",
      "missing_count": 4,
      "missing_percentage": 1.32,
      "unique_count": 4,
      "sample_values": [
        "0.0",
        "3.0",
        "2.0",
        "0.0",
        "0.0"
      ],
      "suggested_role": "feature",
      "is_constant": false,
      "is_id": false,
      "is_high_missing": false,
      "min_value": 0.0,
      "max_value": 3.0,
      "mean_value": 0.672,
      "std_value": 0.937,
      "median_value": 0.0,
      "skewness": 1.189,
      "top_categories": null
    },
    {
      "name": "thal",
      "original_dtype": "float64",
      "inferred_type": "numeric",
      "missing_count": 2,
      "missing_percentage": 0.66,
      "unique_count": 3,
      "sample_values": [
        "6.0",
        "3.0",
        "7.0",
        "3.0",
        "3.0"
      ],
      "suggested_role": "feature",
      "is_constant": false,
      "is_id": false,
      "is_high_missing": false,
      "min_value": 3.0,
      "max_value": 7.0,
      "mean_value": 4.734,
      "std_value": 1.94,
      "median_value": 3.0,
      "skewness": 0.244,
      "top_categories": null
    },
    {
      "name": "target",
      "original_dtype": "int64",
      "inferred_type": "categorical",
      "missing_count": 0,
      "missing_percentage": 0.0,
      "unique_count": 5,
      "sample_values": [
        "0",
        "2",
        "1",
        "0",
        "0"
      ],
      "suggested_role": "target_candidate",
      "is_constant": false,
      "is_id": false,
      "is_high_missing": false,
      "min_value": 0.0,
      "max_value": 4.0,
      "mean_value": 0.937,
      "std_value": 1.229,
      "median_value": 0.0,
      "skewness": 1.058,
      "top_categories": [
        {
          "category": "0",
          "count": 164,
          "percentage": 54.13
        },
        {
          "category": "1",
          "count": 55,
          "percentage": 18.15
        },
        {
          "category": "2",
          "count": 36,
          "percentage": 11.88
        },
        {
          "category": "3",
          "count": 35,
          "percentage": 11.55
        },
        {
          "category": "4",
          "count": 13,
          "percentage": 4.29
        }
      ]
    }
  ],
  "preview_rows": [
    {
      "age": "63.0",
      "sex": "1.0",
      "cp": "1.0",
      "trestbps": "145.0",
      "chol": "233.0",
      "fbs": "1.0",
      "restecg": "2.0",
      "thalach": "150.0",
      "exang": "0.0",
      "oldpeak": "2.3",
      "slope": "3.0",
      "ca": "0.0",
      "thal": "6.0",
      "target": "0"
    },
    {
      "age": "67.0",
      "sex": "1.0",
      "cp": "4.0",
      "trestbps": "160.0",
      "chol": "286.0",
      "fbs": "0.0",
      "restecg": "2.0",
      "thalach": "108.0",
      "exang": "1.0",
      "oldpeak": "1.5",
      "slope": "2.0",
      "ca": "3.0",
      "thal": "3.0",
      "target": "2"
    },
    {
      "age": "67.0",
      "sex": "1.0",
      "cp": "4.0",
      "trestbps": "120.0",
      "chol": "229.0",
      "fbs": "0.0",
      "restecg": "2.0",
      "thalach": "129.0",
      "exang": "1.0",
      "oldpeak": "2.6",
      "slope": "2.0",
      "ca": "2.0",
      "thal": "7.0",
      "target": "1"
    },
    {
      "age": "37.0",
      "sex": "1.0",
      "cp": "3.0",
      "trestbps": "130.0",
      "chol": "250.0",
      "fbs": "0.0",
      "restecg": "0.0",
      "thalach": "187.0",
      "exang": "0.0",
      "oldpeak": "3.5",
      "slope": "3.0",
      "ca": "0.0",
      "thal": "3.0",
      "target": "0"
    },
    {
      "age": "41.0",
      "sex": "0.0",
      "cp": "2.0",
      "trestbps": "130.0",
      "chol": "204.0",
      "fbs": "0.0",
      "restecg": "2.0",
      "thalach": "172.0",
      "exang": "0.0",
      "oldpeak": "1.4",
      "slope": "1.0",
      "ca": "0.0",
      "thal": "3.0",
      "target": "0"
    },
    {
      "age": "56.0",
      "sex": "1.0",
      "cp": "2.0",
      "trestbps": "120.0",
      "chol": "236.0",
      "fbs": "0.0",
      "restecg": "0.0",
      "thalach": "178.0",
      "exang": "0.0",
      "oldpeak": "0.8",
      "slope": "1.0",
      "ca": "0.0",
      "thal": "3.0",
      "target": "0"
    },
    {
      "age": "62.0",
      "sex": "0.0",
      "cp": "4.0",
      "trestbps": "140.0",
      "chol": "268.0",
      "fbs": "0.0",
      "restecg": "2.0",
      "thalach": "160.0",
      "exang": "0.0",
      "oldpeak": "3.6",
      "slope": "3.0",
      "ca": "2.0",
      "thal": "3.0",
      "target": "3"
    },
    {
      "age": "57.0",
      "sex": "0.0",
      "cp": "4.0",
      "trestbps": "120.0",
      "chol": "354.0",
      "fbs": "0.0",
      "restecg": "0.0",
      "thalach": "163.0",
      "exang": "1.0",
      "oldpeak": "0.6",
      "slope": "1.0",
      "ca": "0.0",
      "thal": "3.0",
      "target": "0"
    },
    {
      "age": "63.0",
      "sex": "1.0",
      "cp": "4.0",
      "trestbps": "130.0",
      "chol": "254.0",
      "fbs": "0.0",
      "restecg": "2.0",
      "thalach": "147.0",
      "exang": "0.0",
      "oldpeak": "1.4",
      "slope": "2.0",
      "ca": "1.0",
      "thal": "7.0",
      "target": "2"
    },
    {
      "age": "53.0",
      "sex": "1.0",
      "cp": "4.0",
      "trestbps": "140.0",
      "chol": "203.0",
      "fbs": "1.0",
      "restecg": "2.0",
      "thalach": "155.0",
      "exang": "1.0",
      "oldpeak": "3.1",
      "slope": "3.0",
      "ca": "0.0",
      "thal": "7.0",
      "target": "1"
    },
    {
      "age": "57.0",
      "sex": "1.0",
      "cp": "4.0",
      "trestbps": "140.0",
      "chol": "192.0",
      "fbs": "0.0",
      "restecg": "0.0",
      "thalach": "148.0",
      "exang": "0.0",
      "oldpeak": "0.4",
      "slope": "2.0",
      "ca": "0.0",
      "thal": "6.0",
      "target": "0"
    },
    {
      "age": "56.0",
      "sex": "0.0",
      "cp": "2.0",
      "trestbps": "140.0",
      "chol": "294.0",
      "fbs": "0.0",
      "restecg": "2.0",
      "thalach": "153.0",
      "exang": "0.0",
      "oldpeak": "1.3",
      "slope": "2.0",
      "ca": "0.0",
      "thal": "3.0",
      "target": "0"
    },
    {
      "age": "56.0",
      "sex": "1.0",
      "cp": "3.0",
      "trestbps": "130.0",
      "chol": "256.0",
      "fbs": "1.0",
      "restecg": "2.0",
      "thalach": "142.0",
      "exang": "1.0",
      "oldpeak": "0.6",
      "slope": "2.0",
      "ca": "1.0",
      "thal": "6.0",
      "target": "2"
    },
    {
      "age": "44.0",
      "sex": "1.0",
      "cp": "2.0",
      "trestbps": "120.0",
      "chol": "263.0",
      "fbs": "0.0",
      "restecg": "0.0",
      "thalach": "173.0",
      "exang": "0.0",
      "oldpeak": "0.0",
      "slope": "1.0",
      "ca": "0.0",
      "thal": "7.0",
      "target": "0"
    },
    {
      "age": "52.0",
      "sex": "1.0",
      "cp": "3.0",
      "trestbps": "172.0",
      "chol": "199.0",
      "fbs": "1.0",
      "restecg": "0.0",
      "thalach": "162.0",
      "exang": "0.0",
      "oldpeak": "0.5",
      "slope": "1.0",
      "ca": "0.0",
      "thal": "7.0",
      "target": "0"
    },
    {
      "age": "57.0",
      "sex": "1.0",
      "cp": "3.0",
      "trestbps": "150.0",
      "chol": "168.0",
      "fbs": "0.0",
      "restecg": "0.0",
      "thalach": "174.0",
      "exang": "0.0",
      "oldpeak": "1.6",
      "slope": "1.0",
      "ca": "0.0",
      "thal": "3.0",
      "target": "0"
    },
    {
      "age": "48.0",
      "sex": "1.0",
      "cp": "2.0",
      "trestbps": "110.0",
      "chol": "229.0",
      "fbs": "0.0",
      "restecg": "0.0",
      "thalach": "168.0",
      "exang": "0.0",
      "oldpeak": "1.0",
      "slope": "3.0",
      "ca": "0.0",
      "thal": "7.0",
      "target": "1"
    },
    {
      "age": "54.0",
      "sex": "1.0",
      "cp": "4.0",
      "trestbps": "140.0",
      "chol": "239.0",
      "fbs": "0.0",
      "restecg": "0.0",
      "thalach": "160.0",
      "exang": "0.0",
      "oldpeak": "1.2",
      "slope": "1.0",
      "ca": "0.0",
      "thal": "3.0",
      "target": "0"
    },
    {
      "age": "48.0",
      "sex": "0.0",
      "cp": "3.0",
      "trestbps": "130.0",
      "chol": "275.0",
      "fbs": "0.0",
      "restecg": "0.0",
      "thalach": "139.0",
      "exang": "0.0",
      "oldpeak": "0.2",
      "slope": "1.0",
      "ca": "0.0",
      "thal": "3.0",
      "target": "0"
    },
    {
      "age": "49.0",
      "sex": "1.0",
      "cp": "2.0",
      "trestbps": "130.0",
      "chol": "266.0",
      "fbs": "0.0",
      "restecg": "0.0",
      "thalach": "171.0",
      "exang": "0.0",
      "oldpeak": "0.6",
      "slope": "1.0",
      "ca": "0.0",
      "thal": "3.0",
      "target": "0"
    },
    {
      "age": "64.0",
      "sex": "1.0",
      "cp": "1.0",
      "trestbps": "110.0",
      "chol": "211.0",
      "fbs": "0.0",
      "restecg": "2.0",
      "thalach": "144.0",
      "exang": "1.0",
      "oldpeak": "1.8",
      "slope": "2.0",
      "ca": "0.0",
      "thal": "3.0",
      "target": "0"
    },
    {
      "age": "58.0",
      "sex": "0.0",
      "cp": "1.0",
      "trestbps": "150.0",
      "chol": "283.0",
      "fbs": "1.0",
      "restecg": "2.0",
      "thalach": "162.0",
      "exang": "0.0",
      "oldpeak": "1.0",
      "slope": "1.0",
      "ca": "0.0",
      "thal": "3.0",
      "target": "0"
    },
    {
      "age": "58.0",
      "sex": "1.0",
      "cp": "2.0",
      "trestbps": "120.0",
      "chol": "284.0",
      "fbs": "0.0",
      "restecg": "2.0",
      "thalach": "160.0",
      "exang": "0.0",
      "oldpeak": "1.8",
      "slope": "2.0",
      "ca": "0.0",
      "thal": "3.0",
      "target": "1"
    },
    {
      "age": "58.0",
      "sex": "1.0",
      "cp": "3.0",
      "trestbps": "132.0",
      "chol": "224.0",
      "fbs": "0.0",
      "restecg": "2.0",
      "thalach": "173.0",
      "exang": "0.0",
      "oldpeak": "3.2",
      "slope": "1.0",
      "ca": "2.0",
      "thal": "7.0",
      "target": "3"
    },
    {
      "age": "60.0",
      "sex": "1.0",
      "cp": "4.0",
      "trestbps": "130.0",
      "chol": "206.0",
      "fbs": "0.0",
      "restecg": "2.0",
      "thalach": "132.0",
      "exang": "1.0",
      "oldpeak": "2.4",
      "slope": "2.0",
      "ca": "2.0",
      "thal": "7.0",
      "target": "4"
    },
    {
      "age": "50.0",
      "sex": "0.0",
      "cp": "3.0",
      "trestbps": "120.0",
      "chol": "219.0",
      "fbs": "0.0",
      "restecg": "0.0",
      "thalach": "158.0",
      "exang": "0.0",
      "oldpeak": "1.6",
      "slope": "2.0",
      "ca": "0.0",
      "thal": "3.0",
      "target": "0"
    },
    {
      "age": "58.0",
      "sex": "0.0",
      "cp": "3.0",
      "trestbps": "120.0",
      "chol": "340.0",
      "fbs": "0.0",
      "restecg": "0.0",
      "thalach": "172.0",
      "exang": "0.0",
      "oldpeak": "0.0",
      "slope": "1.0",
      "ca": "0.0",
      "thal": "3.0",
      "target": "0"
    },
    {
      "age": "66.0",
      "sex": "0.0",
      "cp": "1.0",
      "trestbps": "150.0",
      "chol": "226.0",
      "fbs": "0.0",
      "restecg": "0.0",
      "thalach": "114.0",
      "exang": "0.0",
      "oldpeak": "2.6",
      "slope": "3.0",
      "ca": "0.0",
      "thal": "3.0",
      "target": "0"
    },
    {
      "age": "43.0",
      "sex": "1.0",
      "cp": "4.0",
      "trestbps": "150.0",
      "chol": "247.0",
      "fbs": "0.0",
      "restecg": "0.0",
      "thalach": "171.0",
      "exang": "0.0",
      "oldpeak": "1.5",
      "slope": "1.0",
      "ca": "0.0",
      "thal": "3.0",
      "target": "0"
    },
    {
      "age": "40.0",
      "sex": "1.0",
      "cp": "4.0",
      "trestbps": "110.0",
      "chol": "167.0",
      "fbs": "0.0",
      "restecg": "2.0",
      "thalach": "114.0",
      "exang": "1.0",
      "oldpeak": "2.0",
      "slope": "2.0",
      "ca": "0.0",
      "thal": "7.0",
      "target": "3"
    },
    {
      "age": "69.0",
      "sex": "0.0",
      "cp": "1.0",
      "trestbps": "140.0",
      "chol": "239.0",
      "fbs": "0.0",
      "restecg": "0.0",
      "thalach": "151.0",
      "exang": "0.0",
      "oldpeak": "1.8",
      "slope": "1.0",
      "ca": "2.0",
      "thal": "3.0",
      "target": "0"
    },
    {
      "age": "60.0",
      "sex": "1.0",
      "cp": "4.0",
      "trestbps": "117.0",
      "chol": "230.0",
      "fbs": "1.0",
      "restecg": "0.0",
      "thalach": "160.0",
      "exang": "1.0",
      "oldpeak": "1.4",
      "slope": "1.0",
      "ca": "2.0",
      "thal": "7.0",
      "target": "2"
    },
    {
      "age": "64.0",
      "sex": "1.0",
      "cp": "3.0",
      "trestbps": "140.0",
      "chol": "335.0",
      "fbs": "0.0",
      "restecg": "0.0",
      "thalach": "158.0",
      "exang": "0.0",
      "oldpeak": "0.0",
      "slope": "1.0",
      "ca": "0.0",
      "thal": "3.0",
      "target": "1"
    },
    {
      "age": "59.0",
      "sex": "1.0",
      "cp": "4.0",
      "trestbps": "135.0",
      "chol": "234.0",
      "fbs": "0.0",
      "restecg": "0.0",
      "thalach": "161.0",
      "exang": "0.0",
      "oldpeak": "0.5",
      "slope": "2.0",
      "ca": "0.0",
      "thal": "7.0",
      "target": "0"
    },
    {
      "age": "44.0",
      "sex": "1.0",
      "cp": "3.0",
      "trestbps": "130.0",
      "chol": "233.0",
      "fbs": "0.0",
      "restecg": "0.0",
      "thalach": "179.0",
      "exang": "1.0",
      "oldpeak": "0.4",
      "slope": "1.0",
      "ca": "0.0",
      "thal": "3.0",
      "target": "0"
    },
    {
      "age": "42.0",
      "sex": "1.0",
      "cp": "4.0",
      "trestbps": "140.0",
      "chol": "226.0",
      "fbs": "0.0",
      "restecg": "0.0",
      "thalach": "178.0",
      "exang": "0.0",
      "oldpeak": "0.0",
      "slope": "1.0",
      "ca": "0.0",
      "thal": "3.0",
      "target": "0"
    },
    {
      "age": "43.0",
      "sex": "1.0",
      "cp": "4.0",
      "trestbps": "120.0",
      "chol": "177.0",
      "fbs": "0.0",
      "restecg": "2.0",
      "thalach": "120.0",
      "exang": "1.0",
      "oldpeak": "2.5",
      "slope": "2.0",
      "ca": "0.0",
      "thal": "7.0",
      "target": "3"
    },
    {
      "age": "57.0",
      "sex": "1.0",
      "cp": "4.0",
      "trestbps": "150.0",
      "chol": "276.0",
      "fbs": "0.0",
      "restecg": "2.0",
      "thalach": "112.0",
      "exang": "1.0",
      "oldpeak": "0.6",
      "slope": "2.0",
      "ca": "1.0",
      "thal": "6.0",
      "target": "1"
    },
    {
      "age": "55.0",
      "sex": "1.0",
      "cp": "4.0",
      "trestbps": "132.0",
      "chol": "353.0",
      "fbs": "0.0",
      "restecg": "0.0",
      "thalach": "132.0",
      "exang": "1.0",
      "oldpeak": "1.2",
      "slope": "2.0",
      "ca": "1.0",
      "thal": "7.0",
      "target": "3"
    },
    {
      "age": "61.0",
      "sex": "1.0",
      "cp": "3.0",
      "trestbps": "150.0",
      "chol": "243.0",
      "fbs": "1.0",
      "restecg": "0.0",
      "thalach": "137.0",
      "exang": "1.0",
      "oldpeak": "1.0",
      "slope": "2.0",
      "ca": "0.0",
      "thal": "3.0",
      "target": "0"
    },
    {
      "age": "65.0",
      "sex": "0.0",
      "cp": "4.0",
      "trestbps": "150.0",
      "chol": "225.0",
      "fbs": "0.0",
      "restecg": "2.0",
      "thalach": "114.0",
      "exang": "0.0",
      "oldpeak": "1.0",
      "slope": "2.0",
      "ca": "3.0",
      "thal": "7.0",
      "target": "4"
    },
    {
      "age": "40.0",
      "sex": "1.0",
      "cp": "1.0",
      "trestbps": "140.0",
      "chol": "199.0",
      "fbs": "0.0",
      "restecg": "0.0",
      "thalach": "178.0",
      "exang": "1.0",
      "oldpeak": "1.4",
      "slope": "1.0",
      "ca": "0.0",
      "thal": "7.0",
      "target": "0"
    },
    {
      "age": "71.0",
      "sex": "0.0",
      "cp": "2.0",
      "trestbps": "160.0",
      "chol": "302.0",
      "fbs": "0.0",
      "restecg": "0.0",
      "thalach": "162.0",
      "exang": "0.0",
      "oldpeak": "0.4",
      "slope": "1.0",
      "ca": "2.0",
      "thal": "3.0",
      "target": "0"
    },
    {
      "age": "59.0",
      "sex": "1.0",
      "cp": "3.0",
      "trestbps": "150.0",
      "chol": "212.0",
      "fbs": "1.0",
      "restecg": "0.0",
      "thalach": "157.0",
      "exang": "0.0",
      "oldpeak": "1.6",
      "slope": "1.0",
      "ca": "0.0",
      "thal": "3.0",
      "target": "0"
    },
    {
      "age": "61.0",
      "sex": "0.0",
      "cp": "4.0",
      "trestbps": "130.0",
      "chol": "330.0",
      "fbs": "0.0",
      "restecg": "2.0",
      "thalach": "169.0",
      "exang": "0.0",
      "oldpeak": "0.0",
      "slope": "1.0",
      "ca": "0.0",
      "thal": "3.0",
      "target": "1"
    },
    {
      "age": "58.0",
      "sex": "1.0",
      "cp": "3.0",
      "trestbps": "112.0",
      "chol": "230.0",
      "fbs": "0.0",
      "restecg": "2.0",
      "thalach": "165.0",
      "exang": "0.0",
      "oldpeak": "2.5",
      "slope": "2.0",
      "ca": "1.0",
      "thal": "7.0",
      "target": "4"
    },
    {
      "age": "51.0",
      "sex": "1.0",
      "cp": "3.0",
      "trestbps": "110.0",
      "chol": "175.0",
      "fbs": "0.0",
      "restecg": "0.0",
      "thalach": "123.0",
      "exang": "0.0",
      "oldpeak": "0.6",
      "slope": "1.0",
      "ca": "0.0",
      "thal": "3.0",
      "target": "0"
    },
    {
      "age": "50.0",
      "sex": "1.0",
      "cp": "4.0",
      "trestbps": "150.0",
      "chol": "243.0",
      "fbs": "0.0",
      "restecg": "2.0",
      "thalach": "128.0",
      "exang": "0.0",
      "oldpeak": "2.6",
      "slope": "2.0",
      "ca": "0.0",
      "thal": "7.0",
      "target": "4"
    },
    {
      "age": "65.0",
      "sex": "0.0",
      "cp": "3.0",
      "trestbps": "140.0",
      "chol": "417.0",
      "fbs": "1.0",
      "restecg": "2.0",
      "thalach": "157.0",
      "exang": "0.0",
      "oldpeak": "0.8",
      "slope": "1.0",
      "ca": "1.0",
      "thal": "3.0",
      "target": "0"
    },
    {
      "age": "53.0",
      "sex": "1.0",
      "cp": "3.0",
      "trestbps": "130.0",
      "chol": "197.0",
      "fbs": "1.0",
      "restecg": "2.0",
      "thalach": "152.0",
      "exang": "0.0",
      "oldpeak": "1.2",
      "slope": "3.0",
      "ca": "0.0",
      "thal": "3.0",
      "target": "0"
    }
  ],
  "correlation_matrix": {
    "columns": [
      "age",
      "cp",
      "trestbps",
      "chol",
      "restecg",
      "thalach",
      "oldpeak",
      "slope",
      "ca",
      "thal"
    ],
    "matrix": [
      [
        1.0,
        0.11,
        0.29,
        0.203,
        0.15,
        -0.395,
        0.197,
        0.159,
        0.362,
        0.127
      ],
      [
        0.11,
        1.0,
        -0.037,
        0.072,
        0.064,
        -0.339,
        0.203,
        0.151,
        0.236,
        0.268
      ],
      [
        0.29,
        -0.037,
        1.0,
        0.132,
        0.149,
        -0.049,
        0.191,
        0.121,
        0.098,
        0.138
      ],
      [
        0.203,
        0.072,
        0.132,
        1.0,
        0.165,
        -0.0,
        0.039,
        -0.009,
        0.116,
        0.011
      ],
      [
        0.15,
        0.064,
        0.149,
        0.165,
        1.0,
        -0.072,
        0.114,
        0.135,
        0.129,
        0.019
      ],
      [
        -0.395,
        -0.339,
        -0.049,
        -0.0,
        -0.072,
        1.0,
        -0.348,
        -0.389,
        -0.269,
        -0.275
      ],
      [
        0.197,
        0.203,
        0.191,
        0.039,
        0.114,
        -0.348,
        1.0,
        0.579,
        0.294,
        0.345
      ],
      [
        0.159,
        0.151,
        0.121,
        -0.009,
        0.135,
        -0.389,
        0.579,
        1.0,
        0.11,
        0.28
      ],
      [
        0.362,
        0.236,
        0.098,
        0.116,
        0.129,
        -0.269,
        0.294,
        0.11,
        1.0,
        0.256
      ],
      [
        0.127,
        0.268,
        0.138,
        0.011,
        0.019,
        -0.275,
        0.345,
        0.28,
        0.256,
        1.0
      ]
    ]
  },
  "outliers": [
    {
      "column": "trestbps",
      "outlier_count": 9,
      "outlier_percentage": 2.97,
      "lower_bound": 90.0,
      "upper_bound": 170.0,
      "outlier_values": [
        172.0,
        180.0,
        200.0,
        174.0,
        178.0,
        192.0,
        180.0,
        178.0,
        180.0
      ]
    },
    {
      "column": "chol",
      "outlier_count": 5,
      "outlier_percentage": 1.65,
      "lower_bound": 115.0,
      "upper_bound": 371.0,
      "outlier_values": [
        417.0,
        407.0,
        564.0,
        394.0,
        409.0
      ]
    },
    {
      "column": "thalach",
      "outlier_count": 1,
      "outlier_percentage": 0.33,
      "lower_bound": 84.75,
      "upper_bound": 214.75,
      "outlier_values": [
        71.0
      ]
    },
    {
      "column": "oldpeak",
      "outlier_count": 5,
      "outlier_percentage": 1.65,
      "lower_bound": -2.4,
      "upper_bound": 4.0,
      "outlier_values": [
        6.2,
        5.6,
        4.2,
        4.2,
        4.4
      ]
    }
  ],
  "warnings": [],
  "is_cleveland_heart_disease": true
};

export const CLEVELAND_RECOMMENDATIONS: RecommendationsResponse = {
  "dataset_id": "cleveland-heart",
  "recommendations": [
    {
      "task_type": "eda",
      "title": "Exploratory Clinical Data Analysis",
      "is_recommended": true,
      "confidence": "high",
      "reason": "Always essential before statistical modeling. Current dataset has 303 patient records and 14 attributes with 0.14% missing values.",
      "candidate_targets": [],
      "candidate_features": [
        "age",
        "sex",
        "cp",
        "trestbps",
        "chol",
        "fbs",
        "restecg",
        "thalach",
        "exang",
        "oldpeak"
      ],
      "suggested_models": [
        "Summary Statistics",
        "Outlier Screening (IQR)",
        "Correlation Matrix",
        "Cohort Stratification"
      ]
    },
    {
      "task_type": "classification",
      "title": "Supervised Classification (Disease Prediction)",
      "is_recommended": true,
      "confidence": "high",
      "reason": "Found 9 suitable discrete/categorical outcome candidates (e.g., 'sex'). Allows predicting clinical diagnosis, presence/absence of disease, or risk stratum.",
      "candidate_targets": [
        "sex",
        "cp",
        "fbs",
        "restecg",
        "exang",
        "slope",
        "ca",
        "thal",
        "target"
      ],
      "candidate_features": [
        "age",
        "trestbps",
        "chol",
        "thalach",
        "oldpeak"
      ],
      "suggested_models": [
        "Logistic Regression",
        "Decision Tree Classifier",
        "Random Forest Classifier"
      ]
    },
    {
      "task_type": "regression",
      "title": "Supervised Regression (Quantitative Estimation)",
      "is_recommended": true,
      "confidence": "moderate",
      "reason": "Found continuous clinical parameters (e.g., 'age') with sufficient numeric variance. Suitable for estimating quantitative physiological measures (blood pressure, cholesterol, recovery index).",
      "candidate_targets": [
        "age",
        "trestbps",
        "chol",
        "thalach",
        "oldpeak"
      ],
      "candidate_features": [
        "sex",
        "cp",
        "fbs",
        "restecg",
        "exang",
        "slope",
        "ca",
        "thal"
      ],
      "suggested_models": [
        "Linear Regression",
        "Decision Tree Regressor",
        "Random Forest Regressor"
      ]
    },
    {
      "task_type": "clustering",
      "title": "Unsupervised Patient Clustering (Phenotyping)",
      "is_recommended": true,
      "confidence": "moderate",
      "reason": "Unsupervised discovery of latent patient subgroups or phenotypic clusters across 13 numeric markers. Useful when diagnostic ground truth is unavailable or when seeking novel disease sub-types.",
      "candidate_targets": [],
      "candidate_features": [
        "age",
        "sex",
        "cp",
        "trestbps",
        "chol",
        "fbs",
        "restecg",
        "thalach",
        "exang",
        "oldpeak"
      ],
      "suggested_models": [
        "K-Means Clustering",
        "Hierarchical Agglomerative Clustering"
      ]
    },
    {
      "task_type": "association",
      "title": "Clinical Cohort & Association Analysis",
      "is_recommended": true,
      "confidence": "moderate",
      "reason": "Discretize continuous markers (e.g., age cohorts, blood pressure tiers) to evaluate clinical co-occurrence patterns and risk rates.",
      "candidate_targets": [],
      "candidate_features": [
        "sex",
        "fbs",
        "exang",
        "target",
        "age",
        "sex",
        "cp",
        "trestbps"
      ],
      "suggested_models": [
        "Age-Cohort Prevalence Analysis",
        "Clinical Risk Stratification"
      ]
    }
  ],
  "inferred_domain": "Cardiovascular / Cardiology"
};

export const CLEVELAND_ANALYSIS: AnalysisResponse = {
  "analysis_id": "2837a64b",
  "dataset_id": "cleveland-heart",
  "task_type": "classification",
  "target_column": "target",
  "created_at": "2026-10-28T17:28:19.783857+00:00",
  "dataset_summary": {
    "total_records": 303,
    "usable_records": 303,
    "train_samples": 242,
    "test_samples": 61,
    "original_features": 13,
    "engineered_features": 13,
    "numeric_features": [
      "age",
      "sex",
      "cp",
      "trestbps",
      "chol",
      "fbs",
      "restecg",
      "thalach",
      "exang",
      "oldpeak",
      "slope",
      "ca",
      "thal"
    ],
    "categorical_features": [],
    "dropped_constant_features": [],
    "dropped_identifiers": [],
    "class_balance": {
      "0": 131,
      "1": 111
    },
    "scaler_applied": "standard"
  },
  "model_results": {
    "Logistic Regression": {
      "model_name": "Logistic Regression",
      "training_time_ms": 1.79,
      "metrics": {
        "Accuracy": 0.8688524590163934,
        "Precision": 0.8125,
        "Recall": 0.9285714285714286,
        "F1-score": 0.8666666666666667,
        "ROC-AUC": 0.9512987012987013
      },
      "formatted_metrics": {
        "Accuracy": "0.8689",
        "Precision": "0.8125",
        "Recall": "0.9286",
        "F1-score": "0.8667",
        "ROC-AUC": "0.9513"
      },
      "confusion_matrix": {
        "labels": [
          "Absence (0)",
          "Presence (1)"
        ],
        "matrix": [
          [
            27,
            6
          ],
          [
            2,
            26
          ]
        ]
      },
      "roc_curve": [
        {
          "x": 0.0,
          "y": 0.0
        },
        {
          "x": 0.0,
          "y": 0.0357
        },
        {
          "x": 0.0,
          "y": 0.1786
        },
        {
          "x": 0.0303,
          "y": 0.1786
        },
        {
          "x": 0.0303,
          "y": 0.7857
        },
        {
          "x": 0.0606,
          "y": 0.7857
        },
        {
          "x": 0.0606,
          "y": 0.8929
        },
        {
          "x": 0.1515,
          "y": 0.8929
        },
        {
          "x": 0.1515,
          "y": 0.9286
        },
        {
          "x": 0.2121,
          "y": 0.9286
        },
        {
          "x": 0.2121,
          "y": 0.9643
        },
        {
          "x": 0.303,
          "y": 0.9643
        },
        {
          "x": 0.303,
          "y": 1.0
        },
        {
          "x": 1.0,
          "y": 1.0
        }
      ],
      "pr_curve": [
        {
          "x": 1.0,
          "y": 0.459
        },
        {
          "x": 1.0,
          "y": 0.4746
        },
        {
          "x": 1.0,
          "y": 0.4912
        },
        {
          "x": 1.0,
          "y": 0.5091
        },
        {
          "x": 1.0,
          "y": 0.5283
        },
        {
          "x": 1.0,
          "y": 0.549
        },
        {
          "x": 1.0,
          "y": 0.5714
        },
        {
          "x": 1.0,
          "y": 0.5957
        },
        {
          "x": 1.0,
          "y": 0.6222
        },
        {
          "x": 1.0,
          "y": 0.6512
        },
        {
          "x": 1.0,
          "y": 0.6829
        },
        {
          "x": 1.0,
          "y": 0.7179
        },
        {
          "x": 0.9643,
          "y": 0.7297
        },
        {
          "x": 0.9643,
          "y": 0.7714
        },
        {
          "x": 0.9286,
          "y": 0.7879
        },
        {
          "x": 0.9286,
          "y": 0.8387
        },
        {
          "x": 0.8929,
          "y": 0.8621
        },
        {
          "x": 0.8929,
          "y": 0.9259
        },
        {
          "x": 0.8214,
          "y": 0.92
        },
        {
          "x": 0.7857,
          "y": 0.9565
        },
        {
          "x": 0.7143,
          "y": 0.9524
        },
        {
          "x": 0.6429,
          "y": 0.9474
        },
        {
          "x": 0.5714,
          "y": 0.9412
        },
        {
          "x": 0.5,
          "y": 0.9333
        },
        {
          "x": 0.4286,
          "y": 0.9231
        },
        {
          "x": 0.3571,
          "y": 0.9091
        },
        {
          "x": 0.2857,
          "y": 0.8889
        },
        {
          "x": 0.2143,
          "y": 0.8571
        },
        {
          "x": 0.1786,
          "y": 1.0
        },
        {
          "x": 0.1071,
          "y": 1.0
        },
        {
          "x": 0.0357,
          "y": 1.0
        }
      ],
      "roc_auc": 0.9512987012987013,
      "feature_importances": [
        {
          "feature": "ca",
          "importance": 1.1079
        },
        {
          "feature": "thal",
          "importance": 0.6778
        },
        {
          "feature": "sex",
          "importance": 0.6556
        },
        {
          "feature": "cp",
          "importance": 0.5435
        },
        {
          "feature": "exang",
          "importance": 0.3836
        },
        {
          "feature": "slope",
          "importance": 0.3541
        },
        {
          "feature": "thalach",
          "importance": 0.3485
        },
        {
          "feature": "trestbps",
          "importance": 0.3137
        },
        {
          "feature": "fbs",
          "importance": 0.2206
        },
        {
          "feature": "restecg",
          "importance": 0.2173
        },
        {
          "feature": "chol",
          "importance": 0.2154
        },
        {
          "feature": "oldpeak",
          "importance": 0.15
        },
        {
          "feature": "age",
          "importance": 0.1032
        }
      ],
      "tree_rules": null,
      "cluster_labels": null,
      "cluster_centers": null,
      "pca_2d": null,
      "threshold_analysis": {
        "default_threshold": 0.5,
        "optimal_threshold": 0.536,
        "goal_precision": 0.8,
        "adjusted_precision": 0.8125,
        "adjusted_recall": 0.9286,
        "adjusted_f1": 0.8667,
        "confusion_matrix": [
          [
            27,
            6
          ],
          [
            2,
            26
          ]
        ],
        "clinical_rationale": "Calibrated decision boundary to tau=0.536 to prioritize clinical sensitivity (Recall: 92.9%) while preserving target precision."
      },
      "warnings": []
    },
    "Decision Tree": {
      "model_name": "Decision Tree",
      "training_time_ms": 0.56,
      "metrics": {
        "Accuracy": 0.7868852459016393,
        "Precision": 0.7419354838709677,
        "Recall": 0.8214285714285714,
        "F1-score": 0.7796610169491526,
        "ROC-AUC": 0.8598484848484849
      },
      "formatted_metrics": {
        "Accuracy": "0.7869",
        "Precision": "0.7419",
        "Recall": "0.8214",
        "F1-score": "0.7797",
        "ROC-AUC": "0.8598"
      },
      "confusion_matrix": {
        "labels": [
          "Absence (0)",
          "Presence (1)"
        ],
        "matrix": [
          [
            25,
            8
          ],
          [
            5,
            23
          ]
        ]
      },
      "roc_curve": [
        {
          "x": 0.0,
          "y": 0.0
        },
        {
          "x": 0.1212,
          "y": 0.5357
        },
        {
          "x": 0.1212,
          "y": 0.6429
        },
        {
          "x": 0.1515,
          "y": 0.7857
        },
        {
          "x": 0.2424,
          "y": 0.8214
        },
        {
          "x": 0.303,
          "y": 0.8214
        },
        {
          "x": 0.303,
          "y": 0.8571
        },
        {
          "x": 0.3333,
          "y": 0.9286
        },
        {
          "x": 0.4545,
          "y": 0.9286
        },
        {
          "x": 0.5152,
          "y": 1.0
        },
        {
          "x": 0.5758,
          "y": 1.0
        },
        {
          "x": 1.0,
          "y": 1.0
        }
      ],
      "pr_curve": [
        {
          "x": 1.0,
          "y": 0.459
        },
        {
          "x": 1.0,
          "y": 0.5957
        },
        {
          "x": 1.0,
          "y": 0.6222
        },
        {
          "x": 0.9286,
          "y": 0.6341
        },
        {
          "x": 0.9286,
          "y": 0.7027
        },
        {
          "x": 0.8571,
          "y": 0.7059
        },
        {
          "x": 0.8214,
          "y": 0.697
        },
        {
          "x": 0.8214,
          "y": 0.7419
        },
        {
          "x": 0.7857,
          "y": 0.8148
        },
        {
          "x": 0.6429,
          "y": 0.8182
        },
        {
          "x": 0.5357,
          "y": 0.7895
        },
        {
          "x": 0.0,
          "y": 1.0
        }
      ],
      "roc_auc": 0.8598484848484849,
      "feature_importances": [
        {
          "feature": "thal",
          "importance": 0.4458
        },
        {
          "feature": "cp",
          "importance": 0.1598
        },
        {
          "feature": "ca",
          "importance": 0.139
        },
        {
          "feature": "oldpeak",
          "importance": 0.0783
        },
        {
          "feature": "chol",
          "importance": 0.0708
        },
        {
          "feature": "sex",
          "importance": 0.0311
        },
        {
          "feature": "age",
          "importance": 0.0274
        },
        {
          "feature": "slope",
          "importance": 0.0244
        },
        {
          "feature": "thalach",
          "importance": 0.0234
        },
        {
          "feature": "exang",
          "importance": 0.0
        },
        {
          "feature": "restecg",
          "importance": 0.0
        },
        {
          "feature": "fbs",
          "importance": 0.0
        },
        {
          "feature": "trestbps",
          "importance": 0.0
        }
      ],
      "tree_rules": {
        "node_id": 0,
        "samples": 242,
        "impurity": 0.4966,
        "distribution": [
          0,
          0
        ],
        "prediction": "Absence (0)",
        "is_leaf": false,
        "rule": "thal <= -0.106",
        "feature": "thal",
        "threshold": -0.106,
        "left": {
          "node_id": 1,
          "samples": 136,
          "impurity": 0.3439,
          "distribution": [
            0,
            0
          ],
          "prediction": "Absence (0)",
          "is_leaf": false,
          "rule": "ca <= -0.122",
          "feature": "ca",
          "threshold": -0.122,
          "left": {
            "node_id": 2,
            "samples": 97,
            "impurity": 0.2011,
            "distribution": [
              0,
              0
            ],
            "prediction": "Absence (0)",
            "is_leaf": false,
            "rule": "age <= 0.329",
            "feature": "age",
            "threshold": 0.329,
            "left": {
              "node_id": 3,
              "samples": 68,
              "impurity": 0.0843,
              "distribution": [
                0,
                0
              ],
              "prediction": "Absence (0)",
              "is_leaf": false,
              "rule": "oldpeak <= 2.053",
              "feature": "oldpeak",
              "threshold": 2.053,
              "left": null,
              "right": null
            },
            "right": {
              "node_id": 6,
              "samples": 29,
              "impurity": 0.3995,
              "distribution": [
                0,
                0
              ],
              "prediction": "Absence (0)",
              "is_leaf": false,
              "rule": "chol <= 0.401",
              "feature": "chol",
              "threshold": 0.401,
              "left": null,
              "right": null
            }
          },
          "right": {
            "node_id": 9,
            "samples": 39,
            "impurity": 0.4997,
            "distribution": [
              0,
              0
            ],
            "prediction": "Absence (0)",
            "is_leaf": false,
            "rule": "cp <= 0.357",
            "feature": "cp",
            "threshold": 0.357,
            "left": {
              "node_id": 10,
              "samples": 23,
              "impurity": 0.3856,
              "distribution": [
                0,
                0
              ],
              "prediction": "Absence (0)",
              "is_leaf": false,
              "rule": "chol <= -0.234",
              "feature": "chol",
              "threshold": -0.234,
              "left": null,
              "right": null
            },
            "right": {
              "node_id": 13,
              "samples": 16,
              "impurity": 0.3047,
              "distribution": [
                0,
                0
              ],
              "prediction": "Presence (1)",
              "is_leaf": false,
              "rule": "sex <= -0.39",
              "feature": "sex",
              "threshold": -0.39,
              "left": null,
              "right": null
            }
          }
        },
        "right": {
          "node_id": 16,
          "samples": 106,
          "impurity": 0.3604,
          "distribution": [
            0,
            0
          ],
          "prediction": "Presence (1)",
          "is_leaf": false,
          "rule": "cp <= 0.357",
          "feature": "cp",
          "threshold": 0.357,
          "left": {
            "node_id": 17,
            "samples": 34,
            "impurity": 0.5,
            "distribution": [
              0,
              0
            ],
            "prediction": "Absence (0)",
            "is_leaf": false,
            "rule": "ca <= -0.122",
            "feature": "ca",
            "threshold": -0.122,
            "left": {
              "node_id": 18,
              "samples": 23,
              "impurity": 0.4537,
              "distribution": [
                0,
                0
              ],
              "prediction": "Absence (0)",
              "is_leaf": false,
              "rule": "thalach <= -0.771",
              "feature": "thalach",
              "threshold": -0.771,
              "left": null,
              "right": null
            },
            "right": {
              "node_id": 21,
              "samples": 11,
              "impurity": 0.2975,
              "distribution": [
                0,
                0
              ],
              "prediction": "Presence (1)",
              "is_leaf": false,
              "rule": "slope <= -0.142",
              "feature": "slope",
              "threshold": -0.142,
              "left": null,
              "right": null
            }
          },
          "right": {
            "node_id": 24,
            "samples": 72,
            "impurity": 0.1975,
            "distribution": [
              0,
              0
            ],
            "prediction": "Presence (1)",
            "is_leaf": false,
            "rule": "oldpeak <= -0.49",
            "feature": "oldpeak",
            "threshold": -0.49,
            "left": {
              "node_id": 25,
              "samples": 16,
              "impurity": 0.4922,
              "distribution": [
                0,
                0
              ],
              "prediction": "Presence (1)",
              "is_leaf": false,
              "rule": "chol <= -0.31",
              "feature": "chol",
              "threshold": -0.31,
              "left": null,
              "right": null
            },
            "right": {
              "node_id": 28,
              "samples": 56,
              "impurity": 0.0351,
              "distribution": [
                0,
                0
              ],
              "prediction": "Presence (1)",
              "is_leaf": false,
              "rule": "thal <= 0.923",
              "feature": "thal",
              "threshold": 0.923,
              "left": null,
              "right": null
            }
          }
        }
      },
      "cluster_labels": null,
      "cluster_centers": null,
      "pca_2d": null,
      "threshold_analysis": {
        "default_threshold": 0.5,
        "optimal_threshold": 0.833,
        "goal_precision": 0.8,
        "adjusted_precision": 0.8148,
        "adjusted_recall": 0.7857,
        "adjusted_f1": 0.8,
        "confusion_matrix": [
          [
            28,
            5
          ],
          [
            6,
            22
          ]
        ],
        "clinical_rationale": "Calibrated decision boundary to tau=0.833 to prioritize clinical sensitivity (Recall: 78.6%) while preserving target precision."
      },
      "warnings": []
    },
    "Random Forest": {
      "model_name": "Random Forest",
      "training_time_ms": 40.11,
      "metrics": {
        "Accuracy": 0.8688524590163934,
        "Precision": 0.8333333333333334,
        "Recall": 0.8928571428571429,
        "F1-score": 0.8620689655172413,
        "ROC-AUC": 0.9588744588744589
      },
      "formatted_metrics": {
        "Accuracy": "0.8689",
        "Precision": "0.8333",
        "Recall": "0.8929",
        "F1-score": "0.8621",
        "ROC-AUC": "0.9589"
      },
      "confusion_matrix": {
        "labels": [
          "Absence (0)",
          "Presence (1)"
        ],
        "matrix": [
          [
            28,
            5
          ],
          [
            3,
            25
          ]
        ]
      },
      "roc_curve": [
        {
          "x": 0.0,
          "y": 0.0
        },
        {
          "x": 0.0,
          "y": 0.0357
        },
        {
          "x": 0.0,
          "y": 0.3214
        },
        {
          "x": 0.0303,
          "y": 0.3214
        },
        {
          "x": 0.0303,
          "y": 0.8571
        },
        {
          "x": 0.0606,
          "y": 0.8571
        },
        {
          "x": 0.0606,
          "y": 0.8929
        },
        {
          "x": 0.1515,
          "y": 0.8929
        },
        {
          "x": 0.1515,
          "y": 0.9643
        },
        {
          "x": 0.3333,
          "y": 0.9643
        },
        {
          "x": 0.3333,
          "y": 1.0
        },
        {
          "x": 1.0,
          "y": 1.0
        }
      ],
      "pr_curve": [
        {
          "x": 1.0,
          "y": 0.459
        },
        {
          "x": 1.0,
          "y": 0.4746
        },
        {
          "x": 1.0,
          "y": 0.4912
        },
        {
          "x": 1.0,
          "y": 0.5091
        },
        {
          "x": 1.0,
          "y": 0.5283
        },
        {
          "x": 1.0,
          "y": 0.549
        },
        {
          "x": 1.0,
          "y": 0.5714
        },
        {
          "x": 1.0,
          "y": 0.5957
        },
        {
          "x": 1.0,
          "y": 0.6222
        },
        {
          "x": 1.0,
          "y": 0.6512
        },
        {
          "x": 1.0,
          "y": 0.6829
        },
        {
          "x": 1.0,
          "y": 0.7179
        },
        {
          "x": 0.9643,
          "y": 0.7297
        },
        {
          "x": 0.9643,
          "y": 0.7714
        },
        {
          "x": 0.9643,
          "y": 0.8182
        },
        {
          "x": 0.9286,
          "y": 0.8387
        },
        {
          "x": 0.8929,
          "y": 0.8621
        },
        {
          "x": 0.8929,
          "y": 0.9259
        },
        {
          "x": 0.8571,
          "y": 0.96
        },
        {
          "x": 0.7857,
          "y": 0.9565
        },
        {
          "x": 0.7143,
          "y": 0.9524
        },
        {
          "x": 0.6429,
          "y": 0.9474
        },
        {
          "x": 0.5714,
          "y": 0.9412
        },
        {
          "x": 0.5,
          "y": 0.9333
        },
        {
          "x": 0.4286,
          "y": 0.9231
        },
        {
          "x": 0.3571,
          "y": 0.9091
        },
        {
          "x": 0.3214,
          "y": 1.0
        },
        {
          "x": 0.25,
          "y": 1.0
        },
        {
          "x": 0.1786,
          "y": 1.0
        },
        {
          "x": 0.1071,
          "y": 1.0
        },
        {
          "x": 0.0357,
          "y": 1.0
        }
      ],
      "roc_auc": 0.9588744588744589,
      "feature_importances": [
        {
          "feature": "thal",
          "importance": 0.1451
        },
        {
          "feature": "cp",
          "importance": 0.1296
        },
        {
          "feature": "thalach",
          "importance": 0.1229
        },
        {
          "feature": "ca",
          "importance": 0.1221
        },
        {
          "feature": "oldpeak",
          "importance": 0.094
        },
        {
          "feature": "age",
          "importance": 0.0794
        },
        {
          "feature": "trestbps",
          "importance": 0.0715
        },
        {
          "feature": "chol",
          "importance": 0.0679
        },
        {
          "feature": "exang",
          "importance": 0.0575
        },
        {
          "feature": "slope",
          "importance": 0.0463
        },
        {
          "feature": "sex",
          "importance": 0.0387
        },
        {
          "feature": "restecg",
          "importance": 0.0166
        },
        {
          "feature": "fbs",
          "importance": 0.0084
        }
      ],
      "tree_rules": null,
      "cluster_labels": null,
      "cluster_centers": null,
      "pca_2d": null,
      "threshold_analysis": {
        "default_threshold": 0.5,
        "optimal_threshold": 0.456,
        "goal_precision": 0.8,
        "adjusted_precision": 0.8182,
        "adjusted_recall": 0.9643,
        "adjusted_f1": 0.8852,
        "confusion_matrix": [
          [
            27,
            6
          ],
          [
            1,
            27
          ]
        ],
        "clinical_rationale": "Calibrated decision boundary to tau=0.456 to prioritize clinical sensitivity (Recall: 96.4%) while preserving target precision."
      },
      "warnings": []
    }
  },
  "comparison_table": [
    {
      "Model": "Logistic Regression",
      "Accuracy": "0.8689",
      "Precision": "0.8125",
      "Recall": "0.9286",
      "F1-score": "0.8667",
      "ROC-AUC": "0.9513",
      "Training Time": "1.79 ms"
    },
    {
      "Model": "Decision Tree",
      "Accuracy": "0.7869",
      "Precision": "0.7419",
      "Recall": "0.8214",
      "F1-score": "0.7797",
      "ROC-AUC": "0.8598",
      "Training Time": "0.56 ms"
    },
    {
      "Model": "Random Forest",
      "Accuracy": "0.8689",
      "Precision": "0.8333",
      "Recall": "0.8929",
      "F1-score": "0.8621",
      "ROC-AUC": "0.9589",
      "Training Time": "40.11 ms"
    }
  ],
  "best_model": {
    "name": "Logistic Regression",
    "primary_metric": "F1-score",
    "score": 0.8667,
    "accuracy": 0.8689
  },
  "interpretation": "Ensemble Random Forest achieved 0.8621 F1-score (8.2% higher than single Decision Tree), reducing test-set variance across bagged bootstrap samples. Logistic Regression provides a linear baseline with 0.8689 accuracy, offering interpretable log-odds coefficients for clinical factor auditing. The Decision Tree yields transparent rule splits (max_depth=4) suitable for clinical audit trail and bedside triage.",
  "clinical_recommendation": "Model predictions must be interpreted as statistical risk indicators alongside clinician evaluation. In high-acuity screening, decision thresholds should be calibrated to avoid false negatives.",
  "warnings": [],
  "heart_disease_adapter": {
    "age_cohort_summary": [
      {
        "cohort": "<45 (Young)",
        "total_patients": 55,
        "disease_cases": 14,
        "prevalence_rate": 25.45,
        "prevalence_formatted": "25.45%"
      },
      {
        "cohort": "45-54 (Middle-aged)",
        "total_patients": 88,
        "disease_cases": 30,
        "prevalence_rate": 34.09,
        "prevalence_formatted": "34.09%"
      },
      {
        "cohort": "55-64 (Senior)",
        "total_patients": 119,
        "disease_cases": 75,
        "prevalence_rate": 63.03,
        "prevalence_formatted": "63.03%"
      },
      {
        "cohort": "65+ (Elderly)",
        "total_patients": 41,
        "disease_cases": 20,
        "prevalence_rate": 48.78,
        "prevalence_formatted": "48.78%"
      }
    ],
    "chol_outlier_analysis": {
      "q1": 211.0,
      "q3": 275.0,
      "iqr": 64.0,
      "upper_bound_cutoff": 371.0,
      "outlier_count": 5,
      "outlier_disease_rate": 40.0,
      "overall_disease_rate": 45.87,
      "clinical_insight": "Patients with hypercholesterolemia above the IQR threshold (>371.0 mg/dl) exhibit a 40.0% diagnosis rate compared to 45.9% overall."
    },
    "optimal_threshold": {
      "strategy": "Precision-Constrained Sensitivity Maximization (Precision >= 80%)",
      "threshold_value": 0.38,
      "precision_achieved": 0.812,
      "recall_achieved": 0.867,
      "clinical_benefit": "Minimizes false negatives in high-risk cardiac patients while keeping clinical alarm fatigue under 20%."
    },
    "decision_tree_narrative": [
      "Primary Root Split: Reversible defect / Thal status (thal) separates the patient cohort with high initial Gini gain.",
      "Secondary Biomarker: Number of major vessels colored by fluoroscopy (ca) provides strong prognostic discrimination.",
      "Stress Testing: Maximum heart rate achieved during exercise (thalach) serves as an inverse risk indicator (lower thalach indicates higher risk).",
      "Symptom Presentation: Chest pain type (cp) asymptomatically presenting individuals (cp=4 in original scale) experience elevated risk."
    ]
  }
};
