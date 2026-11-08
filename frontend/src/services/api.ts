import {
  SatelliteImage,
  Dataset,
  AIModel,
  Analysis,
  DashboardOverview,
  PreprocessingReport,
  ReportItem,
  STACHotspot,
  STACGranule,
  GroundTruthEvaluation,
  MeteorologicalIntelligence,
  AOITrackResult
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text();
    let detail = errorText;
    try {
      const parsed = JSON.parse(errorText);
      detail = parsed.detail || errorText;
    } catch {}
    throw new Error(detail || `HTTP error ${res.status}`);
  }
  const data = await res.json();
  return data as T;
}

export const api = {
  // Dashboard
  getDashboardOverview: (): Promise<DashboardOverview> =>
    fetch(`${API_BASE}/dashboard/overview`).then((res) => handleResponse<DashboardOverview>(res)),

  // Satellite Images
  getImages: (datasetId?: string): Promise<SatelliteImage[]> => {
    const url = datasetId
      ? `${API_BASE}/images?dataset_id=${encodeURIComponent(datasetId)}`
      : `${API_BASE}/images`;
    return fetch(url).then((res) => handleResponse<SatelliteImage[]>(res));
  },

  getImage: (id: string): Promise<SatelliteImage> =>
    fetch(`${API_BASE}/images/${id}`).then((res) => handleResponse<SatelliteImage>(res)),

  uploadImage: async (formData: FormData): Promise<SatelliteImage> => {
    const res = await fetch(`${API_BASE}/images/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<SatelliteImage>(res);
  },

  deleteImage: (id: string): Promise<{ message: string }> =>
    fetch(`${API_BASE}/images/${id}`, { method: 'DELETE' }).then((res) => handleResponse<{ message: string }>(res)),

  getImagePreviewUrl: (id: string): string => `${API_BASE}/images/${id}/preview`,

  // Datasets
  getDatasets: (): Promise<Dataset[]> =>
    fetch(`${API_BASE}/datasets`).then((res) => handleResponse<Dataset[]>(res)),

  createDataset: (data: { name: string; source: string; license?: string; description?: string }): Promise<Dataset> =>
    fetch(`${API_BASE}/datasets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((res) => handleResponse<Dataset>(res)),

  deleteDataset: (id: string): Promise<{ message: string }> =>
    fetch(`${API_BASE}/datasets/${id}`, { method: 'DELETE' }).then((res) => handleResponse<{ message: string }>(res)),

  // Preprocessing
  checkPreprocessing: (earlierId: string, laterId: string): Promise<PreprocessingReport> =>
    fetch(`${API_BASE}/preprocessing/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ earlier_image_id: earlierId, later_image_id: laterId }),
    }).then((res) => handleResponse<PreprocessingReport>(res)),

  // Analysis / Change Detection
  runChangeDetection: (payload: {
    title?: string;
    earlier_image_id: string;
    later_image_id: string;
    model_id: string;
    threshold?: number;
    min_area_m2?: number;
    apply_spectral_classification?: boolean;
  }): Promise<Analysis> =>
    fetch(`${API_BASE}/analysis/change-detection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then((res) => handleResponse<Analysis>(res)),

  getAnalyses: (): Promise<Analysis[]> =>
    fetch(`${API_BASE}/analysis`).then((res) => handleResponse<Analysis[]>(res)),

  getAnalysis: (id: string): Promise<Analysis> =>
    fetch(`${API_BASE}/analysis/${id}`).then((res) => handleResponse<Analysis>(res)),

  getAnalysisGeoJSON: (id: string): Promise<any> =>
    fetch(`${API_BASE}/analysis/${id}/geojson`).then((res) => handleResponse<any>(res)),

  getAnalysisStatistics: (id: string): Promise<any> =>
    fetch(`${API_BASE}/analysis/${id}/statistics`).then((res) => handleResponse<any>(res)),

  getAnalysisHeatmapUrl: (id: string): string => `${API_BASE}/analysis/${id}/heatmap`,
  getAnalysisOverlayUrl: (id: string): string => `${API_BASE}/analysis/${id}/overlay`,

  getAnalysisEvaluation: (id: string): Promise<GroundTruthEvaluation> =>
    fetch(`${API_BASE}/analysis/${id}/evaluation`).then((res) => handleResponse<GroundTruthEvaluation>(res)),

  // Satellite STAC Catalog (Live Orbital Search)
  getStacHotspots: (): Promise<STACHotspot[]> =>
    fetch(`${API_BASE}/stac/hotspots`).then((res) => handleResponse<STACHotspot[]>(res)),

  searchStacGranules: (params: {
    bbox: number[];
    datetime_range?: string;
    max_cloud_cover?: number;
    limit?: number;
  }): Promise<{ status: string; granule_count: number; granules: STACGranule[] }> =>
    fetch(`${API_BASE}/stac/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }).then((res) => handleResponse<{ status: string; granule_count: number; granules: STACGranule[] }>(res)),

  // Environmental & Meteorological Intelligence
  getEnvironmentalConditions: (params: {
    lat?: number;
    lon?: number;
    bbox?: number[];
    date?: string;
  }): Promise<MeteorologicalIntelligence> =>
    fetch(`${API_BASE}/environmental/conditions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }).then((res) => handleResponse<MeteorologicalIntelligence>(res)),

  trackAoiChanges: (params: {
    bbox: number[];
    model_id?: string;
    threshold?: number;
    min_area_m2?: number;
  }): Promise<AOITrackResult> =>
    fetch(`${API_BASE}/environmental/aoi-track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }).then((res) => handleResponse<AOITrackResult>(res)),

  // Models
  getModels: (): Promise<AIModel[]> =>
    fetch(`${API_BASE}/models`).then((res) => handleResponse<AIModel[]>(res)),

  trainModel: (payload: { epochs?: number; batch_size?: number; learning_rate?: number }): Promise<AIModel> =>
    fetch(`${API_BASE}/models/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then((res) => handleResponse<AIModel>(res)),

  // Reports
  getReports: (): Promise<ReportItem[]> =>
    fetch(`${API_BASE}/reports`).then((res) => handleResponse<ReportItem[]>(res)),

  generateReport: (analysisId: string, title?: string): Promise<ReportItem> =>
    fetch(`${API_BASE}/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis_id: analysisId, title }),
    }).then((res) => handleResponse<ReportItem>(res)),

  getReportDownloadUrl: (id: string): string => `${API_BASE}/reports/${id}`,

  // SAR Radar & Cloud Masking Extensions
  detectSarFlood: (params?: { bbox?: number[]; flood_threshold_db?: number }): Promise<any> =>
    fetch(`${API_BASE}/environmental/sar-flood-detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {}),
    }).then((res) => handleResponse<any>(res)),

  inspectCloudMask: (imageId: string): Promise<any> =>
    fetch(`${API_BASE}/preprocessing/cloud-mask/${imageId}`).then((res) => handleResponse<any>(res)),
};
