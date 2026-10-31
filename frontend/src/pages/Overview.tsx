import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Layers,
  MapPin,
  Cpu,
  TrendingUp,
  ArrowRight,
  Database,
  Calendar,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { api } from '../services/api';
import { DashboardOverview } from '../types';

const CLASS_COLORS: Record<string, string> = {
  Deforestation: '#E11D48', // Rose
  Flood: '#2563EB', // Blue
  'Urban Expansion': '#D97706', // Amber
  'Agricultural Change': '#059669', // Emerald
  Unclassified: '#8B5CF6', // Purple
};

export const Overview: React.FC = () => {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getDashboardOverview()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to connect to backend server');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-text-secondary">Querying persistence layer & computing live statistics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="p-6 rounded-xl bg-accent-rose/10 border border-accent-rose/30 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-accent-rose shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-text-primary">System Data Unavailable</h3>
            <p className="text-xs text-text-secondary mt-1">{error || 'Could not retrieve operational database statistics.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Overview Dashboard</h2>
          <p className="text-xs text-text-secondary font-mono mt-1">
            Empirical multi-temporal earth observation metrics derived from PostgreSQL/PostGIS.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/detection"
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-medium flex items-center space-x-2 transition-all shadow-sm"
          >
            <Activity className="w-4 h-4" />
            <span>Launch Change Analysis</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-xl bg-surface border border-surface-border">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-xs font-mono">Total Analyses</span>
            <Activity className="w-4 h-4 text-primary-light" />
          </div>
          <div className="text-2xl font-bold text-text-primary mt-2 font-mono">{data.total_analyses}</div>
          <div className="text-[11px] text-text-muted mt-1">Multi-temporal sessions</div>
        </div>

        <div className="p-5 rounded-xl bg-surface border border-surface-border">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-xs font-mono">Satellite Images</span>
            <Layers className="w-4 h-4 text-accent-teal" />
          </div>
          <div className="text-2xl font-bold text-text-primary mt-2 font-mono">{data.total_images}</div>
          <div className="text-[11px] text-text-muted mt-1">Ingested & georeferenced</div>
        </div>

        <div className="p-5 rounded-xl bg-surface border border-surface-border">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-xs font-mono">Changed Area</span>
            <MapPin className="w-4 h-4 text-accent-rose" />
          </div>
          <div className="text-2xl font-bold text-accent-rose mt-2 font-mono">
            {data.total_area_analyzed_ha} <span className="text-xs font-normal text-text-secondary">ha</span>
          </div>
          <div className="text-[11px] text-text-muted mt-1">Metric Equal-Area (EPSG:6933)</div>
        </div>

        <div className="p-5 rounded-xl bg-surface border border-surface-border">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-xs font-mono">Change Polygons</span>
            <TrendingUp className="w-4 h-4 text-accent-amber" />
          </div>
          <div className="text-2xl font-bold text-text-primary mt-2 font-mono">{data.total_change_polygons}</div>
          <div className="text-[11px] text-text-muted mt-1">Discrete vector contours</div>
        </div>

        <div className="p-5 rounded-xl bg-surface border border-surface-border">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-xs font-mono">AI Models</span>
            <Cpu className="w-4 h-4 text-primary-light" />
          </div>
          <div className="text-2xl font-bold text-text-primary mt-2 font-mono">{data.total_models}</div>
          <div className="text-[11px] text-text-muted mt-1">Active architectures</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class distribution chart */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-surface border border-surface-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Transition Category Distribution</h3>
              <p className="text-xs text-text-secondary font-mono">Total area affected across detected spectral categories (Hectares)</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-light text-text-muted border border-surface-border">
              Metric Ground Area
            </span>
          </div>

          <div className="h-64 w-full">
            {data.class_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.class_distribution} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#F9FAFB' }}
                    itemStyle={{ color: '#F9FAFB', fontSize: '12px', fontFamily: 'monospace' }}
                  />
                  <Bar dataKey="hectares" radius={[4, 4, 0, 0]}>
                    {data.class_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CLASS_COLORS[entry.name] || '#2563EB'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-xs font-mono">
                No surface changes registered yet. Run an analysis to populate chart.
              </div>
            )}
          </div>
        </div>

        {/* Geographic Distribution Info */}
        <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Geographic Coverage</h3>
            <p className="text-xs text-text-secondary font-mono mt-1">Satellite scene extent & sensors</p>
            
            <div className="mt-6 space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-surface-border">
                <span className="text-text-secondary">Primary Sensor</span>
                <span className="font-mono text-text-primary font-medium">Sentinel-2A / 2B MSI</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-surface-border">
                <span className="text-text-secondary">Ground Sample Distance (GSD)</span>
                <span className="font-mono text-text-primary font-medium">10.0 meters / pixel</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-surface-border">
                <span className="text-text-secondary">Registered Datasets</span>
                <span className="font-mono text-text-primary font-medium">{data.total_datasets} datasets</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-text-secondary">Reference Coordinate System</span>
                <span className="font-mono text-text-primary font-medium">WGS84 (EPSG:4326)</span>
              </div>
            </div>
          </div>

          <Link
            to="/explorer"
            className="w-full py-2.5 rounded-lg bg-surface-light hover:bg-surface-border text-primary-light text-xs font-medium text-center flex items-center justify-center space-x-2 transition-all border border-surface-border"
          >
            <span>Explore on Interactive Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Recent Analyses Table */}
      <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Recent Multi-Temporal Analyses</h3>
            <p className="text-xs text-text-secondary font-mono">Actual records stored in database history</p>
          </div>
          <Link to="/history" className="text-xs font-mono text-primary-light hover:underline flex items-center gap-1">
            <span>View All History</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {data.recent_analyses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-light text-text-secondary font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Title / ID</th>
                  <th className="py-2.5 px-3">Temporal Pair</th>
                  <th className="py-2.5 px-3">AI Model</th>
                  <th className="py-2.5 px-3">Primary Change</th>
                  <th className="py-2.5 px-3">Affected Area</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 rounded-r-lg text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {data.recent_analyses.map((a) => (
                  <tr key={a.id} className="hover:bg-surface-light/40 transition-colors">
                    <td className="py-3 px-3 font-medium text-text-primary">
                      <div>{a.title}</div>
                      <div className="text-[10px] font-mono text-text-muted">{a.id.slice(0, 8)}...</div>
                    </td>
                    <td className="py-3 px-3 text-text-secondary font-mono">
                      <div>{a.earlier_image}</div>
                      <div className="text-text-muted">vs {a.later_image}</div>
                    </td>
                    <td className="py-3 px-3 text-text-secondary">{a.model_name}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-surface-light border border-surface-border text-text-primary">
                        {a.change_type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-primary-light font-medium">
                      {a.area_ha} ha
                    </td>
                    <td className="py-3 px-3">
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
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/geospatial?analysis_id=${a.id}`}
                        className="px-2.5 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary-light border border-primary/30 transition-all font-mono text-[11px]"
                      >
                        Inspect Map
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center rounded-lg border border-dashed border-surface-border">
            <p className="text-xs font-mono text-text-muted">No historical analyses registered yet.</p>
            <Link
              to="/detection"
              className="mt-3 inline-block px-3 py-1.5 rounded-lg bg-primary/15 text-primary-light text-xs font-mono hover:bg-primary/25 border border-primary/30"
            >
              Start First Change Analysis
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
