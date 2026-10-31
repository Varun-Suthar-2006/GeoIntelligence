import React, { useEffect, useState } from 'react';
import { Globe, Cpu, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');

  useEffect(() => {
    fetch('http://127.0.0.1:8000/health')
      .then((res) => {
        if (res.ok) setBackendStatus('ONLINE');
        else setBackendStatus('OFFLINE');
      })
      .catch(() => setBackendStatus('OFFLINE'));
  }, []);

  return (
    <header className="h-16 bg-surface border-b border-surface-border px-6 flex items-center justify-between z-30 sticky top-0">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary-light">
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-wider text-text-primary uppercase flex items-center gap-2">
            GeoIntelligence <span className="text-primary-light font-mono text-xs px-2 py-0.5 rounded bg-primary/10 border border-primary/30">AI</span>
          </h1>
          <p className="text-xs text-text-secondary font-mono">Earth Surface Change Detection & Remote Sensing Intelligence</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Sensor & Pipeline indicators */}
        <div className="hidden md:flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-surface-light border border-surface-border text-text-secondary">
            <Layers className="w-3.5 h-3.5 text-accent-teal" />
            <span>Sentinel-2 L2A</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-surface-light border border-surface-border text-text-secondary">
            <Cpu className="w-3.5 h-3.5 text-primary-light" />
            <span>PyTorch 2.15</span>
          </div>
        </div>

        {/* Live Backend Connection Indicator */}
        <div
          className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono font-medium border ${
            backendStatus === 'ONLINE'
              ? 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/30'
              : 'bg-accent-rose/10 text-accent-rose border-accent-rose/30'
          }`}
        >
          {backendStatus === 'ONLINE' ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 animate-pulse" />
              <span>CORE API ACTIVE</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>CORE API OFFLINE</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
