import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Rectangle, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  Layers,
  Calendar,
  MapPin,
  Eye,
  Info,
  CheckCircle2,
  Cloud,
  Compass,
  Search,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Globe,
  Crosshair,
  Wind,
  Thermometer,
  CloudRain,
  Gauge,
  Activity,
  Navigation,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Square,
  Radio,
  SlidersHorizontal,
  Flame,
  Droplets
} from 'lucide-react';
import { api } from '../services/api';
import { SatelliteImage, Dataset, STACHotspot, STACGranule, MeteorologicalIntelligence, AOITrackResult } from '../types';

// Fix default leaflet marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

function CoordinateTracker({
  onCoordChange,
  isSelectingAoi,
  onMapClick,
}: {
  onCoordChange: (lat: number, lon: number) => void;
  isSelectingAoi: boolean;
  onMapClick: (lat: number, lon: number) => void;
}) {
  useMapEvents({
    mousemove(e) {
      onCoordChange(e.latlng.lat, e.latlng.lng);
    },
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Preset research & operational AOIs for rapid demonstration
const PRESET_AOIS = [
  {
    name: 'Montpellier Urban Center',
    category: 'Urban Expansion',
    bbox: [3.84, 43.58, 3.92, 43.64] as [number, number, number, number],
    center: [43.61, 3.88] as [number, number],
  },
  {
    name: 'Valencia Riverbed Zone',
    category: 'Hydrology & Flooding',
    bbox: [-0.42, 39.43, -0.32, 39.50] as [number, number, number, number],
    center: [39.465, -0.37] as [number, number],
  },
  {
    name: 'Las Vegas Desert Basin',
    category: 'Suburban Soil Sealing',
    bbox: [-115.22, 36.12, -115.10, 36.20] as [number, number, number, number],
    center: [36.16, -115.16] as [number, number],
  },
  {
    name: 'Dubai Palm & Coastline',
    category: 'Coastal Land Reclamation',
    bbox: [55.10, 25.08, 55.20, 25.16] as [number, number, number, number],
    center: [25.12, 55.15] as [number, number],
  },
  {
    name: 'Rio Coastal Forest',
    category: 'Deforestation & Vegetation',
    bbox: [-43.25, -22.95, -43.15, -22.88] as [number, number, number, number],
    center: [-22.915, -43.20] as [number, number],
  },
  {
    name: 'ISRO Bangalore Space City',
    category: 'Tech Corridor Growth',
    bbox: [77.54, 12.92, 77.66, 13.04] as [number, number, number, number],
    center: [12.98, 77.60] as [number, number],
  },
  {
    name: 'Sriharikota SHAR Range',
    category: 'Coastal Barrier Island',
    bbox: [80.18, 13.68, 80.28, 13.78] as [number, number, number, number],
    center: [13.73, 80.23] as [number, number],
  },
];

export const SatelliteExplorer: React.FC = () => {
  const [images, setImages] = useState<SatelliteImage[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<SatelliteImage | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lon: number }>({ lat: 43.6045, lon: 3.8767 });
  const [mapCenter, setMapCenter] = useState<[number, number]>([43.6045, 3.8767]);
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [basemap, setBasemap] = useState<'esri' | 'dark' | 'osm'>('esri');
  const [loading, setLoading] = useState(true);

  // Live STAC Catalog State
  const [hotspots, setHotspots] = useState<STACHotspot[]>([]);
  const [activeHotspot, setActiveHotspot] = useState<string>('montpellier');
  const [stacGranules, setStacGranules] = useState<STACGranule[]>([]);
  const [searchingStac, setSearchingStac] = useState<boolean>(false);
  const [stacDrawerOpen, setStacDrawerOpen] = useState<boolean>(false);

  // AOI (Area of Interest) Selection State
  const [isSelectingAoi, setIsSelectingAoi] = useState<boolean>(false);
  const [aoiStartPoint, setAoiStartPoint] = useState<[number, number] | null>(null);
  const [selectedAoi, setSelectedAoi] = useState<[number, number, number, number] | null>([3.84, 43.58, 3.92, 43.64]);
  const [activePresetName, setActivePresetName] = useState<string>('Montpellier Urban Center');

  // Real-time Environmental & Atmospheric Telemetry State
  const [weather, setWeather] = useState<MeteorologicalIntelligence | null>(null);
  const [loadingWeather, setLoadingWeather] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // AOI Change Tracking State
  const [trackingChanges, setTrackingChanges] = useState<boolean>(false);
  const [aoiResult, setAoiResult] = useState<AOITrackResult | null>(null);
  const [activeRightTab, setActiveRightTab] = useState<'aoi' | 'scene'>('aoi');

  useEffect(() => {
    Promise.all([
      api.getImages(),
      api.getDatasets(),
      api.getStacHotspots()
    ])
      .then(([imgs, dsets, spots]) => {
        setImages(imgs);
        setDatasets(dsets);
        setHotspots(spots);
        if (imgs.length > 0) {
          setSelectedImage(imgs[0]);
          if (imgs[0].bounds) {
            const lat = (imgs[0].bounds.min_lat + imgs[0].bounds.max_lat) / 2;
            const lon = (imgs[0].bounds.min_lon + imgs[0].bounds.max_lon) / 2;
            setMapCenter([lat, lon]);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Initialization error:', err);
        setLoading(false);
      });

    // Initial weather fetch for default AOI
    if (selectedAoi) {
      fetchWeather(selectedAoi);
    }
  }, []);

  const fetchWeather = async (bbox: [number, number, number, number]) => {
    setLoadingWeather(true);
    setWeatherError(null);
    try {
      const data = await api.getEnvironmentalConditions({ bbox });
      setWeather(data);
    } catch (err: any) {
      console.error('Weather fetch error:', err);
      setWeatherError('Failed to retrieve atmospheric telemetry');
    } finally {
      setLoadingWeather(false);
    }
  };

  const handleMapClick = (lat: number, lon: number) => {
    if (!isSelectingAoi) {
      // If not in AOI selection mode, fetch weather for this clicked coordinate
      fetchWeatherForPoint(lat, lon);
      return;
    }

    if (!aoiStartPoint) {
      // First corner placed
      setAoiStartPoint([lat, lon]);
    } else {
      // Second corner placed, finalize bounding box
      const min_lon = Math.min(aoiStartPoint[1], lon);
      const max_lon = Math.max(aoiStartPoint[1], lon);
      const min_lat = Math.min(aoiStartPoint[0], lat);
      const max_lat = Math.max(aoiStartPoint[0], lat);
      const newBbox: [number, number, number, number] = [min_lon, min_lat, max_lon, max_lat];

      setSelectedAoi(newBbox);
      setAoiStartPoint(null);
      setIsSelectingAoi(false);
      setActivePresetName('Custom Map Selection');
      setActiveRightTab('aoi');
      setAoiResult(null);

      // Fetch environmental telemetry for new AOI
      fetchWeather(newBbox);
    }
  };

  const fetchWeatherForPoint = async (lat: number, lon: number) => {
    setLoadingWeather(true);
    try {
      const data = await api.getEnvironmentalConditions({ lat, lon });
      setWeather(data);
      setActiveRightTab('aoi');
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWeather(false);
    }
  };

  const handleSelectPresetAoi = (preset: typeof PRESET_AOIS[0]) => {
    setSelectedAoi(preset.bbox);
    setActivePresetName(preset.name);
    setMapCenter(preset.center);
    setMapZoom(13);
    setAoiResult(null);
    setActiveRightTab('aoi');
    fetchWeather(preset.bbox);
  };

  const handleTrackAoiChanges = async () => {
    if (!selectedAoi) return;
    setTrackingChanges(true);
    try {
      const result = await api.trackAoiChanges({
        bbox: selectedAoi,
        threshold: 0.5,
      });
      setAoiResult(result);
      if (result.meteorological_intelligence) {
        setWeather(result.meteorological_intelligence);
      }
    } catch (err: any) {
      console.error('AOI tracking error:', err);
      alert('Error tracking AOI changes: ' + (err.message || 'Server timeout or invalid bounding box'));
    } finally {
      setTrackingChanges(false);
    }
  };

  const handleSelectHotspot = async (spot: STACHotspot) => {
    setActiveHotspot(spot.id);
    setStacDrawerOpen(true);
    const centerLat = (spot.bbox[1] + spot.bbox[3]) / 2;
    const centerLon = (spot.bbox[0] + spot.bbox[2]) / 2;
    setMapCenter([centerLat, centerLon]);
    setMapZoom(12);

    // Also update AOI
    setSelectedAoi(spot.bbox);
    setActivePresetName(spot.name);
    fetchWeather(spot.bbox);

    setSearchingStac(true);
    try {
      const res = await api.searchStacGranules({
        bbox: spot.bbox,
        datetime_range: spot.default_date_range,
        max_cloud_cover: 20.0,
        limit: 4,
      });
      setStacGranules(res.granules || []);
    } catch (e) {
      console.error('STAC search error:', e);
    } finally {
      setSearchingStac(false);
    }
  };

  const handleSelectImage = (img: SatelliteImage) => {
    setSelectedImage(img);
    setActiveRightTab('scene');
    if (img.bounds) {
      const lat = (img.bounds.min_lat + img.bounds.max_lat) / 2;
      const lon = (img.bounds.min_lon + img.bounds.max_lon) / 2;
      setMapCenter([lat, lon]);
      setMapZoom(13);
    }
  };

  const filteredImages = selectedDataset
    ? images.filter((img) => img.dataset_id === selectedDataset)
    : images;

  // Selected AOI Leaflet Bounds [[min_lat, min_lon], [max_lat, max_lon]]
  const aoiBounds: [[number, number], [number, number]] | null = selectedAoi
    ? [
        [selectedAoi[1], selectedAoi[0]],
        [selectedAoi[3], selectedAoi[2]],
      ]
    : null;

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-background">
      {/* Left Sidebar: Catalog, Sensors & AOI Presets */}
      <div className="w-80 border-r border-surface-border bg-surface flex flex-col shrink-0 z-10">
        <div className="p-3.5 border-b border-surface-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary-light" />
              <span>Catalog & Sensors</span>
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-light border border-surface-border text-text-muted">
              {filteredImages.length} Scenes
            </span>
          </div>

          {/* Quick AOI Draw Action */}
          <div className="pt-1">
            <button
              onClick={() => {
                setIsSelectingAoi(!isSelectingAoi);
                setAoiStartPoint(null);
              }}
              className={`w-full py-2 px-3 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all border ${
                isSelectingAoi
                  ? 'bg-accent-amber/20 text-accent-amber border-accent-amber animate-pulse'
                  : 'bg-primary/10 text-primary-light border-primary/30 hover:bg-primary/20'
              }`}
            >
              <Crosshair className="w-4 h-4" />
              <span>{isSelectingAoi ? 'Click 2 Corners on Map...' : '📐 Select Area of Interest (AOI)'}</span>
            </button>
            {isSelectingAoi && (
              <p className="text-[10px] font-mono text-accent-amber text-center mt-1">
                {aoiStartPoint ? '📍 Corner 1 set! Click opposite corner.' : '📍 Click on map to place 1st corner'}
              </p>
            )}
          </div>

          {/* Preset AOIs Dropdown */}
          <div>
            <label className="text-[11px] font-mono text-text-secondary block mb-1">Preset AOI Targets</label>
            <select
              value={activePresetName}
              onChange={(e) => {
                const found = PRESET_AOIS.find((p) => p.name === e.target.value);
                if (found) handleSelectPresetAoi(found);
              }}
              className="w-full text-xs bg-surface-light border border-surface-border rounded-lg px-2.5 py-1.5 text-text-primary focus:outline-none focus:border-primary font-mono"
            >
              <option value="Custom Map Selection" disabled>Select Preset Target...</option>
              {PRESET_AOIS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.category})
                </option>
              ))}
            </select>
          </div>

          {/* Dataset Filter */}
          <div>
            <label className="text-[11px] font-mono text-text-secondary block mb-1">Filter Collection</label>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className="w-full text-xs bg-surface-light border border-surface-border rounded-lg px-2.5 py-1.5 text-text-primary focus:outline-none focus:border-primary font-mono"
            >
              <option value="">All Collections ({images.length} Scenes)</option>
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Basemap Switcher */}
          <div>
            <label className="text-[11px] font-mono text-text-secondary block mb-1">Basemap Style</label>
            <div className="grid grid-cols-3 gap-1 bg-surface-light p-1 rounded-lg border border-surface-border text-[10px] font-mono">
              <button
                onClick={() => setBasemap('esri')}
                className={`py-1 rounded text-center transition-all ${
                  basemap === 'esri' ? 'bg-primary text-white font-semibold' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Esri Sat
              </button>
              <button
                onClick={() => setBasemap('dark')}
                className={`py-1 rounded text-center transition-all ${
                  basemap === 'dark' ? 'bg-primary text-white font-semibold' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Dark Matter
              </button>
              <button
                onClick={() => setBasemap('osm')}
                className={`py-1 rounded text-center transition-all ${
                  basemap === 'osm' ? 'bg-primary text-white font-semibold' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                OSM Streets
              </button>
            </div>
          </div>
        </div>

        {/* Catalog List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredImages.map((img) => {
            const isSelected = selectedImage?.id === img.id;
            const hasGT = img.band_metadata && 'ground_truth_path' in img.band_metadata;
            const city = img.band_metadata?.city || null;

            return (
              <div
                key={img.id}
                onClick={() => handleSelectImage(img)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-primary/10 border-primary shadow-sm'
                    : 'bg-surface-light/40 border-surface-border hover:border-text-muted'
                }`}
              >
                <div className="flex space-x-2.5">
                  <div className="w-14 h-14 rounded-lg bg-surface-light border border-surface-border overflow-hidden shrink-0 flex items-center justify-center">
                    {img.preview_path ? (
                      <img
                        src={api.getImagePreviewUrl(img.id)}
                        alt={img.filename}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Layers className="w-5 h-5 text-text-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-text-primary truncate">
                      {city || img.filename}
                    </div>
                    <div className="text-[10px] font-mono text-accent-teal mt-0.5">{img.sensor}</div>

                    {hasGT && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/30 mt-1">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        <span>Ground Truth</span>
                      </span>
                    )}

                    <div className="text-[10px] font-mono text-text-muted mt-1">
                      {img.acquisition_date ? new Date(img.acquisition_date).toLocaleDateString() : 'N/A'} | {img.resolution}m/px
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Coordinate Readout */}
        <div className="p-2.5 border-t border-surface-border bg-surface-light/40 text-[10px] font-mono text-text-secondary flex justify-between items-center">
          <span>Lat: {cursorCoords.lat.toFixed(4)}°</span>
          <span>Lon: {cursorCoords.lon.toFixed(4)}°</span>
          {isSelectingAoi && <span className="text-accent-amber font-bold animate-pulse">DRAWING AOI</span>}
        </div>
      </div>

      {/* Main Map Canvas */}
      <div className="flex-1 relative h-full flex flex-col">
        {/* Top Floating Research Hotspots Ribbon */}
        <div className="absolute top-3 left-4 z-[1000] flex items-center space-x-2 bg-surface/90 backdrop-blur-md border border-surface-border rounded-xl p-1.5 shadow-xl max-w-[calc(100%-28rem)] overflow-x-auto">
          <div className="flex items-center gap-1.5 px-2 text-[11px] font-mono text-primary-light font-bold shrink-0">
            <Globe className="w-3.5 h-3.5" />
            <span>Hotspots:</span>
          </div>

          {hotspots.map((h) => {
            const isActive = activeHotspot === h.id;
            return (
              <button
                key={h.id}
                onClick={() => handleSelectHotspot(h)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all shrink-0 flex items-center gap-1 ${
                  isActive
                    ? 'bg-primary text-white font-semibold shadow-sm'
                    : 'bg-surface-light text-text-secondary hover:text-text-primary border border-surface-border'
                }`}
              >
                <span>{h.name.split(',')[0]}</span>
                <span className="text-[9px] opacity-75 font-normal">({h.category})</span>
              </button>
            );
          })}
        </div>

        {/* Leaflet Map */}
        <div className={`flex-1 w-full h-full ${isSelectingAoi ? 'cursor-crosshair' : ''}`}>
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            className="w-full h-full"
            zoomControl={false}
          >
            <MapController center={mapCenter} zoom={mapZoom} />
            <CoordinateTracker
              onCoordChange={(lat, lon) => setCursorCoords({ lat, lon })}
              isSelectingAoi={isSelectingAoi}
              onMapClick={handleMapClick}
            />

            {/* Basemap Selection */}
            {basemap === 'esri' && (
              <TileLayer
                attribution="&copy; Esri World Imagery"
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

            {/* Registered Raster Footprint Boundaries */}
            {images.map((img) => {
              if (!img.bounds) return null;
              const bounds: [[number, number], [number, number]] = [
                [img.bounds.min_lat, img.bounds.min_lon],
                [img.bounds.max_lat, img.bounds.max_lon]
              ];
              const isSelected = selectedImage?.id === img.id;
              const hasGT = img.band_metadata && 'ground_truth_path' in img.band_metadata;

              return (
                <Rectangle
                  key={img.id}
                  bounds={bounds}
                  pathOptions={{
                    color: isSelected ? '#3B82F6' : hasGT ? '#10B981' : '#0D9488',
                    weight: isSelected ? 3 : 1.5,
                    fillOpacity: isSelected ? 0.35 : 0.12
                  }}
                  eventHandlers={{
                    click: () => {
                      if (!isSelectingAoi) handleSelectImage(img);
                    }
                  }}
                >
                  <Popup className="text-xs font-mono">
                    <div className="font-bold text-text-primary">
                      {img.band_metadata?.city || img.filename}
                    </div>
                    <div>Sensor: {img.sensor}</div>
                    <div>Spatial Resolution: {img.resolution}m</div>
                    <div>CRS: {img.crs}</div>
                    {hasGT && <div className="text-accent-emerald font-bold mt-1">✔ Ground Truth Annotated</div>}
                  </Popup>
                </Rectangle>
              );
            })}

            {/* Selected AOI Boundary (High-Visibility Neon Cyan Rectangle) */}
            {aoiBounds && (
              <Rectangle
                bounds={aoiBounds}
                pathOptions={{
                  color: '#06B6D4',
                  weight: 2.5,
                  dashArray: '6, 6',
                  fillColor: '#06B6D4',
                  fillOpacity: 0.18,
                }}
              >
                <Tooltip permanent direction="top" className="bg-surface/95 text-cyan-400 font-mono text-[10px] border border-cyan-500/40 px-2 py-0.5 rounded shadow-lg">
                  📍 Active AOI Extent ({activePresetName})
                </Tooltip>
              </Rectangle>
            )}

            {/* In-progress AOI Start Point Marker */}
            {aoiStartPoint && (
              <Marker position={aoiStartPoint}>
                <Popup className="font-mono text-xs">Corner 1: [{aoiStartPoint[0].toFixed(4)}, {aoiStartPoint[1].toFixed(4)}]</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {/* Right Floating Console: Atmospheric Telemetry & AOI Intelligence HUD */}
        <div className="absolute top-3 right-4 z-[1000] w-96 max-h-[calc(100vh-6rem)] overflow-y-auto bg-surface/95 backdrop-blur-md border border-surface-border rounded-2xl p-4 shadow-2xl space-y-4">
          {/* Header & Mode Tabs */}
          <div className="flex items-center justify-between border-b border-surface-border pb-2.5">
            <div className="flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-accent-teal animate-pulse" />
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Geospatial HUD
              </h3>
            </div>

            <div className="flex rounded-lg bg-surface-light p-0.5 border border-surface-border text-[10px] font-mono">
              <button
                onClick={() => setActiveRightTab('aoi')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeRightTab === 'aoi' ? 'bg-primary text-white font-semibold' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                AOI & Weather
              </button>
              <button
                onClick={() => setActiveRightTab('scene')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeRightTab === 'scene' ? 'bg-primary text-white font-semibold' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Scene Specs
              </button>
            </div>
          </div>

          {activeRightTab === 'aoi' ? (
            <div className="space-y-3.5">
              {/* AOI Details Header */}
              <div className="p-3 rounded-xl bg-surface-light/60 border border-surface-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-mono text-primary-light font-bold flex items-center gap-1.5">
                    <Crosshair className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[200px]">{activePresetName}</span>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    AOI Active
                  </span>
                </div>

                {selectedAoi ? (
                  <div className="text-[10px] font-mono text-text-muted space-y-0.5">
                    <div className="flex justify-between">
                      <span>Bounding Box:</span>
                      <span className="text-text-primary">
                        [{selectedAoi[0].toFixed(2)}, {selectedAoi[1].toFixed(2)}, {selectedAoi[2].toFixed(2)}, {selectedAoi[3].toFixed(2)}]
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] font-mono text-text-muted">
                    No AOI active. Use the 📐 Select AOI tool or pick a preset.
                  </div>
                )}
              </div>

              {/* ISRO-Grade Atmospheric & Meteorological Radar HUD */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-surface-light/80 to-surface-light/30 border border-surface-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary flex items-center gap-1">
                    <Activity className="w-3 h-3 text-accent-teal" />
                    <span>Atmospheric Telemetry (ECMWF)</span>
                  </span>
                  <button
                    onClick={() => selectedAoi && fetchWeather(selectedAoi)}
                    disabled={loadingWeather}
                    className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-light transition-all"
                    title="Refresh Atmospheric Telemetry"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingWeather ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {loadingWeather ? (
                  <div className="py-6 text-center text-xs font-mono text-text-muted flex items-center justify-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Synchronizing NWP reanalysis feed...</span>
                  </div>
                ) : weather ? (
                  <div className="space-y-3">
                    {/* Temperature & Wind Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      {/* Temperature */}
                      <div className="p-2.5 rounded-lg bg-surface border border-surface-border space-y-1">
                        <div className="text-[10px] text-text-muted flex items-center gap-1">
                          <Thermometer className="w-3.5 h-3.5 text-accent-amber" />
                          <span>Air Temp (2m)</span>
                        </div>
                        <div className="text-base font-bold text-text-primary">
                          {weather.temperature_c}°C
                        </div>
                        <div className="text-[9px] text-text-muted">
                          Feels like {weather.apparent_temperature_c}°C ({weather.temperature_f}°F)
                        </div>
                      </div>

                      {/* Wind Vector Compass */}
                      <div className="p-2.5 rounded-lg bg-surface border border-surface-border space-y-1">
                        <div className="text-[10px] text-text-muted flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Wind className="w-3.5 h-3.5 text-accent-teal" />
                            <span>Wind Vector</span>
                          </span>
                          <Navigation
                            className="w-3.5 h-3.5 text-cyan-400 transition-transform duration-500"
                            style={{ transform: `rotate(${weather.wind.direction_degrees}deg)` }}
                          />
                        </div>
                        <div className="text-base font-bold text-text-primary">
                          {weather.wind.speed_kmh} <span className="text-[10px] font-normal text-text-muted">km/h</span>
                        </div>
                        <div className="text-[9px] text-text-muted">
                          {weather.wind.direction_cardinal} ({weather.wind.direction_degrees}°) | Gusts {weather.wind.gusts_kmh}km/h
                        </div>
                      </div>
                    </div>

                    {/* Cloud Cover & Optical Viability */}
                    <div className="p-2.5 rounded-lg bg-surface border border-surface-border space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <div className="text-[10px] text-text-muted flex items-center gap-1">
                          <Cloud className="w-3.5 h-3.5 text-primary-light" />
                          <span>Total Cloud Cover</span>
                        </div>
                        <span className="font-bold text-text-primary">{weather.cloud_cover_pct}%</span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-surface-light rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            weather.cloud_cover_pct < 20
                              ? 'bg-accent-emerald'
                              : weather.cloud_cover_pct < 50
                              ? 'bg-accent-amber'
                              : 'bg-accent-rose'
                          }`}
                          style={{ width: `${weather.cloud_cover_pct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-surface-border text-[10px] font-mono">
                        <span className="text-text-muted">EO Optical Viability:</span>
                        <span
                          className={`px-1.5 py-0.2 rounded font-bold ${
                            weather.satellite_viability.viability_grade === 'EXCELLENT'
                              ? 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/30'
                              : weather.satellite_viability.viability_grade === 'MODERATE'
                              ? 'bg-accent-amber/10 text-accent-amber border border-accent-amber/30'
                              : 'bg-accent-rose/10 text-accent-rose border border-accent-rose/30'
                          }`}
                        >
                          {weather.satellite_viability.viability_grade} ({weather.satellite_viability.viability_score}/100)
                        </span>
                      </div>
                    </div>

                    {/* Rain, Humidity & Pressure Mini-Bar */}
                    <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                      <div className="p-1.5 rounded bg-surface border border-surface-border text-center">
                        <div className="text-text-muted flex items-center justify-center gap-1">
                          <Droplets className="w-2.5 h-2.5 text-blue-400" />
                          <span>Rain</span>
                        </div>
                        <div className="font-bold text-text-primary mt-0.5">{weather.precipitation_mm} mm</div>
                      </div>
                      <div className="p-1.5 rounded bg-surface border border-surface-border text-center">
                        <div className="text-text-muted">Humidity</div>
                        <div className="font-bold text-text-primary mt-0.5">{weather.relative_humidity_pct}%</div>
                      </div>
                      <div className="p-1.5 rounded bg-surface border border-surface-border text-center">
                        <div className="text-text-muted">Pressure</div>
                        <div className="font-bold text-text-primary mt-0.5">{weather.surface_pressure_hpa} hPa</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] font-mono text-text-muted py-2 text-center">
                    Click any point on the map or select an AOI to retrieve atmospheric readings.
                  </div>
                )}
              </div>

              {/* ACTION: Track Changes for AOI */}
              <div className="space-y-2">
                <button
                  onClick={handleTrackAoiChanges}
                  disabled={trackingChanges || !selectedAoi}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary to-accent-teal text-white font-mono font-bold text-xs shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {trackingChanges ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Computing AOI Change Vectors...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-cyan-200" />
                      <span>🛰️ Track Changes in Selected AOI</span>
                    </>
                  )}
                </button>
              </div>

              {/* Change Detection Intelligence Results */}
              {aoiResult && (
                <div className="p-3.5 rounded-xl bg-surface-light/60 border border-primary/40 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-surface-border pb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-primary-light font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-accent-emerald" />
                      <span>AOI Change Analytics</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/20 text-primary-light font-bold">
                      {aoiResult.change_quantification.change_percentage_of_scene}% Altered
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded-lg bg-surface border border-surface-border">
                      <div className="text-[10px] text-text-muted">Total AOI Area</div>
                      <div className="font-bold text-text-primary text-sm mt-0.5">
                        {aoiResult.aoi_spatial.area_hectares.toFixed(1)} <span className="text-[10px] font-normal text-text-muted">Ha</span>
                      </div>
                      <div className="text-[9px] text-text-muted">({aoiResult.aoi_spatial.area_sq_km.toFixed(2)} km²)</div>
                    </div>

                    <div className="p-2 rounded-lg bg-surface border border-surface-border">
                      <div className="text-[10px] text-text-muted">Changed Ground Area</div>
                      <div className="font-bold text-accent-rose text-sm mt-0.5">
                        {aoiResult.change_quantification.total_changed_ha.toFixed(1)} <span className="text-[10px] font-normal text-text-muted">Ha</span>
                      </div>
                      <div className="text-[9px] text-text-muted">Polygons: {aoiResult.change_quantification.polygon_count}</div>
                    </div>
                  </div>

                  {/* Dominant Transition Class */}
                  <div className="p-2 rounded-lg bg-surface border border-surface-border text-xs font-mono">
                    <div className="text-[10px] text-text-muted">Dominant Transition Vector:</div>
                    <div className="font-bold text-accent-amber mt-0.5 flex items-center gap-1.5">
                      <span>{aoiResult.change_quantification.dominant_transition}</span>
                    </div>
                  </div>

                  {/* Environmental Correlation Synthesizer */}
                  {aoiResult.environmental_correlation_insights && aoiResult.environmental_correlation_insights.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-text-secondary flex items-center gap-1">
                        <Activity className="w-3 h-3 text-accent-teal" />
                        <span>Atmosphere-Change Correlation</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-surface border border-surface-border text-[10px] font-mono text-text-secondary space-y-1.5">
                        {aoiResult.environmental_correlation_insights.map((insight, idx) => (
                          <div key={idx} className="flex items-start gap-1.5">
                            <span className="text-primary-light shrink-0">▸</span>
                            <span>{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Link to Change Detection Studio */}
                  <div className="pt-1">
                    <a
                      href="/detection"
                      className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg bg-surface-light hover:bg-surface-light/80 text-text-primary text-[11px] font-mono border border-surface-border transition-all"
                    >
                      <span>Open Full Multi-Temporal Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Scene Specs Tab */
            selectedImage ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-primary-light uppercase tracking-wider">
                      Inspected Acquisition
                    </span>
                    <h3 className="text-xs font-bold text-text-primary truncate">
                      {selectedImage.band_metadata?.city || selectedImage.filename}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent-teal/10 text-accent-teal border border-accent-teal/30">
                    {selectedImage.sensor}
                  </span>
                </div>

                {selectedImage.preview_path && (
                  <div className="w-full h-36 rounded-lg overflow-hidden border border-surface-border bg-black">
                    <img
                      src={api.getImagePreviewUrl(selectedImage.id)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-1.5 text-xs font-mono text-text-secondary border-t border-surface-border pt-2">
                  <div className="flex justify-between">
                    <span>Acquisition Date:</span>
                    <span className="text-text-primary">
                      {selectedImage.acquisition_date ? new Date(selectedImage.acquisition_date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>CRS Projection:</span>
                    <span className="text-text-primary">{selectedImage.crs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pixel Resolution:</span>
                    <span className="text-text-primary">{selectedImage.resolution} m/px</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dimensions:</span>
                    <span className="text-text-primary">{selectedImage.width} x {selectedImage.height} px</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Spectral Bands:</span>
                    <span className="text-text-primary">{selectedImage.channels} Channels (RGB + NIR)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs font-mono text-text-muted py-8 text-center">
                Select a scene from the left catalog or click any footprint rectangle on the map.
              </div>
            )
          )}
        </div>

        {/* Live STAC Search Results Bottom Drawer */}
        {stacDrawerOpen && (
          <div className="absolute bottom-4 left-6 right-6 z-[1000] bg-surface/95 backdrop-blur-md border border-surface-border rounded-xl p-4 shadow-2xl space-y-3 max-h-72 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-border pb-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-accent-teal" />
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Live Sentinel-2 Orbital Granules (AWS Earth Search STAC)
                </h3>
              </div>
              <button
                onClick={() => setStacDrawerOpen(false)}
                className="text-xs font-mono text-text-muted hover:text-text-primary px-2 py-0.5 rounded bg-surface-light border border-surface-border"
              >
                Close Drawer
              </button>
            </div>

            {searchingStac ? (
              <div className="py-8 text-center text-xs font-mono text-text-secondary flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Interrogating AWS Earth Search STAC Catalog for Sentinel-2 Level-2A assets...</span>
              </div>
            ) : stacGranules.length === 0 ? (
              <div className="py-6 text-center text-xs font-mono text-text-muted">
                No cloudless granules found in date interval. Try adjusting search range.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {stacGranules.map((g) => (
                  <div
                    key={g.id}
                    className="p-3 rounded-lg bg-surface-light/50 border border-surface-border space-y-2 text-xs font-mono"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="text-[11px] font-bold text-text-primary truncate" title={g.id}>
                        {g.id}
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary-light shrink-0">
                        ☁️ {g.cloud_cover}%
                      </span>
                    </div>

                    {g.thumbnail_url && (
                      <div className="w-full h-24 rounded bg-black overflow-hidden border border-surface-border">
                        <img
                          src={g.thumbnail_url}
                          alt="Granule Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="text-[10px] text-text-secondary space-y-0.5">
                      <div>Date: {new Date(g.datetime).toLocaleDateString()} {new Date(g.datetime).toLocaleTimeString()}</div>
                      <div>Sun Elevation: {g.sun_elevation}°</div>
                      <div>Platform: {g.platform}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
