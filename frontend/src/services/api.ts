import {
  DatasetMeta,
  DatasetCatalogItem,
  DatasetProfile,
  RecommendationsResponse,
  AnalysisRequest,
  AnalysisResponse
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function checkHealth(): Promise<{ status: string; version: string; project: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function getDatasets(): Promise<DatasetMeta[]> {
  const res = await fetch(`${API_BASE}/datasets`);
  if (!res.ok) throw new Error(`Failed to fetch datasets: ${res.statusText}`);
  return res.json();
}

export async function getDatasetCatalog(): Promise<DatasetCatalogItem[]> {
  const res = await fetch(`${API_BASE}/datasets/catalog`);
  if (!res.ok) throw new Error(`Failed to fetch dataset catalog: ${res.statusText}`);
  return res.json();
}

export async function loadCatalogDataset(datasetId: string): Promise<DatasetMeta> {
  const res = await fetch(`${API_BASE}/datasets/catalog/${datasetId}/load`, {
    method: 'POST',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || `Failed to load catalog dataset '${datasetId}'.`);
  }

  return res.json();
}

export async function uploadDataset(file: File): Promise<DatasetMeta> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/datasets/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Failed to upload dataset.');
  }

  return res.json();
}

export async function loadHeartDiseaseExample(): Promise<DatasetMeta> {
  const res = await fetch(`${API_BASE}/datasets/example/heart-disease`, {
    method: 'POST',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Failed to load Cleveland Heart Disease benchmark.');
  }

  return res.json();
}

export async function getDatasetProfile(datasetId: string): Promise<DatasetProfile> {
  const res = await fetch(`${API_BASE}/datasets/${datasetId}/profile`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to fetch dataset profile.');
  }
  return res.json();
}

export async function getRecommendations(datasetId: string): Promise<RecommendationsResponse> {
  const res = await fetch(`${API_BASE}/datasets/${datasetId}/recommendations`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to generate recommendations.');
  }
  return res.json();
}

export async function runAnalysis(datasetId: string, req: AnalysisRequest): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/datasets/${datasetId}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Model execution failed.');
  }

  return res.json();
}

export async function getAnalysis(analysisId: string): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/analyses/${analysisId}`);
  if (!res.ok) throw new Error('Analysis record not found.');
  return res.json();
}

export function getPdfReportUrl(analysisId: string): string {
  return `${API_BASE}/analyses/${analysisId}/pdf`;
}

export function getCleanCsvExportUrl(analysisId: string): string {
  return `${API_BASE}/analyses/${analysisId}/export/clean-csv`;
}
