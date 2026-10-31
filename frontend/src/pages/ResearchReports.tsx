import React, { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Plus
} from 'lucide-react';
import { api } from '../services/api';
import { ReportItem, Analysis } from '../types';

export const ResearchReports: React.FC = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>('');
  const [generating, setGenerating] = useState<boolean>(false);
  const [reportTitle, setReportTitle] = useState<string>('Geospatial Intelligence Research Report');

  const loadData = () => {
    Promise.all([api.getReports(), api.getAnalyses()]).then(([reps, anas]) => {
      setReports(reps);
      const completed = anas.filter((a) => a.status === 'COMPLETED');
      setAnalyses(completed);
      if (completed.length > 0 && !selectedAnalysisId) {
        setSelectedAnalysisId(completed[0].id);
      }
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnalysisId) return;
    setGenerating(true);
    try {
      await api.generateReport(selectedAnalysisId, reportTitle);
      setGenerating(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to generate report');
      setGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary-light" />
          <span>Research Reports & Intelligence Export</span>
        </h2>
        <p className="text-xs text-text-secondary font-mono mt-1">
          Compile publication-grade PDF intelligence reports containing area tables, spatial metrics, and research disclaimers.
        </p>
      </div>

      {/* Report Generator Box */}
      <form onSubmit={handleGenerateReport} className="p-6 rounded-xl bg-surface border border-surface-border space-y-4">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary-light" />
          <span>Compile New Intelligence Report</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-mono text-text-secondary block mb-1">Select Completed Analysis</label>
            <select
              value={selectedAnalysisId}
              onChange={(e) => setSelectedAnalysisId(e.target.value)}
              className="w-full text-xs bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-text-primary font-mono focus:outline-none focus:border-primary"
            >
              {analyses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} ({new Date(a.created_at).toLocaleDateString()}) - {a.results[0]?.area_hectares || 0} ha
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-mono text-text-secondary block mb-1">Report Title</label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full text-xs bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-text-primary font-mono focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={generating || !selectedAnalysisId}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark disabled:bg-surface-light text-white text-xs font-mono font-medium flex items-center space-x-2 transition-all shadow-sm"
          >
            {generating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Compiling ReportLab PDF...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>Generate PDF Report</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Generated Reports List */}
      <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h3 className="text-sm font-semibold text-text-primary">Archived Scientific Reports</h3>
          <span className="text-xs font-mono text-text-muted">{reports.length} Reports Generated</span>
        </div>

        {reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-xl bg-surface-light/40 border border-surface-border flex items-center justify-between gap-4 hover:border-text-muted transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary-light shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">{r.title}</h4>
                    <div className="text-[11px] font-mono text-text-secondary mt-0.5">
                      Analysis: {r.analysis_id.slice(0, 8)}... | Model: {r.report_metadata?.model || 'Siamese U-Net'}
                    </div>
                    <div className="text-[10px] font-mono text-text-muted mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(r.generated_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <a
                  href={api.getReportDownloadUrl(r.id)}
                  download
                  className="px-3 py-1.5 rounded-lg bg-surface-light hover:bg-surface-border border border-surface-border text-xs font-mono text-primary-light flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center rounded-lg border border-dashed border-surface-border">
            <p className="text-xs font-mono text-text-muted">No reports generated yet. Use the form above to compile one.</p>
          </div>
        )}
      </div>
    </div>
  );
};
