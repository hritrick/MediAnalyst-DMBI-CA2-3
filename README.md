# MediAnalytics — Multi-Dataset Medical Data Analytics Platform

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-234B43.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-315F62.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18.3-627D98.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-315F62.svg)](https://www.typescriptlang.org/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.9-234B43.svg)](https://scikit-learn.org/)
[![Academic Viva Ready](https://img.shields.io/badge/Academic%20Project-DMBI%20CA2-234B43.svg)](#)

**MediAnalytics** is a full-stack clinical data mining and machine learning web platform built for academic research and college-level viva demonstration (**DMBI CA2**). It enables researchers and clinicians to explore real, publicly available medical datasets from official scientific repositories or upload custom clinical files (CSV/Excel), automatically profile structural characteristics and missingness, screen for Tukey outliers, and evaluate predictive models (Classification, Regression, Clustering) with strict data leakage safeguards and clinical threshold optimization.

---

## 1. Verified Real Medical Datasets

All datasets integrated into MediAnalytics are **real, publicly accessible datasets** sourced directly from the **UCI Machine Learning Repository** and official health agencies. No synthetic data, mock records, or fabricated patient profiles are used.

| Dataset Name | Domain / Focus | Official Source | Instances | Features | Default Target | Available Tasks | License |
|---|---|---|---|---|---|---|---|
| **UCI Cleveland Heart Disease** | Cardiology | [UCI #45](https://archive.ics.uci.edu/dataset/45/heart+disease) | 303 | 16 | `target_binary` (or multiclass `num`) | Binary/Multiclass Classification, EDA | CC BY 4.0 |
| **CDC Diabetes Health Indicators** | Endocrinology / Epidemiology | [UCI #891](https://archive.ics.uci.edu/dataset/891/cdc+diabetes+health+indicators) | 253,680 | 23 | `Diabetes_binary` | Binary Classification, EDA | CC BY 4.0 |
| **Breast Cancer Wisconsin (Diagnostic)** | Oncology | [UCI #17](https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic) | 569 | 32 | `Diagnosis` ('M' vs 'B') | Binary Classification, Clustering, EDA | CC BY 4.0 |
| **Chronic Kidney Disease** | Nephrology | [UCI #336](https://archive.ics.uci.edu/dataset/336/chronic+kidney+disease) | 400 | 25 | `class` ('ckd' vs 'notckd') | Binary Classification, EDA | CC BY 4.0 |
| **Maternal Health Risk** | Obstetrics & Maternal Care | [UCI #863](https://archive.ics.uci.edu/dataset/863/maternal+health+risk) | 1,014 | 7 | `RiskLevel` (low, mid, high) | Multiclass Classification, EDA | CC BY 4.0 |
| **Wine Quality Benchmark** *(Non-Medical)* | General Tabular Analytics | [UCI #186](https://archive.ics.uci.edu/dataset/186/wine+quality) | 6,497 | 13 | `quality` (score 3–9) | Numeric Regression, Clustering, EDA | CC BY 4.0 |

---

## 2. Dataset Acquisition, Storage & Reproducibility

### Directory Structure

```
DMBI-CA2/
├── DMBI_CA2.ipynb               # Original Google Colab notebook
├── scripts/
│   └── download_datasets.py     # Automated dataset acquisition & SHA-256 verification
├── data/
│   ├── raw/                     # Unmodified source files straight from official repositories
│   │   ├── heart_disease/       # data.csv, processed.cleveland.data, heart-disease.names
│   │   ├── diabetes/            # data.csv (253,680 survey records)
│   │   ├── breast_cancer/       # data.csv, wdbc.data, wdbc.names
│   │   ├── kidney_disease/      # data.csv, chronic+kidney+disease.zip
│   │   ├── maternal_health/     # data.csv, maternal+health+risk.zip
│   │   └── wine_quality/        # data.csv, winequality-red.csv, winequality-white.csv
│   ├── processed/               # Cleaned versions preserving distributions & labels
│   │   ├── heart_disease/       # cleveland_heart_disease.csv
│   │   ├── diabetes/            # cdc_diabetes_indicators.csv
│   │   ├── breast_cancer/       # breast_cancer_diagnostic.csv
│   │   ├── kidney_disease/      # chronic_kidney_disease.csv
│   │   ├── maternal_health/     # maternal_health_risk.csv
│   │   └── wine_quality/        # wine_quality.csv
│   └── metadata/
│       ├── datasets.json        # Central catalog metadata
│       └── download_manifest.json # Retrieval timestamps, source URLs, SHA-256 checksums
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entrypoint & CORS
│   │   ├── config.py            # Application paths & settings
│   │   ├── api/
│   │   │   ├── datasets.py      # Catalog, uploads, profiling & recommendations
│   │   │   ├── analysis.py      # Model training & evaluation execution
│   │   │   └── reports.py       # PDF generator & clean CSV download
│   │   ├── services/
│   │   │   ├── catalog.py       # Central catalog service & auto-loading
│   │   │   ├── loader.py        # CSV/XLSX parser & benchmark integration
│   │   │   ├── profiler.py      # Statistical profiling & Tukey outliers
│   │   │   ├── recommender.py   # Machine learning recommendation engine
│   │   │   ├── preprocessing.py # Scikit-learn ColumnTransformer & Pipeline
│   │   │   ├── evaluator.py     # Evaluation orchestrator
│   │   │   └── report_generator.py # ReportLab PDF & CSV builder
│   │   ├── models/
│   │   │   ├── classification.py # LogReg, Decision Tree, Random Forest
│   │   │   ├── regression.py     # Linear, Decision Tree Regressor, RF
│   │   │   └── clustering.py     # K-Means, Hierarchical Clustering
│   │   ├── adapters/
│   │   │   └── heart_disease.py # Cleveland notebook adapter
│   │   └── schemas/
│   │       ├── requests.py      # Pydantic request models
│   │       └── responses.py     # Pydantic response models
│   ├── tests/
│   │   ├── test_dataset_integration.py # Automated tests for all 6 datasets & APIs
│   │   ├── test_profiler.py     # Profiling & model test cases
│   │   └── test_api.py          # API route integration tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── DatasetLibraryPage.tsx # Official Dataset Library with filters & cards
│   │   │   ├── DatasetsPage.tsx       # Active dataset inspector & file upload
│   │   │   ├── ExplorationPage.tsx    # EDA, correlation heatmaps & cohorts
│   │   │   ├── AnalysisPage.tsx       # Model configuration & deep-dive metrics
│   │   │   └── ReportsPage.tsx        # PDF report & clean CSV download
│   │   ├── services/api.ts            # Fetch API service
│   │   └── types/index.ts             # TypeScript definitions
│   └── package.json
└── README.md
```

### Reproducible Download & Verification

To re-download and cryptographically verify all datasets from their official sources:

```bash
python scripts/download_datasets.py
```

This script:
1. Connects to the official UCI repository endpoints.
2. Downloads the raw files into `data/raw/<dataset>/` without altering them.
3. Computes the SHA-256 hash and byte size of every file.
4. Generates sanitized processed versions in `data/processed/<dataset>/`.
5. Updates `data/metadata/download_manifest.json` and `data/metadata/datasets.json`.

---

## 3. Data Quality & Preprocessing Notes

Each dataset exhibits distinct clinical and structural characteristics handled by our generic preprocessing pipeline:

- **Cleveland Heart Disease**:
  - Contains missing values in `ca` (4) and `thal` (2) designated by `'?'`.
  - The raw outcome `num` has 5 severity levels (0: absence; 1, 2, 3, 4: degrees of stenosis). The system preserves original multiclass severity while providing an explicitly configurable binary target `target_binary` (0 vs 1).
  - Preprocessing automatically excludes `num` and `target` when training on `target_binary` to prevent target leakage.
- **CDC Diabetes Health Indicators**:
  - 253,680 survey records with 21 indicators and an `ID` column.
  - The pipeline automatically detects `ID` as an identifier column and excludes it from the predictor matrix.
  - Preprocessing scales numeric indicators with `StandardScaler` and handles imbalanced class distributions.
- **Breast Cancer Wisconsin (Diagnostic)**:
  - 30 real-valued morphological descriptors computed from FNA cell nuclei images.
  - Identifier column `ID` is automatically screened and excluded from the predictor set.
  - Target `Diagnosis` preserves original clinical labels `'M'` (Malignant) and `'B'` (Benign).
- **Chronic Kidney Disease**:
  - High missingness across 24 mixed continuous and categorical attributes (e.g., serum creatinine, hemoglobin, blood glucose, red blood cell counts).
  - The raw UCI data contains whitespace and tab irregularities (e.g., `'ckd\t'`, `'\tno'`). The processed version sanitizes text tokens while preserving missing-value semantics.
  - Missing values are imputed using median for continuous variables and mode for categorical variables, followed by one-hot encoding.
- **Maternal Health Risk**:
  - 1,014 records across 6 vital physiological markers with a multiclass risk label (`low risk`, `mid risk`, `high risk`).
  - Raw CSV contains a UTF-8 BOM (`\ufeff`) on the `Age` header, which is stripped during ingestion.
  - Evaluated with One-vs-Rest multiclass ROC-AUC and 3x3 confusion matrices.
- **Wine Quality Benchmark**:
  - Included exclusively as a non-medical tabular regression benchmark.
  - Targets continuous sensory score (3–9) using Linear Regression, Decision Tree Regressor, and Random Forest Regressor.

---

## 4. Quickstart & Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Run all 21 automated integration and unit tests
PYTHONPATH=app pytest -v tests/

# Launch FastAPI development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

FastAPI interactive Swagger documentation will be available at `http://localhost:8000/docs`.

### 2. Frontend Setup

In a separate terminal:

```bash
cd frontend

# Install dependencies
npm install

# Build production bundle
npm run build

# Launch Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 5. API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health check and project status |
| `GET` | `/api/datasets/catalog` | List all verified official datasets with full metadata and integrity status |
| `POST` | `/api/datasets/catalog/{id}/load` | Load a verified dataset from the catalog into the active workspace |
| `GET` | `/api/datasets` | List all available / previously uploaded datasets |
| `POST` | `/api/datasets/upload` | Ingest new CSV or Excel medical dataset |
| `POST` | `/api/datasets/example/heart-disease` | Quick-load UCI Cleveland Heart Disease benchmark |
| `GET` | `/api/datasets/{id}/profile` | Retrieve structural, statistical & outlier profile |
| `POST` | `/api/datasets/{id}/recommendations` | Get task recommendations & feature guidance |
| `POST` | `/api/datasets/{id}/analyze` | Train models (Classification, Regression, Clustering) |
| `GET` | `/api/analyses/{id}` | Retrieve completed analysis payload |
| `GET` | `/api/analyses/{id}/report` | Retrieve structured report summary JSON |
| `GET` | `/api/analyses/{id}/pdf` | Download official publication-style PDF report |
| `GET` | `/api/analyses/{id}/export/clean-csv` | Download preprocessed, clean CSV dataset |

---

## 6. Colab Notebook Integration

The methodology in `DMBI_CA2.ipynb` is fully operationalized:
- **Reproducible Data Ingestion**: Direct loading of the Cleveland Clinic cardiac dataset with identical column names and missing value handling.
- **Model Triad**: Logistic Regression baseline, Decision Tree (depth=4) rule extraction, and Random Forest (100 estimators) ensemble.
- **Clinical Cohort Discretization**: Patient age grouping into `<45`, `45-54`, `55-64`, and `65+` with disease prevalence tracking.
- **Serum Cholesterol Outliers**: Tukey's IQR fences ($Q3 + 1.5 \times IQR$) isolating hypercholesterolemia cohorts.
- **Threshold Optimization**: Decision boundary tuning ($\tau$) maximizing Recall subject to Precision $\ge 80\%$.
