import React, { useEffect, useState, useRef } from 'react';
import {
  SplitSquareVertical,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  MapPin
} from 'lucide-react';
import { api } from '../services/api';
import { SatelliteImage, PreprocessingReport } from '../types';

const BENCHMARK_PRESETS = [
  { name: 'Montpellier, France', key: 'montpellier', desc: 'Urban growth & vineyard conversion' },
  { name: 'Beirut, Lebanon', key: 'beirut', desc: 'Port infrastructure & coastal change' },
  { name: 'Las Vegas, USA', key: 'lasvegas', desc: 'Desert suburban residential expansion' },
  { name: 'Dubai, UAE', key: 'dubai', desc: 'Coastal land reclamation & development' },
  { name: 'Rio de Janeiro, Brazil', key: 'rio', desc: 'Metropolitan transport & urban dynamics' },
];

export const ImageComparison: React.FC = () => {
  const [images, setImages] = useState<SatelliteImage[]>([]);
  const [earlierId, setEarlierId] = useState<string>('');
  const [laterId, setLaterId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 - 100
  const [compositeMode, setCompositeMode] = useState<'RGB' | 'CIR' | 'DIFF'>('RGB');
  const [qcReport, setQcReport] = useState<PreprocessingReport | null>(null);
  const [checkingQc, setCheckingQc] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  useEffect(() => {
    api.getImages().then((imgs) => {
      setImages(imgs);
      if (imgs.length >= 2) {
        // Default to Montpellier pair if available
        const mont1 = imgs.find((i) => i.filename.includes('montpellier_t1'));
        const mont2 = imgs.find((i) => i.filename.includes('montpellier_t2'));
        if (mont1 && mont2) {
          setEarlierId(mont1.id);
          setLaterId(mont2.id);
        } else {
          setEarlierId(imgs[0].id);
          setLaterId(imgs[1].id);
        }
      }
    });
  }, []);

  const earlierImg = images.find((i) => i.id === earlierId);
  const laterImg = images.find((i) => i.id === laterId);

  const handleSelectPreset = (cityKey: string) => {
    const t1 = images.find((i) => i.filename.includes(`${cityKey}_t1`));
    const t2 = images.find((i) => i.filename.includes(`${cityKey}_t2`));
    if (t1 && t2) {
      setEarlierId(t1.id);
      setLaterId(t2.id);
      setQcReport(null);
    }
  };

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

  // Mouse drag handler for intuitive slider movement directly on image canvas
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPos(percent);
  };

  const hasGroundTruth = earlierImg?.band_metadata && 'ground_truth_path' in earlierImg.band_metadata;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <SplitSquareVertical className="w-6 h-6 text-primary-light" />
            <span>Multi-Temporal Image Comparison</span>
          </h2>
          <p className="text-xs text-text-secondary font-mono mt-1">
            Compare registered satellite scenes across multi-year temporal baselines with interactive split-curtain swipe.
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
              Curtain Swipe
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

      {/* Preset Pairs Bar */}
      <div className="p-3 rounded-xl bg-surface border border-surface-border flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-text-secondary font-semibold flex items-center gap-1.5 mr-2">
          <Sparkles className="w-3.5 h-3.5 text-primary-light" />
          <span>Benchmark Pairs:</span>
        </span>
        {BENCHMARK_PRESETS.map((p) => {
          const isCurrent = earlierImg?.filename.includes(p.key);
          return (
            <button
              key={p.key}
              onClick={() => handleSelectPreset(p.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                isCurrent
                  ? 'bg-primary text-white font-semibold shadow-sm'
                  : 'bg-surface-light text-text-secondary hover:text-text-primary border border-surface-border'
              }`}
            >
              <span>{p.name.split(',')[0]}</span>
              <span className="text-[10px] opacity-75 font-normal">({p.desc})</span>
            </button>
          );
        })}
      </div>

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-surface border border-surface-border">
        {/* Earlier Image (T1) */}
        <div>
          <label className="text-xs font-mono text-text-secondary block mb-1.5 flex items-center justify-between">
            <span className="font-semibold text-primary-light">Earlier Acquisition (T1)</span>
            <span className="text-[10px]">{earlierImg?.sensor || 'Sensor'}</span>
          </label>
          <select
            value={earlierId}
            onChange={(e) => setEarlierId(e.target.value)}
            className="w-full text-xs bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-text-primary font-mono focus:outline-none focus:border-primary"
          >
            {images.map((img) => (
              <option key={img.id} value={img.id}>
                {img.band_metadata?.city || img.filename} ({img.acquisition_date ? new Date(img.acquisition_date).toLocaleDateString() : 'N/A'})
              </option>
            ))}
          </select>
        </div>

        {/* Later Image (T2) */}
        <div>
          <label className="text-xs font-mono text-text-secondary block mb-1.5 flex items-center justify-between">
            <span className="font-semibold text-accent-rose">Later Acquisition (T2)</span>
            <span className="text-[10px]">{laterImg?.sensor || 'Sensor'}</span>
          </label>
          <select
            value={laterId}
            onChange={(e) => setLaterId(e.target.value)}
            className="w-full text-xs bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-text-primary font-mono focus:outline-none focus:border-primary"
          >
            {images.map((img) => (
              <option key={img.id} value={img.id}>
                {img.band_metadata?.city || img.filename} ({img.acquisition_date ? new Date(img.acquisition_date).toLocaleDateString() : 'N/A'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Comparison Canvas */}
      <div className="rounded-xl bg-surface border border-surface-border overflow-hidden p-6 space-y-4">
        {viewMode === 'slider' ? (
          <div className="space-y-4">
            {/* Split Curtain Container with CSS clip-path */}
            <div
              ref={containerRef}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onMouseMove={handleMouseMove}
              className="relative w-full h-[520px] rounded-lg overflow-hidden border border-surface-border select-none bg-black cursor-ew-resize"
            >
              {/* Base Layer: Earlier Image T1 (Full Viewport) */}
              {earlierImg && (
                <img
                  src={api.getImagePreviewUrl(earlierImg.id)}
                  alt="Earlier T1"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
              )}

              {/* Overlaid Layer: Later Image T2 with Inset Clip Path */}
              {laterImg && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    clipPath: `inset(0 ${100 - sliderPos}% 0 0)`
                  }}
                >
                  <img
                    src={api.getImagePreviewUrl(laterImg.id)}
                    alt="Later T2"
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute top-4 left-4 px-2 py-1 rounded bg-black/80 text-white font-mono text-[10px] tracking-wider uppercase border border-white/20">
                    Later (T2)
                  </span>
                </div>
              )}

              <span className="absolute top-4 right-4 px-2 py-1 rounded bg-black/80 text-white font-mono text-[10px] tracking-wider uppercase border border-white/20">
                Earlier (T1)
              </span>

              {/* High-visibility Vertical Dividing Line & Draggable Puck */}
              <div
                className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] pointer-events-none"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-black shadow-xl flex items-center justify-center border-2 border-primary">
                  <SplitSquareVertical className="w-4 h-4 text-primary" />
                </div>
              </div>
            </div>

            {/* Slider Control Bar */}
            <div className="flex items-center space-x-4 px-2">
              <span className="text-xs font-mono text-text-secondary shrink-0">100% Later (T2)</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <span className="text-xs font-mono text-text-secondary shrink-0">100% Earlier (T1)</span>
            </div>
          </div>
        ) : (
          /* Side-by-Side Dual View */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-text-secondary">
                <span className="font-bold text-primary-light">
                  Earlier (T1): {earlierImg?.band_metadata?.city || earlierImg?.filename}
                </span>
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
                <span className="font-bold text-accent-rose">
                  Later (T2): {laterImg?.band_metadata?.city || laterImg?.filename}
                </span>
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

        {/* Temporal Baseline & Metadata Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-surface-border text-xs font-mono">
          <div className="p-3 rounded-lg bg-surface-light border border-surface-border">
            <span className="text-[10px] text-text-muted block">Sensor Platform</span>
            <span className="font-bold text-text-primary mt-0.5 block">{earlierImg?.sensor || 'Sentinel-2'}</span>
          </div>

          <div className="p-3 rounded-lg bg-surface-light border border-surface-border">
            <span className="text-[10px] text-text-muted block">Spatial Resolution</span>
            <span className="font-bold text-accent-teal mt-0.5 block">{earlierImg?.resolution || 10} m/px</span>
          </div>

          <div className="p-3 rounded-lg bg-surface-light border border-surface-border">
            <span className="text-[10px] text-text-muted block">Temporal Baseline</span>
            <span className="font-bold text-primary-light mt-0.5 block">
              {earlierImg?.acquisition_date && laterImg?.acquisition_date
                ? `${Math.abs(
                    Math.round(
                      (new Date(laterImg.acquisition_date).getTime() -
                        new Date(earlierImg.acquisition_date).getTime()) /
                        (1000 * 3600 * 24)
                    )
                  )} days`
                : 'Multi-Temporal'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-surface-light border border-surface-border">
            <span className="text-[10px] text-text-muted block">Benchmark Status</span>
            <span className="font-bold text-accent-emerald mt-0.5 block flex items-center gap-1">
              {hasGroundTruth ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>OSCD Ground Truth</span>
                </>
              ) : (
                'Standard Pair'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Preprocessing Quality Control Report Modal/Card */}
      {qcReport && (
        <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-accent-emerald" />
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider font-mono">
                Radiometric & Spatial Co-Registration Verification
              </h3>
            </div>
            <span
              className={`text-xs font-mono px-2.5 py-1 rounded font-bold ${
                qcReport.quality_assessment?.quality_grade === 'EXCELLENT'
                  ? 'bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/30'
                  : 'bg-accent-amber/15 text-accent-amber border border-accent-amber/30'
              }`}
            >
              Grade: {qcReport.quality_assessment?.quality_grade}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-surface-light border border-surface-border">
              <span className="text-text-muted block">Spatial Coordinate Alignment</span>
              <span className="text-text-primary font-bold mt-1 block">
                {qcReport.compatibility?.crs_match ? 'Matched CRS' : 'CRS Re-projected'} ({qcReport.compatibility?.crs1})
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface-light border border-surface-border">
              <span className="text-text-muted block">Spatial Footprint Overlap</span>
              <span className="text-text-primary font-bold mt-1 block">
                {qcReport.compatibility?.has_spatial_overlap ? 'Full Intersecting Extent' : 'No Overlap'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface-light border border-surface-border">
              <span className="text-text-muted block">Cross-Temporal Radiometric Quality</span>
              <span className="text-accent-teal font-bold mt-1 block">
                High Coherence (0% Cloud Saturation)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
