import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  History,
  MapPin,
  FileText,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download
} from 'lucide-react';
import { api } from '../services/api';
import { Analysis } from '../types';

export const AnalysisHistory: React.FC = () => {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getAnalyses().then((res) => {
      setAnalyses(res);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
          <History className="w-6 h-6 text-primary-light" />
          <span>Analysis History & Audit Trail</span>
        </h2>
        <p className="text-xs text-text-secondary font-mono mt-1">
          Complete persistence history of multi-temporal change detection runs, parameters, and geospatial outputs.
        </p>
      </div>

      {/* Analyses Table */}
      <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-4">
        {analyses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-light text-text-secondary font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-3 rounded-l-lg">Title / ID</th>
                  <th className="py-3 px-3">Temporal Pair</th>
                  <th className="py-3 px-3">Model</th>
                  <th className="py-3 px-3">Primary Transition</th>
                  <th className="py-3 px-3">Affected Area</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 rounded-r-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {analyses.map((a) => {
                  const res = a.results?.[0];
                  return (
                    <tr key={a.id} className="hover:bg-surface-light/40 transition-colors">
                      <td className="py-3.5 px-3 font-medium text-text-primary">
                        <div>{a.title}</div>
                        <div className="text-[10px] font-mono text-text-muted">{a.id}</div>
                      </td>
                      <td className="py-3.5 px-3 text-text-secondary font-mono">
                        <div>{a.earlier_image?.filename || 'T1'}</div>
                        <div className="text-text-muted">vs {a.later_image?.filename || 'T2'}</div>
                      </td>
                      <td className="py-3.5 px-3 text-text-secondary">
                        {a.model?.model_name || 'AI Model'}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-surface-light border border-surface-border text-text-primary">
                          {res?.change_type || 'Unclassified'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-primary-light font-bold">
                        {res ? `${res.area_hectares} ha` : '0.0 ha'}
                      </td>
                      <td className="py-3.5 px-3 text-text-muted font-mono text-[11px]">
                        {new Date(a.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                            a.status === 'COMPLETED'
                              ? 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/30'
                              : 'bg-accent-amber/10 text-accent-amber border border-accent-amber/30'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right space-x-2">
                        <button
                          onClick={() => navigate(`/geospatial?analysis_id=${a.id}`)}
                          className="px-2.5 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary-light border border-primary/30 transition-all font-mono text-[11px]"
                        >
                          Inspect Map
                        </button>
                        <button
                          onClick={() => {
                            api.generateReport(a.id).then(() => navigate('/reports'));
                          }}
                          className="px-2.5 py-1 rounded bg-surface-light hover:bg-surface-border text-text-primary border border-surface-border transition-all font-mono text-[11px]"
                        >
                          PDF Report
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center rounded-lg border border-dashed border-surface-border">
            <p className="text-xs font-mono text-text-muted">No historical analyses recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
