import type { PredictionResult, HistoryRecord, Language } from '../types';

const API_BASE = 'http://localhost:8000/api';

export async function predictLeaf(
  file: File,
  farmAcres: number = 1.0,
  seasonCode: number = 1,
  language: Language = 'en',
  fieldName: string = 'Main Field'
): Promise<PredictionResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('farm_acres', farmAcres.toString());
  formData.append('season_code', seasonCode.toString());
  formData.append('language', language);
  formData.append('field_name', fieldName);

  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Prediction failed with HTTP ${res.status}`);
  }

  return res.json();
}

export async function predictBatch(
  files: File[],
  farmAcres: number = 1.0,
  seasonCode: number = 1,
  language: Language = 'en',
  fieldName: string = 'Main Field'
): Promise<{ total_processed: number; items: PredictionResult[] }> {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));
  formData.append('farm_acres', farmAcres.toString());
  formData.append('season_code', seasonCode.toString());
  formData.append('language', language);
  formData.append('field_name', fieldName);

  const res = await fetch(`${API_BASE}/predict-batch`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Batch prediction failed with HTTP ${res.status}`);
  }

  return res.json();
}

export async function getHistory(limit: number = 50): Promise<HistoryRecord[]> {
  const res = await fetch(`${API_BASE}/history?limit=${limit}`);
  if (!res.ok) {
    throw new Error('Failed to fetch history');
  }
  const json = await res.json();
  return json.data || [];
}

export async function deleteHistoryRecord(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/history/${id}`, {
    method: 'DELETE',
  });
  return res.ok;
}

export function getPdfReportUrl(id: string): string {
  return `${API_BASE}/report/${id}`;
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}
