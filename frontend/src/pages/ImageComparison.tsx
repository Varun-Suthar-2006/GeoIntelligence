import React, { useEffect, useState } from 'react';
import {
  SplitSquareVertical,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { SatelliteImage, PreprocessingReport } from '../types';

export const ImageComparison: React.FC = () => {
  const [images, setImages] = useState<SatelliteImage[]>([]);
  const [earlierId, setEarlierId] = useState<string>('');
  const [laterId, setLaterId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 - 100
  const [compositeMode, setCompositeMode] = useState<'RGB' | 'CIR'>('RGB');
  const [qcReport, setQcReport] = useState<PreprocessingReport | null>(null);
  const [checkingQc, setCheckingQc] = useState<boolean>(false);

  useEffect(() => {
    api.getImages().then((imgs) => {
      setImages(imgs);
      if (imgs.length >= 2) {
        setEarlierId(imgs[0].id);
        setLaterId(imgs[1].id);
      } else if (imgs.length === 1) {
        setEarlierId(imgs[0].id);
        setLaterId(imgs[0].id);
      }
    });
  }, []);

  const earlierImg = images.find((i) => i.id === earlierId);
  const laterImg = images.find((i) => i.id === laterId);

  const runQualityCheck = () => {
    if (!earlierId || !laterId) return;
    setCheckingQc(true);
    api.checkPreprocessing(earlierId, laterId)
      .then((res) => {
        setQcReport(res);
        setCheckingQc(false);
      })
      .catch((err) => {
        console.error(err);
        setCheckingQc(false);
      });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <SplitSquareVertical className="w-6 h-6 text-primary-light" />
            <span>Multi-Temporal Image Comparison</span>
          </h2>
          <p className="text-xs text-text-secondary font-mono mt-1">
            Compare satellite acquisitions across temporal baselines with interactive swipe & quality verification.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex bg-surface-light border border-surface-border rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => setViewMode('slider')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'slider' ? 'bg-primary text-white font-medium' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Swipe Slider
            </button>
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'side-by-side' ? 'bg-primary text-white font-medium' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Side-by-Side
            </button>
          </div>

          <button
            onClick={runQualityCheck}
            disabled={checkingQc || !earlierId || !laterId}
            className="px-3.5 py-1.5 rounded-lg bg-surface-light hover:bg-surface-border border border-surface-border text-xs font-mono text-text-primary flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-accent-teal ${checkingQc ? 'animate-spin' : ''}`} />
            <span>Verify Alignment</span>
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-surface border border-surface-border">
        {/* Earlier Image (T1) */}
        <div>
          <label className="text-xs font-mono text-text-secondary block mb-1.5 flex items-center justify-between">
            <span className="font-semibold text-primary-light">Earlier Acquisition (T1)</span>
            <span>{earlierImg?.sensor || 'Sensor'}</span>
          </label>
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

        {/* Later Image (T2) */}
        <div>
          <label className="text-xs font-mono text-text-secondary block mb-1.5 flex items-center justify-between">
            <span className="font-semibold text-accent-rose">Later Acquisition (T2)</span>
            <span>{laterImg?.sensor || 'Sensor'}</span>
          </label>
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
      </div>

      {/* Main Comparison Canvas */}
      <div className="rounded-xl bg-surface border border-surface-border overflow-hidden p-6 space-y-4">
        {viewMode === 'slider' ? (
          <div className="space-y-4">
            {/* Interactive Swipe Container */}
            <div className="relative w-full h-[520px] rounded-lg overflow-hidden border border-surface-border select-none bg-black">
              {/* Earlier Image Background (full width) */}
              {earlierImg && (
                <img
                  src={api.getImagePreviewUrl(earlierImg.id)}
                  alt="Earlier T1"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
              )}

              {/* Later Image Overlay (clipped to slider percentage) */}
              {laterImg && (
                <div
                  className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={api.getImagePreviewUrl(laterImg.id)}
                    alt="Later T2"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    style={{ width: '100%', height: '100%' }}
                  />
                  <span className="absolute top-4 left-4 px-2 py-1 rounded bg-black/70 text-white font-mono text-[10px] tracking-wider uppercase border border-white/20">
                    Later (T2)
                  </span>
                </div>
              )}

              <span className="absolute top-4 right-4 px-2 py-1 rounded bg-black/70 text-white font-mono text-[10px] tracking-wider uppercase border border-white/20">
                Earlier (T1)
              </span>

              {/* Draggable Divider Handle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-black shadow-lg flex items-center justify-center pointer-events-none"
                style={{ left: `${sliderPos}%` }}
              >
                <SplitSquareVertical className="w-4 h-4 text-black" />
              </div>
            </div>

            {/* Slider Range Input */}
            <div className="flex items-center space-x-4 px-2">
              <span className="text-xs font-mono text-text-secondary shrink-0">Later (T2)</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <span className="text-xs font-mono text-text-secondary shrink-0">Earlier (T1)</span>
            </div>
          </div>
        ) : (
          /* Side-by-Side Dual View */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-text-secondary">
                <span className="font-bold text-primary-light">Earlier (T1): {earlierImg?.filename}</span>
                <span>{earlierImg?.acquisition_date ? new Date(earlierImg.acquisition_date).toLocaleDateString() : ''}</span>
              </div>
              <div className="w-full h-96 rounded-lg bg-black border border-surface-border overflow-hidden">
                {earlierImg && (
                  <img
                    src={api.getImagePreviewUrl(earlierImg.id)}
                    alt="Earlier T1"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-text-secondary">
                <span className="font-bold text-accent-rose">Later (T2): {laterImg?.filename}</span>
                <span>{laterImg?.acquisition_date ? new Date(laterImg.acquisition_date).toLocaleDateString() : ''}</span>
              </div>
              <div className="w-full h-96 rounded-lg bg-black border border-surface-border overflow-hidden">
                {laterImg && (
                  <img
                    src={api.getImagePreviewUrl(laterImg.id)}
                    alt="Later T2"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preprocessing Quality Control Report Modal/Card */}
      {qcReport && (
        <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent-emerald" />
              <span>Spatial Alignment & Preprocessing Report</span>
            </h3>
            <span
              className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                qcReport.quality_assessment.quality_grade === 'EXCELLENT'
                  ? 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/30'
                  : 'bg-accent-amber/10 text-accent-amber border border-accent-amber/30'
              }`}
            >
              {qcReport.quality_assessment.quality_grade}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-surface-light border border-surface-border">
              <div className="text-text-muted text-[10px]">CRS Match</div>
              <div className="text-text-primary font-bold mt-1">
                {qcReport.compatibility.crs_match ? 'Aligned (Matches)' : 'Reprojected'}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-surface-light border border-surface-border">
              <div className="text-text-muted text-[10px]">Cloud / Saturation (T1)</div>
              <div className="text-text-primary font-bold mt-1">
                {qcReport.quality_assessment.cloud_saturation_pct_t1 ?? 0}%
              </div>
            </div>
            <div className="p-3 rounded-lg bg-surface-light border border-surface-border">
              <div className="text-text-muted text-[10px]">Cloud / Saturation (T2)</div>
              <div className="text-text-primary font-bold mt-1">
                {qcReport.quality_assessment.cloud_saturation_pct_t2 ?? 0}%
              </div>
            </div>
            <div className="p-3 rounded-lg bg-surface-light border border-surface-border">
              <div className="text-text-muted text-[10px]">Temporal Correlation</div>
              <div className="text-text-primary font-bold mt-1">
                {qcReport.quality_assessment.temporal_correlation ?? 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
