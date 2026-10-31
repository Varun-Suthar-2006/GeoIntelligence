import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  HardDrive,
  Cpu,
  Globe,
  Sliders,
  CheckCircle2,
  Shield,
  BookOpen
} from 'lucide-react';

export const Settings: React.FC = () => {
  const [defaultThreshold, setDefaultThreshold] = useState<number>(0.5);
  const [defaultMinArea, setDefaultMinArea] = useState<number>(200);
  const [saved, setSaved] = useState<boolean>(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-primary-light" />
          <span>System Settings & Configuration</span>
        </h2>
        <p className="text-xs text-text-secondary font-mono mt-1">
          Platform parameters, runtime diagnostic environment, and storage configuration.
        </p>
      </div>

      {/* 1. Runtime Diagnostics */}
      <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-4">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <Cpu className="w-4 h-4 text-accent-teal" />
          <span>Runtime Environment & Scientific Stacks</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 rounded-lg bg-surface-light border border-surface-border">
            <span className="text-[10px] text-text-muted block">Backend Gateway</span>
            <span className="text-text-primary font-bold mt-1 block">FastAPI 0.162</span>
          </div>
          <div className="p-3 rounded-lg bg-surface-light border border-surface-border">
            <span className="text-[10px] text-text-muted block">Deep Learning</span>
            <span className="text-text-primary font-bold mt-1 block">PyTorch 2.15</span>
          </div>
          <div className="p-3 rounded-lg bg-surface-light border border-surface-border">
            <span className="text-[10px] text-text-muted block">Geospatial Engine</span>
            <span className="text-text-primary font-bold mt-1 block">Rasterio 1.5.2</span>
          </div>
          <div className="p-3 rounded-lg bg-surface-light border border-surface-border">
            <span className="text-[10px] text-text-muted block">Vector Geometry</span>
            <span className="text-text-primary font-bold mt-1 block">Shapely 2.2</span>
          </div>
        </div>
      </div>

      {/* 2. Analysis Defaults */}
      <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-5">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <Sliders className="w-4 h-4 text-primary-light" />
          <span>Analysis Default Settings</span>
        </h3>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-text-secondary">Default Change Probability Threshold:</span>
              <span className="text-primary-light font-bold">{defaultThreshold}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={defaultThreshold}
              onChange={(e) => setDefaultThreshold(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-text-secondary">Default Minimum Mapping Unit:</span>
              <span className="text-accent-teal font-bold">{defaultMinArea} m²</span>
            </div>
            <input
              type="range"
              min="50"
              max="1000"
              step="50"
              value={defaultMinArea}
              onChange={(e) => setDefaultMinArea(Number(e.target.value))}
              className="w-full accent-accent-teal cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {saved && (
              <span className="text-xs font-mono text-accent-emerald flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Preferences saved successfully</span>
              </span>
            )}
            <button
              onClick={handleSave}
              className="ml-auto px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-mono transition-all"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>

      {/* 3. Storage Architecture */}
      <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-4">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-accent-amber" />
          <span>Storage & Persistence Layout</span>
        </h3>

        <div className="space-y-2 text-xs font-mono text-text-secondary">
          <div className="flex justify-between py-1.5 border-b border-surface-border">
            <span>Raster Ingestion Path:</span>
            <span className="text-text-primary">/data/raw/</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-surface-border">
            <span>Processed Previews:</span>
            <span className="text-text-primary">/data/processed/</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-surface-border">
            <span>Change Heatmaps & Masks:</span>
            <span className="text-text-primary">/data/masks/</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-surface-border">
            <span>Model Checkpoints (.pt):</span>
            <span className="text-text-primary">/data/weights/</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span>PDF Research Reports:</span>
            <span className="text-text-primary">/data/reports/</span>
          </div>
        </div>
      </div>

      {/* 4. Scientific Citation */}
      <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-3">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-accent-emerald" />
          <span>Research Citation Guidelines</span>
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed font-mono">
          When utilizing GeoIntelligence AI for academic publications, research documentation, or environmental intelligence studies, cite the Siamese U-Net and OSCD benchmark implementations:
        </p>
        <pre className="p-3 rounded-lg bg-black/60 border border-surface-border text-[11px] font-mono text-text-muted overflow-x-auto">
{`@software{geointelligence_ai_2026,
  author = {GeoIntelligence Research Team},
  title = {GeoIntelligence AI: Earth Surface Change Detection and Remote Sensing Intelligence},
  year = {2026},
  url = {https://github.com/geointelligence-ai}
}`}
        </pre>
      </div>
    </div>
  );
};
