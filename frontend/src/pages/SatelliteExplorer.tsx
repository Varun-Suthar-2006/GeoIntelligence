import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Rectangle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Layers, Calendar, MapPin, Eye, UploadCloud, Info, Check } from 'lucide-react';
import { api } from '../services/api';
import { SatelliteImage, Dataset } from '../types';

// Fix default leaflet marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function CoordinateTracker({ onCoordChange }: { onCoordChange: (lat: number, lon: number) => void }) {
  useMapEvents({
    mousemove(e) {
      onCoordChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export const SatelliteExplorer: React.FC = () => {
  const [images, setImages] = useState<SatelliteImage[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<SatelliteImage | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lon: number }>({ lat: 43.6045, lon: 1.4442 });
  const [mapLayer, setMapLayer] = useState<'satellite' | 'streets'>('satellite');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getImages(), api.getDatasets()])
      .then(([imgs, dsets]) => {
        setImages(imgs);
        setDatasets(dsets);
        if (imgs.length > 0) setSelectedImage(imgs[0]);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredImages = selectedDataset
    ? images.filter((img) => img.dataset_id === selectedDataset)
    : images;

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-background">
      {/* Left Control Panel */}
      <div className="w-80 border-r border-surface-border bg-surface flex flex-col shrink-0">
        <div className="p-4 border-b border-surface-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary-light" />
              <span>Satellite Explorer</span>
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-light border border-surface-border text-text-muted">
              {filteredImages.length} Scenes
            </span>
          </div>

          {/* Dataset Filter */}
          <div>
            <label className="text-[11px] font-mono text-text-secondary block mb-1">Filter by Dataset</label>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className="w-full text-xs bg-surface-light border border-surface-border rounded-lg px-2.5 py-2 text-text-primary focus:outline-none focus:border-primary font-mono"
            >
              <option value="">All Datasets (Sentinel-2, OSCD, Landsat)</option>
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Map Layer Mode */}
          <div className="flex items-center space-x-2 pt-1">
            <button
              onClick={() => setMapLayer('satellite')}
              className={`flex-1 py-1.5 rounded text-xs font-mono transition-all ${
                mapLayer === 'satellite'
                  ? 'bg-primary text-white font-medium'
                  : 'bg-surface-light text-text-secondary hover:text-text-primary border border-surface-border'
              }`}
            >
              Satellite Layer
            </button>
            <button
              onClick={() => setMapLayer('streets')}
              className={`flex-1 py-1.5 rounded text-xs font-mono transition-all ${
                mapLayer === 'streets'
                  ? 'bg-primary text-white font-medium'
                  : 'bg-surface-light text-text-secondary hover:text-text-primary border border-surface-border'
              }`}
            >
              Carto Basemap
            </button>
          </div>
        </div>

        {/* Raster Scenes List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredImages.map((img) => {
            const isSelected = selectedImage?.id === img.id;
            return (
              <div
                key={img.id}
                onClick={() => setSelectedImage(img)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-primary/10 border-primary shadow-sm'
                    : 'bg-surface-light/40 border-surface-border hover:border-text-muted'
                }`}
              >
                <div className="flex space-x-3">
                  <div className="w-16 h-16 rounded-lg bg-surface-light border border-surface-border overflow-hidden shrink-0 flex items-center justify-center">
                    {img.preview_path ? (
                      <img
                        src={api.getImagePreviewUrl(img.id)}
                        alt={img.filename}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Layers className="w-6 h-6 text-text-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-text-primary truncate">{img.filename}</div>
                    <div className="text-[10px] font-mono text-accent-teal mt-0.5">{img.sensor}</div>
                    <div className="text-[10px] font-mono text-text-secondary flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3 text-text-muted" />
                      <span>{img.acquisition_date ? new Date(img.acquisition_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="text-[10px] font-mono text-text-muted mt-0.5">
                      GSD: {img.resolution}m | {img.channels} bands
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Coordinate Readout */}
        <div className="p-3 border-t border-surface-border bg-surface-light/30 text-[11px] font-mono text-text-secondary flex justify-between items-center">
          <span>Lat: {cursorCoords.lat.toFixed(4)}°</span>
          <span>Lon: {cursorCoords.lon.toFixed(4)}°</span>
        </div>
      </div>

      {/* Main Interactive Map Viewport */}
      <div className="flex-1 relative h-full">
        <MapContainer
          center={[43.61, 1.45]}
          zoom={12}
          className="w-full h-full"
          zoomControl={true}
        >
          <CoordinateTracker
            onCoordChange={(lat, lon) => setCursorCoords({ lat, lon })}
          />

          {mapLayer === 'satellite' ? (
            <TileLayer
              attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          )}

          {/* Raster Footprints */}
          {images.map((img) => {
            if (!img.bounds) return null;
            const bounds: [[number, number], [number, number]] = [
              [img.bounds.min_lat, img.bounds.min_lon],
              [img.bounds.max_lat, img.bounds.max_lon]
            ];
            const isSelected = selectedImage?.id === img.id;

            return (
              <Rectangle
                key={img.id}
                bounds={bounds}
                pathOptions={{
                  color: isSelected ? '#3B82F6' : '#0D9488',
                  weight: isSelected ? 3 : 1.5,
                  fillOpacity: isSelected ? 0.35 : 0.15
                }}
                eventHandlers={{
                  click: () => setSelectedImage(img)
                }}
              >
                <Popup className="text-xs font-mono">
                  <div className="font-bold text-text-primary">{img.filename}</div>
                  <div>Sensor: {img.sensor}</div>
                  <div>Resolution: {img.resolution}m</div>
                  <div>CRS: {img.crs}</div>
                </Popup>
              </Rectangle>
            );
          })}
        </MapContainer>

        {/* Selected Scene Floating Metadata Card */}
        {selectedImage && (
          <div className="absolute top-4 right-4 z-[1000] w-80 bg-surface/95 backdrop-blur-md border border-surface-border rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-primary-light uppercase tracking-wider">Inspected Scene</span>
                <h3 className="text-xs font-bold text-text-primary truncate">{selectedImage.filename}</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent-teal/10 text-accent-teal border border-accent-teal/30">
                {selectedImage.sensor}
              </span>
            </div>

            {selectedImage.preview_path && (
              <div className="w-full h-32 rounded-lg overflow-hidden border border-surface-border">
                <img
                  src={api.getImagePreviewUrl(selectedImage.id)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-1.5 text-xs font-mono text-text-secondary border-t border-surface-border pt-2">
              <div className="flex justify-between">
                <span>CRS:</span>
                <span className="text-text-primary">{selectedImage.crs}</span>
              </div>
              <div className="flex justify-between">
                <span>Spatial Resolution:</span>
                <span className="text-text-primary">{selectedImage.resolution} m/px</span>
              </div>
              <div className="flex justify-between">
                <span>Pixel Dimensions:</span>
                <span className="text-text-primary">{selectedImage.width} x {selectedImage.height}</span>
              </div>
              <div className="flex justify-between">
                <span>Spectral Bands:</span>
                <span className="text-text-primary">{selectedImage.channels} Channels</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
