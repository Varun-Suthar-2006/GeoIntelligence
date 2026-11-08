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
    bands?: Array<{ band_index: number; dtype: string; nodata?: any }>;
    driver?: string;
    nodata?: any;
    city?: string;
    ground_truth_path?: string;
    change_description?: string;
    [key: string]: any;
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

export interface STACHotspot {
  id: string;
  name: string;
  category: string;
  bbox: [number, number, number, number];
  default_date_range: string;
  description: string;
}

export interface STACGranule {
  id: string;
  datetime: string;
  cloud_cover: number;
  platform: string;
  grid_code?: string;
  sun_elevation?: number;
  thumbnail_url?: string;
  visual_url?: string;
  bbox: number[];
  geometry?: any;
  bands?: Record<string, string>;
}

export interface GroundTruthEvaluation {
  has_ground_truth: boolean;
  message?: string;
  confusion_matrix?: {
    true_positives: number;
    false_positives: number;
    false_negatives: number;
    true_negatives: number;
  };
  metrics?: {
    precision: number;
    recall: number;
    specificity: number;
    f1_score: number;
    iou: number;
    overall_accuracy: number;
    cohen_kappa: number;
  };
  area_comparison?: {
    ground_truth_pixels: number;
    predicted_pixels: number;
    ground_truth_area_ha: number;
    predicted_area_ha: number;
    area_error_percentage: number;
  };
}

export interface MeteorologicalIntelligence {
  source: string;
  latitude: number;
  longitude: number;
  timestamp?: string;
  temperature_c: number;
  temperature_f: number;
  apparent_temperature_c: number;
  relative_humidity_pct: number;
  cloud_cover_pct: number;
  precipitation_mm: number;
  surface_pressure_hpa: number;
  wind: {
    speed_kmh: number;
    speed_knots: number;
    direction_degrees: number;
    direction_cardinal: string;
    gusts_kmh: number;
  };
  condition: string;
  satellite_viability: {
    viability_score: number;
    viability_grade: string;
    recommendation: string;
  };
}

export interface AOITrackResult {
  status: string;
  aoi_spatial: {
    bbox: number[];
    centroid: { lat: number; lon: number };
    area_hectares: number;
    area_sq_km: number;
    area_sq_meters: number;
    perimeter_meters: number;
    crs_used: string;
  };
  meteorological_intelligence: MeteorologicalIntelligence;
  satellite_scenes_evaluated: {
    earlier_scene: { id: string; filename: string; sensor: string; date?: string };
    later_scene: { id: string; filename: string; sensor: string; date?: string };
    model_used: string;
    inference_latency_ms: number;
  };
  change_quantification: {
    total_changed_ha: number;
    total_changed_sq_km: number;
    polygon_count: number;
    change_percentage_of_scene: number;
    dominant_transition: string;
    class_breakdown_ha: Record<string, number>;
  };
  environmental_correlation_insights: string[];
  geojson_polygons: any;
}

