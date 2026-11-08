import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Download,
  Filter,
  Layers,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Analysis, ChangeResult } from '../types';

const CATEGORY_COLORS: Record<string, string> = {
  'Deforestation / Vegetation Loss': '#E11D48',
  'Flood / Water Inundation': '#2563EB',
  'Urban Expansion': '#D97706',
  'Agricultural Change': '#059669',
  'Unclassified Change': '#8B5CF6',
};

function AutoFitBounds({ geojson }: { geojson: any }) {
  const map = useMap();
  useEffect(() => {
    if (geojson && geojson.features && geojson.features.length > 0) {
      try {
        const layer = L.geoJSON(geojson);
        map.fitBounds(layer.getBounds(), { padding: [40, 40] });
      } catch (e) {
        console.error(e);
      }
    }
  }, [geojson, map]);
  return null;
}

export const GeospatialIntelligence: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>('');
  const [geojson, setGeojson] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeClasses, setActiveClasses] = useState<Record<string, boolean>>({
    'Deforestation / Vegetation Loss': true,
    'Flood / Water Inundation': true,
    'Urban Expansion': true,
    'Agricultural Change': true,
    'Unclassified Change': true,
  });
  const [basemap, setBasemap] = useState<'esri' | 'dark' | 'osm'>('esri');

  useEffect(() => {
    api.getAnalyses().then((res) => {
      setAnalyses(res);
      const queryId = searchParams.get('analysis_id');
      if (queryId && res.some((a) => a.id === queryId)) {
        setSelectedAnalysisId(queryId);
      } else if (res.length > 0) {
        setSelectedAnalysisId(res[0].id);
      }
      setLoading(false);
    });
  }, [searchParams]);

  useEffect(() => {
    if (!selectedAnalysisId) return;
    setLoading(true);
    Promise.all([
      api.getAnalysisGeoJSON(selectedAnalysisId),
      api.getAnalysisStatistics(selectedAnalysisId),
    ])
      .then(([geo, st]) => {
        setGeojson(geo);
        setStats(st);
        setSelectedFeature(null);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedAnalysisId]);

  const styleFeature = (feature: any) => {
    const changeType = feature.properties?.change_type || 'Unclassified Change';
    const color = CATEGORY_COLORS[changeType] || '#3B82F6';
    return {
      color: color,
      weight: 2,
      opacity: 0.9,
      fillColor: color,
      fillOpacity: 0.45,
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    layer.on({
      click: () => {
        setSelectedFeature(feature);
      },
    });
    const p = feature.properties || {};
    layer.bindPopup(`
      <div style="font-family: monospace; font-size: 11px;">
        <b style="color: ${CATEGORY_COLORS[p.change_type] || '#2563EB'};">${p.change_type}</b><br/>
        <b>Area:</b> ${p.area_ha} ha (${p.area_sq_m} m²)<br/>
        <b>Confidence:</b> ${(p.confidence * 100).toFixed(1)}%<br/>
        <small style="color: #6B7280;">CRS: ${p.crs_used_for_area}</small>
      </div>
    `);
  };

  const handleExportGeoJSON = () => {
    if (!geojson) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(geojson));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `GeoIntelligence_Change_Polygons_${selectedAnalysisId.slice(0, 8)}.geojson`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-background">
      {/* Left Control & Inspection Sidebar */}
      <div className="w-80 border-r border-surface-border bg-surface flex flex-col shrink-0">
        <div className="p-4 border-b border-surface-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-light" />
              <span>Geospatial Intelligence</span>
            </h2>
          </div>

          {/* Analysis Selection */}
          <div>
            <label className="text-[11px] font-mono text-text-secondary block mb-1">Select Analysis Session</label>
            <select
              value={selectedAnalysisId}
              onChange={(e) => setSelectedAnalysisId(e.target.value)}
              className="w-full text-xs bg-surface-light border border-surface-border rounded-lg px-2.5 py-2 text-text-primary font-mono focus:outline-none focus:border-primary"
            >
              {analyses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} ({new Date(a.created_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          {/* Export GeoJSON Button */}
          <button
            onClick={handleExportGeoJSON}
            disabled={!geojson}
            className="w-full py-2 rounded-lg bg-surface-light hover:bg-surface-border border border-surface-border text-xs font-mono text-text-primary flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-accent-teal" />
            <span>Export RFC 7946 GeoJSON</span>
          </button>
        </div>

        {/* Category Legend & Toggles */}
        <div className="p-4 border-b border-surface-border space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted block">
            Transition Categories
          </span>
          <div className="space-y-1.5">
            {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
              <label
                key={cat}
                className="flex items-center space-x-2 text-xs font-mono text-text-secondary cursor-pointer hover:text-text-primary"
              >
                <input
                  type="checkbox"
                  checked={activeClasses[cat]}
                  onChange={() => setActiveClasses((prev) => ({ ...prev, [cat]: !prev[cat] }))}
                  className="rounded border-surface-border bg-surface-light accent-primary"
                />
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="truncate">{cat}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Selected Polygon Inspector or Summary */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedFeature ? (
            <div className="p-4 rounded-xl bg-surface-light border border-surface-border space-y-3">
              <span className="text-[10px] font-mono text-primary-light uppercase tracking-wider block font-semibold">
                Inspected Polygon
              </span>
              <div
                className="text-xs font-bold font-mono"
                style={{ color: CATEGORY_COLORS[selectedFeature.properties?.change_type] || '#2563EB' }}
              >
                {selectedFeature.properties?.change_type}
              </div>

              <div className="space-y-1.5 text-xs font-mono text-text-secondary border-t border-surface-border pt-2">
                <div className="flex justify-between">
                  <span>Hectares:</span>
                  <span className="text-text-primary font-bold">{selectedFeature.properties?.area_ha} ha</span>
                </div>
                <div className="flex justify-between">
                  <span>Metric Area:</span>
                  <span className="text-text-primary">{selectedFeature.properties?.area_sq_m} m²</span>
                </div>
                <div className="flex justify-between">
                  <span>Confidence:</span>
                  <span className="text-text-primary">
                    {((selectedFeature.properties?.confidence || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Projection:</span>
                  <span className="text-text-primary text-[10px]">{selectedFeature.properties?.crs_used_for_area}</span>
                </div>
              </div>
            </div>
          ) : stats ? (
            <div className="space-y-3">
              <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider block">
                Session Ground Quantification
              </span>
              <div className="p-3 rounded-lg bg-surface-light border border-surface-border space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Total Changed Area:</span>
                  <span className="text-accent-rose font-bold">{stats.area_hectares} ha</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Square Kilometers:</span>
                  <span className="text-text-primary">{stats.area_sq_km} km²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Scene Coverage:</span>
                  <span className="text-primary-light font-bold">{stats.change_percentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Polygon Count:</span>
                  <span className="text-accent-amber font-bold">{stats.polygon_count}</span>
                </div>
              </div>

              {/* Class Breakdown List */}
              <div className="space-y-1 text-xs font-mono">
                <span className="text-[10px] text-text-muted">Class-wise Area (ha):</span>
                {Object.entries(stats.class_breakdown_ha || {}).map(([k, v]: [string, any]) => (
                  <div key={k} className="flex justify-between text-[11px] py-1 border-b border-surface-border">
                    <span className="text-text-secondary truncate">{k}</span>
                    <span className="text-text-primary font-medium">{v} ha</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Main Geographical Map */}
      <div className="flex-1 relative h-full">
        {/* Floating Basemap Selector */}
        <div className="absolute top-4 right-4 z-[1000] flex bg-surface/90 backdrop-blur-md border border-surface-border rounded-xl p-1 shadow-lg text-[10px] font-mono">
          <button
            onClick={() => setBasemap('esri')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              basemap === 'esri' ? 'bg-primary text-white font-semibold shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Satellite Imagery
          </button>
          <button
            onClick={() => setBasemap('dark')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              basemap === 'dark' ? 'bg-primary text-white font-semibold shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Dark Tactical
          </button>
          <button
            onClick={() => setBasemap('osm')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              basemap === 'osm' ? 'bg-primary text-white font-semibold shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Street Map
          </button>
        </div>

        <MapContainer
          center={[43.61, 1.45]}
          zoom={13}
          className="w-full h-full"
          zoomControl={true}
        >
          {basemap === 'esri' && (
            <TileLayer
              attribution="Tiles &copy; Esri &mdash; World Imagery"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
          )}
          {basemap === 'dark' && (
            <TileLayer
              attribution="&copy; CartoDB Dark Matter"
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              maxZoom={19}
            />
          )}
          {basemap === 'osm' && (
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          )}

          {geojson && (
            <>
              <AutoFitBounds geojson={geojson} />
              <GeoJSON
                key={`${selectedAnalysisId}-${JSON.stringify(activeClasses)}`}
                data={geojson}
                filter={(feature) => {
                  const type = feature.properties?.change_type || 'Unclassified Change';
                  return activeClasses[type] !== false;
                }}
                style={styleFeature}
                onEachFeature={onEachFeature}
              />
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
};
