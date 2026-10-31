import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Play,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  Clock,
  Layers,
  ShieldAlert,
  TrendingUp,
  FileCode
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { AIModel } from '../types';

export const AIModelCentre: React.FC = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [training, setTraining] = useState<boolean>(false);
  const [trainStatus, setTrainStatus] = useState<string | null>(null);
  const [epochs, setEpochs] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getModels().then((mods) => {
      setModels(mods);
      if (mods.length > 0) setSelectedModel(mods[0]);
      setLoading(false);
    });
  }, []);

  const handleTrainModel = async () => {
    setTraining(true);
    setTrainStatus('Initializing PyTorch DataLoader & Synthetic Benchmark Scenes...');
    try {
      const updated = await api.trainModel({ epochs, batch_size: 4, learning_rate: 0.001 });
      setTrainStatus('Training completed successfully! Model checkpoint & evaluation metrics updated.');
      // Refresh models
      const refreshed = await api.getModels();
      setModels(refreshed);
      setSelectedModel(updated);
      setTraining(false);
    } catch (err: any) {
      setTrainStatus(`Training execution failed: ${err.message}`);
      setTraining(false);
    }
  };

  // Model comparison dataset for Recharts
  const comparisonData = models.map((m) => ({
    name: m.model_name.length > 20 ? m.model_name.slice(0, 18) + '...' : m.model_name,
    f1_score: Number(((m.metrics?.f1_score || 0) * 100).toFixed(1)),
    iou: Number(((m.metrics?.iou || 0) * 100).toFixed(1)),
    precision: Number(((m.metrics?.precision || 0) * 100).toFixed(1)),
    recall: Number(((m.metrics?.recall || 0) * 100).toFixed(1)),
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <Cpu className="w-6 h-6 text-primary-light" />
            <span>AI Model Centre & Benchmark Registry</span>
          </h2>
          <p className="text-xs text-text-secondary font-mono mt-1">
            Evaluate, train, and benchmark multi-temporal change detection neural networks against analytical baselines.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-text-secondary bg-surface border border-surface-border px-3 py-1.5 rounded-lg">
          <Layers className="w-4 h-4 text-accent-teal" />
          <span>PyTorch 2.15 Core Engine</span>
        </div>
      </div>

      {/* Models Grid & Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Cards Column */}
        <div className="space-y-3">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted block">
            Registered Architectures
          </span>
          {models.map((m) => {
            const isSelected = selectedModel?.id === m.id;
            return (
              <div
                key={m.id}
                onClick={() => setSelectedModel(m)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-primary/10 border-primary shadow-sm'
                    : 'bg-surface border-surface-border hover:border-text-muted'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-text-primary">{m.model_name}</h3>
                    <div className="text-[10px] font-mono text-text-muted mt-0.5">{m.architecture}</div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-light border border-surface-border text-primary-light">
                    v{m.version}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-surface-border/50 text-[11px] font-mono">
                  <div>
                    <div className="text-text-muted text-[10px]">F1-Score</div>
                    <div className="text-primary-light font-bold">
                      {((m.metrics?.f1_score || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-text-muted text-[10px]">IoU</div>
                    <div className="text-accent-teal font-bold">
                      {((m.metrics?.iou || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-text-muted text-[10px]">Latency</div>
                    <div className="text-text-secondary font-bold">
                      {m.metrics?.latency_ms || 45} ms
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Model Details & Training Trigger */}
        <div className="lg:col-span-2 space-y-6">
          {selectedModel && (
            <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
                <div>
                  <span className="text-[10px] font-mono text-primary-light uppercase tracking-wider font-semibold">
                    Architecture Specification
                  </span>
                  <h3 className="text-base font-bold text-text-primary">{selectedModel.model_name}</h3>
                </div>

                <div className="flex items-center space-x-2 text-xs font-mono">
                  <span className="text-text-muted">Dataset:</span>
                  <span className="px-2 py-0.5 rounded bg-surface-light text-text-primary border border-surface-border">
                    {selectedModel.training_dataset}
                  </span>
                </div>
              </div>

              {/* Evaluation Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-lg bg-surface-light border border-surface-border">
                  <div className="text-[10px] font-mono text-text-secondary">Precision</div>
                  <div className="text-xl font-bold font-mono text-accent-emerald mt-1">
                    {((selectedModel.metrics?.precision || 0) * 100).toFixed(2)}%
                  </div>
                  <div className="text-[10px] font-mono text-text-muted mt-0.5">TP / (TP + FP)</div>
                </div>

                <div className="p-3.5 rounded-lg bg-surface-light border border-surface-border">
                  <div className="text-[10px] font-mono text-text-secondary">Recall / Sensitivity</div>
                  <div className="text-xl font-bold font-mono text-primary-light mt-1">
                    {((selectedModel.metrics?.recall || 0) * 100).toFixed(2)}%
                  </div>
                  <div className="text-[10px] font-mono text-text-muted mt-0.5">TP / (TP + FN)</div>
                </div>

                <div className="p-3.5 rounded-lg bg-surface-light border border-surface-border">
                  <div className="text-[10px] font-mono text-text-secondary">F1-Score</div>
                  <div className="text-xl font-bold font-mono text-accent-amber mt-1">
                    {((selectedModel.metrics?.f1_score || 0) * 100).toFixed(2)}%
                  </div>
                  <div className="text-[10px] font-mono text-text-muted mt-0.5">Harmonic Mean</div>
                </div>

                <div className="p-3.5 rounded-lg bg-surface-light border border-surface-border">
                  <div className="text-[10px] font-mono text-text-secondary">Intersection over Union</div>
                  <div className="text-xl font-bold font-mono text-accent-teal mt-1">
                    {((selectedModel.metrics?.iou || 0) * 100).toFixed(2)}%
                  </div>
                  <div className="text-[10px] font-mono text-text-muted mt-0.5">Jaccard Index</div>
                </div>
              </div>

              {/* Training Box (Only for Siamese / Trainable models) */}
              {selectedModel.architecture.includes('Siamese') && (
                <div className="p-4 rounded-xl bg-surface-light/60 border border-surface-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5 font-mono">
                        <TrendingUp className="w-4 h-4 text-accent-emerald" />
                        <span>Reproducible PyTorch Training Pipeline</span>
                      </h4>
                      <p className="text-[11px] text-text-secondary font-mono mt-0.5">
                        Trains weights on multi-temporal patches with Combined BCE + Soft Dice Loss and saves checkpoint.
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1.5 text-xs font-mono">
                        <span className="text-text-muted">Epochs:</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={epochs}
                          onChange={(e) => setEpochs(Number(e.target.value))}
                          className="w-14 px-2 py-1 rounded bg-surface border border-surface-border text-text-primary text-xs font-mono"
                        />
                      </div>

                      <button
                        onClick={handleTrainModel}
                        disabled={training}
                        className="px-4 py-2 rounded-lg bg-accent-emerald hover:bg-emerald-600 disabled:bg-surface text-white text-xs font-mono font-medium flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        {training ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Training Active...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Trigger Training</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {trainStatus && (
                    <div className="p-2.5 rounded-lg bg-surface border border-surface-border text-[11px] font-mono text-accent-emerald flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{trainStatus}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Model Comparison Chart */}
          <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Multi-Model Performance Benchmark</h3>
              <p className="text-xs text-text-secondary font-mono">Comparative F1-Score & IoU across registered algorithms (%)</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6B7280" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#F9FAFB' }}
                    itemStyle={{ color: '#F9FAFB', fontSize: '12px', fontFamily: 'monospace' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                  <Bar dataKey="f1_score" name="F1-Score (%)" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="iou" name="IoU (%)" fill="#0D9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
