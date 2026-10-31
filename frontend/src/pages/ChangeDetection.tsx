import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Play,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Cpu,
  Layers,
  MapPin,
  FileText,
  Download,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { SatelliteImage, AIModel, Analysis } from '../types';

export const ChangeDetection: React.FC = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<SatelliteImage[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  
  const [earlierId, setEarlierId] = useState<string>('');
  const [laterId, setLaterId] = useState<string>('');
  const [modelId, setModelId] = useState<string>('');
  const [threshold, setThreshold] = useState<number>(0.5);
  const [minAreaM2, setMinAreaM2] = useState<number>(200);
  const [title, setTitle] = useState<string>('Sentinel-2 Surface Change Analysis');
  
  const [running, setRunning] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overlay' | 'heatmap'>('overlay');

  useEffect(() => {
    Promise.all([api.getImages(), api.getModels()]).then(([imgs, mods]) => {
      setImages(imgs);
      setModels(mods);
      if (imgs.length >= 2) {
        setEarlierId(imgs[0].id);
        setLaterId(imgs[1].id);
      }
      if (mods.length > 0) {
        // Default to Siamese U-Net if present
        const siamese = mods.find((m) => m.architecture.includes('Siamese'));
        setModelId(siamese ? siamese.id : mods[0].id);
      }
    });
  }, []);

  const handleRunAnalysis = async () => {
    if (!earlierId || !laterId || !modelId) {
      setError('Please select both satellite acquisitions and an AI model.');
      return;
    }
    setError(null);
    setRunning(true);
    setAnalysisResult(null);

    try {
      const res = await api.runChangeDetection({
        title,
        earlier_image_id: earlierId,
        later_image_id: laterId,
        model_id: modelId,
        threshold,
        min_area_m2: minAreaM2,
        apply_spectral_classification: true,
      });
      setAnalysisResult(res);
      setRunning(false);
    } catch (err: any) {
      setError(err.message || 'Change detection analysis failed');
      setRunning(false);
    }
  };

  const primaryResult = analysisResult?.results?.[0];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary-light" />
          <span>AI-Powered Change Detection Engine</span>
        </h2>
        <p className="text-xs text-text-secondary font-mono mt-1">
          Execute deep convolutional Siamese U-Net or baseline change detection algorithms across multi-temporal rasters.
        </p>
      </div>

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Parameter Controls */}
        <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-5">
          <div className="flex items-center space-x-2 text-xs font-mono font-semibold text-text-primary border-b border-surface-border pb-3">
            <Sliders className="w-4 h-4 text-primary-light" />
            <span>Analysis Parameters</span>
          </div>

          {/* Analysis Title */}
          <div>
            <label className="text-xs font-mono text-text-secondary block mb-1">Analysis Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-text-primary font-mono focus:outline-none focus:border-primary"
            />
          </div>

          {/* Earlier Image */}
          <div>
            <label className="text-xs font-mono text-text-secondary block mb-1">Earlier Scene (T1 Reference)</label>
            <select
              value={earlierId}
              onChange={(e) => setEarlierId(e.target.value)}
              className="w-full text-xs bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-text-primary font-mono focus:outline-none focus:border-primary"
            >
              {images.map((img) => (
                <option key={img.id} value={img.id}>
                  {img.filename} ({img.acquisition_date ? new Date(img.acquisition_date).toLocaleDateString() : 'N/A'})
                </option>
              ))}
            </select>
          </div>

          {/* Later Image */}
          <div>
            <label className="text-xs font-mono text-text-secondary block mb-1">Later Scene (T2 Comparison)</label>
            <select
              value={laterId}
              onChange={(e) => setLaterId(e.target.value)}
              className="w-full text-xs bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-text-primary font-mono focus:outline-none focus:border-primary"
            >
              {images.map((img) => (
                <option key={img.id} value={img.id}>
                  {img.filename} ({img.acquisition_date ? new Date(img.acquisition_date).toLocaleDateString() : 'N/A'})
                </option>
              ))}
            </select>
          </div>

          {/* Model Selection */}
          <div>
            <label className="text-xs font-mono text-text-secondary block mb-1 flex items-center justify-between">
              <span>AI Model Architecture</span>
              <Cpu className="w-3.5 h-3.5 text-primary-light" />
            </label>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="w-full text-xs bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-text-primary font-mono focus:outline-none focus:border-primary"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.model_name}
                </option>
              ))}
            </select>
          </div>

          {/* Threshold Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-text-secondary">Probability Threshold:</span>
              <span className="text-primary-light font-bold">{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <p className="text-[10px] font-mono text-text-muted">Higher values reduce false alarms from seasonal variance.</p>
          </div>

          {/* Minimum Mapping Unit (m2) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-text-secondary">Min Polygon Area:</span>
              <span className="text-accent-teal font-bold">{minAreaM2} m²</span>
            </div>
            <input
              type="range"
              min="50"
              max="1000"
              step="50"
              value={minAreaM2}
              onChange={(e) => setMinAreaM2(Number(e.target.value))}
              className="w-full accent-accent-teal cursor-pointer"
            />
            <p className="text-[10px] font-mono text-text-muted">Suppresses isolated single-pixel raster noise.</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-accent-rose/10 border border-accent-rose/30 text-xs font-mono text-accent-rose flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Launch Button */}
          <button
            onClick={handleRunAnalysis}
            disabled={running}
            className="w-full py-3 rounded-lg bg-primary hover:bg-primary-dark disabled:bg-surface-light text-white font-medium text-xs flex items-center justify-center space-x-2 transition-all shadow-md"
          >
            {running ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Executing Siamese Inference & Polygonization...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Execute Change Detection</span>
              </>
            )}
          </button>
        </div>

        {/* Right Output: Results Display */}
        <div className="lg:col-span-2 space-y-6">
          {analysisResult && primaryResult ? (
            <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-6">
              {/* Execution Summary Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
                <div>
                  <span className="text-[10px] font-mono text-accent-emerald uppercase tracking-wider font-semibold">
                    Analysis Completed Successfully
                  </span>
                  <h3 className="text-base font-bold text-text-primary">{analysisResult.title}</h3>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate(`/geospatial?analysis_id=${analysisResult.id}`)}
                    className="px-3 py-1.5 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary-light border border-primary/30 text-xs font-mono flex items-center gap-1.5 transition-all"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>View on Map</span>
                  </button>

                  <button
                    onClick={() => {
                      api.generateReport(analysisResult.id).then(() => {
                        navigate('/reports');
                      });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-surface-light hover:bg-surface-border text-text-primary border border-surface-border text-xs font-mono flex items-center gap-1.5 transition-all"
                  >
                    <FileText className="w-3.5 h-3.5 text-accent-teal" />
                    <span>Generate PDF Report</span>
                  </button>
                </div>
              </div>

              {/* Measured Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-lg bg-surface-light border border-surface-border">
                  <div className="text-[10px] font-mono text-text-secondary">Affected Ground Area</div>
                  <div className="text-xl font-bold font-mono text-accent-rose mt-1">
                    {primaryResult.area_hectares} <span className="text-xs font-normal">ha</span>
                  </div>
                  <div className="text-[10px] font-mono text-text-muted mt-0.5">
                    {primaryResult.area_sq_km} km²
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-surface-light border border-surface-border">
                  <div className="text-[10px] font-mono text-text-secondary">Scene Change Pct</div>
                  <div className="text-xl font-bold font-mono text-primary-light mt-1">
                    {primaryResult.change_percentage}%
                  </div>
                  <div className="text-[10px] font-mono text-text-muted mt-0.5">Of bounding scene</div>
                </div>

                <div className="p-3.5 rounded-lg bg-surface-light border border-surface-border">
                  <div className="text-[10px] font-mono text-text-secondary">Delineated Polygons</div>
                  <div className="text-xl font-bold font-mono text-accent-amber mt-1">
                    {primaryResult.polygon_count}
                  </div>
                  <div className="text-[10px] font-mono text-text-muted mt-0.5">Contours extracted</div>
                </div>

                <div className="p-3.5 rounded-lg bg-surface-light border border-surface-border">
                  <div className="text-[10px] font-mono text-text-secondary">Dominant Transition</div>
                  <div className="text-sm font-bold font-mono text-accent-emerald mt-1 truncate">
                    {primaryResult.change_type}
                  </div>
                  <div className="text-[10px] font-mono text-text-muted mt-0.5">Spectral classified</div>
                </div>
              </div>

              {/* Visual Preview Mode Tabs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-surface-border pb-2">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setActiveTab('overlay')}
                      className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                        activeTab === 'overlay'
                          ? 'bg-primary text-white font-medium'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Delineated Change Mask
                    </button>
                    <button
                      onClick={() => setActiveTab('heatmap')}
                      className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                        activeTab === 'heatmap'
                          ? 'bg-primary text-white font-medium'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Continuous Probability Heatmap
                    </button>
                  </div>
                  <span className="text-[10px] font-mono text-text-muted">
                    Latency: {primaryResult.confidence_summary.inference_latency_ms || 45} ms
                  </span>
                </div>

                <div className="w-full h-80 rounded-lg bg-black border border-surface-border overflow-hidden flex items-center justify-center">
                  {activeTab === 'overlay' ? (
                    <img
                      src={api.getAnalysisOverlayUrl(analysisResult.id)}
                      alt="Change Overlay"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={api.getAnalysisHeatmapUrl(analysisResult.id)}
                      alt="Probability Heatmap"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-xl bg-surface border border-dashed border-surface-border text-center space-y-3 flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-12 h-12 rounded-xl bg-surface-light border border-surface-border flex items-center justify-center text-text-muted">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary">Ready to Launch Inference</h3>
              <p className="text-xs text-text-secondary font-mono max-w-sm">
                Select your multi-temporal satellite scenes and click "Execute Change Detection" to generate classified change masks, equal-area metric quantifications, and vector polygons.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
