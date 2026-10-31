export interface SatelliteImage {
  id: string;
  dataset_id?: string;
  filename: string;
  file_path: string;
  preview_path?: string;
  acquisition_date?: string;
  sensor: string;
  crs: string;
  resolution: number;
  width?: number;
  height?: number;
  channels: number;
  bounds?: {
    min_lat: number;
    min_lon: number;
    max_lat: number;
    max_lon: number;
  };
  band_metadata?: {
    bands: Array<{ band_index: number; dtype: string; nodata?: any }>;
    driver?: string;
    nodata?: any;
  };
  created_at: string;
}

export interface Dataset {
  id: string;
  name: string;
  source: string;
  license: string;
  description?: string;
  created_at: string;
  image_count?: number;
}

export interface AIModel {
  id: string;
  model_name: string;
  architecture: string;
  version: string;
  training_dataset: string;
  configuration: Record<string, any>;
  metrics: {
    precision?: number;
    recall?: number;
    f1_score?: number;
    iou?: number;
    false_positive_rate?: number;
    latency_ms?: number;
  };
  created_at: string;
}

export interface ChangeResult {
  id: string;
  analysis_id: string;
  change_type: string;
  area_hectares: number;
  area_sq_km: number;
  area_sq_meters: number;
  change_percentage: number;
  polygon_count: number;
  confidence_summary: {
    mean?: number;
    std?: number;
    high_confidence_pct?: number;
    moderate_confidence_pct?: number;
    low_confidence_pct?: number;
    inference_latency_ms?: number;
    confidence_distribution?: number[];
  };
  class_breakdown: Record<string, number>;
  output_mask_path?: string;
  heatmap_path?: string;
  created_at: string;
}

export interface Analysis {
  id: string;
  title: string;
  earlier_image_id: string;
  later_image_id: string;
  model_id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  parameters: {
    threshold?: number;
    min_area_m2?: number;
    apply_spectral_classification?: boolean;
  };
  error_message?: string;
  created_at: string;
  completed_at?: string;
  earlier_image?: SatelliteImage;
  later_image?: SatelliteImage;
  model?: AIModel;
  results: ChangeResult[];
}

export interface ReportItem {
  id: string;
  analysis_id: string;
  title: string;
  report_path: string;
  report_metadata: Record<string, any>;
  generated_at: string;
}

export interface DashboardOverview {
  total_analyses: number;
  total_images: number;
  total_datasets: number;
  total_models: number;
  total_area_analyzed_ha: number;
  total_change_polygons: number;
  recent_analyses: Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
    model_name: string;
    earlier_image: string;
    later_image: string;
    area_ha: number;
    change_type: string;
  }>;
  class_distribution: Array<{
    name: string;
    hectares: number;
  }>;
}

export interface PreprocessingReport {
  status: string;
  compatibility: {
    status: string;
    crs_match: boolean;
    crs1: string;
    crs2: string;
    resolution_1: number;
    resolution_2: number;
    has_spatial_overlap: boolean;
    overlap_dimensions?: {
      overlap_lon_deg: number;
      overlap_lat_deg: number;
    };
  };
  quality_assessment: {
    quality_grade: string;
    cloud_saturation_pct_t1?: number;
    cloud_saturation_pct_t2?: number;
    nodata_pct_t1?: number;
    nodata_pct_t2?: number;
    temporal_correlation?: number;
    target_crs?: string;
    target_resolution_px?: string;
    error_detail?: string;
  };
  earlier_image: Record<string, any>;
  later_image: Record<string, any>;
}
