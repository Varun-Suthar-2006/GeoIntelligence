import React, { useEffect, useState } from 'react';
import {
  Database,
  Plus,
  UploadCloud,
  Trash2,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileCode,
  HardDrive
} from 'lucide-react';
import { api } from '../services/api';
import { Dataset, SatelliteImage } from '../types';

export const DatasetManager: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [images, setImages] = useState<SatelliteImage[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  
  // New dataset form
  const [showNewDataset, setShowNewDataset] = useState(false);
  const [newDsName, setNewDsName] = useState('');
  const [newDsSource, setNewDsSource] = useState('Copernicus Open Access Hub');
  const [newDsLicense, setNewDsLicense] = useState('Open Access / CC-BY 4.0');
  const [newDsDesc, setNewDsDesc] = useState('');

  // Image upload form
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSensor, setUploadSensor] = useState('Sentinel-2A MSI');
  const [uploadDate, setUploadDate] = useState('2025-06-20');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadData = () => {
    Promise.all([api.getDatasets(), api.getImages()]).then(([dsets, imgs]) => {
      setDatasets(dsets);
      setImages(imgs);
      if (dsets.length > 0 && !selectedDatasetId) {
        setSelectedDatasetId(dsets[0].id);
      }
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDsName) return;
    try {
      await api.createDataset({
        name: newDsName,
        source: newDsSource,
        license: newDsLicense,
        description: newDsDesc
      });
      setShowNewDataset(false);
      setNewDsName('');
      setNewDsDesc('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create dataset');
    }
  };

  const handleUploadImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('file', uploadFile);
    if (selectedDatasetId) formData.append('dataset_id', selectedDatasetId);
    formData.append('sensor', uploadSensor);
    if (uploadDate) formData.append('acquisition_date', uploadDate);

    try {
      const created = await api.uploadImage(formData);
      setUploadSuccess(`Successfully ingested & georeferenced '${created.filename}'`);
      setUploadFile(null);
      setUploading(false);
      loadData();
    } catch (err: any) {
      setUploadError(err.message || 'Image upload failed');
      setUploading(false);
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this satellite scene?')) return;
    try {
      await api.deleteImage(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete image');
    }
  };

  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId);
  const datasetImages = selectedDatasetId
    ? images.filter((img) => img.dataset_id === selectedDatasetId)
    : images;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <Database className="w-6 h-6 text-primary-light" />
            <span>Earth Observation Dataset Manager</span>
          </h2>
          <p className="text-xs text-text-secondary font-mono mt-1">
            Register satellite datasets, upload multispectral GeoTIFF imagery, and validate coordinate reference systems.
          </p>
        </div>

        <button
          onClick={() => setShowNewDataset(!showNewDataset)}
          className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-medium flex items-center space-x-2 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Dataset</span>
        </button>
      </div>

      {/* New Dataset Modal/Card */}
      {showNewDataset && (
        <form onSubmit={handleCreateDataset} className="p-6 rounded-xl bg-surface border border-surface-border space-y-4">
          <h3 className="text-sm font-bold text-text-primary">Register Remote Sensing Dataset</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-mono text-text-secondary block mb-1">Dataset Name *</label>
              <input
                type="text"
                required
                value={newDsName}
                onChange={(e) => setNewDsName(e.target.value)}
                placeholder="e.g. Landsat-9 Forest Disturbance"
                className="w-full text-xs bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-text-primary font-mono focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-text-secondary block mb-1">Source Agency</label>
              <input
                type="text"
                value={newDsSource}
                onChange={(e) => setNewDsSource(e.target.value)}
                className="w-full text-xs bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-text-primary font-mono focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-text-secondary block mb-1">License</label>
              <input
                type="text"
                value={newDsLicense}
                onChange={(e) => setNewDsLicense(e.target.value)}
                className="w-full text-xs bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-text-primary font-mono focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-mono text-text-secondary block mb-1">Scientific Description</label>
            <input
              type="text"
              value={newDsDesc}
              onChange={(e) => setNewDsDesc(e.target.value)}
              placeholder="Multi-spectral time-series description..."
              className="w-full text-xs bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-text-primary font-mono focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowNewDataset(false)}
              className="px-3 py-1.5 rounded-lg bg-surface-light border border-surface-border text-xs font-mono text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-mono"
            >
              Save Dataset
            </button>
          </div>
        </form>
      )}

      {/* Main Grid: Upload & Images List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono font-semibold text-text-primary border-b border-surface-border pb-3">
            <UploadCloud className="w-4 h-4 text-primary-light" />
            <span>Upload Satellite Scene</span>
          </div>

          <form onSubmit={handleUploadImage} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-text-secondary block mb-1">Target Dataset</label>
              <select
                value={selectedDatasetId}
                onChange={(e) => setSelectedDatasetId(e.target.value)}
                className="w-full text-xs bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-text-primary font-mono focus:outline-none focus:border-primary"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-text-secondary block mb-1">Sensor Platform</label>
              <input
                type="text"
                value={uploadSensor}
                onChange={(e) => setUploadSensor(e.target.value)}
                className="w-full text-xs bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-text-primary font-mono focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-text-secondary block mb-1">Acquisition Date</label>
              <input
                type="date"
                value={uploadDate}
                onChange={(e) => setUploadDate(e.target.value)}
                className="w-full text-xs bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-text-primary font-mono focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-text-secondary block mb-1">Raster File (.tif, .tiff, .png)</label>
              <input
                type="file"
                required
                accept=".tif,.tiff,.png,.jpg,.jpeg"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-mono file:bg-primary file:text-white hover:file:bg-primary-dark cursor-pointer"
              />
            </div>

            {uploadSuccess && (
              <div className="p-3 rounded-lg bg-accent-emerald/10 border border-accent-emerald/30 text-xs font-mono text-accent-emerald flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {uploadError && (
              <div className="p-3 rounded-lg bg-accent-rose/10 border border-accent-rose/30 text-xs font-mono text-accent-rose flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !uploadFile}
              className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-dark disabled:bg-surface-light text-white font-medium text-xs font-mono flex items-center justify-center space-x-2 transition-all shadow-sm"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Extracting Metadata & Processing...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Ingest & Validate Scene</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Dataset Scenes List */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-surface border border-surface-border space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                {selectedDataset ? selectedDataset.name : 'All Ingested Scenes'}
              </h3>
              <p className="text-xs text-text-secondary font-mono">{selectedDataset?.source} &mdash; {selectedDataset?.license}</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-light text-text-muted border border-surface-border">
              {datasetImages.length} Ingested Scenes
            </span>
          </div>

          <div className="space-y-3 max-h-[540px] overflow-y-auto">
            {datasetImages.map((img) => (
              <div
                key={img.id}
                className="p-4 rounded-xl bg-surface-light/40 border border-surface-border flex items-center justify-between gap-4 hover:border-text-muted transition-all"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-lg bg-black border border-surface-border overflow-hidden shrink-0 flex items-center justify-center">
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
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">{img.filename}</h4>
                    <div className="text-[11px] font-mono text-accent-teal mt-0.5">Sensor: {img.sensor}</div>
                    <div className="text-[10px] font-mono text-text-secondary mt-1 flex items-center gap-3">
                      <span>CRS: {img.crs}</span>
                      <span>GSD: {img.resolution} m</span>
                      <span>Dimensions: {img.width}x{img.height}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDeleteImage(img.id)}
                    className="p-2 rounded-lg bg-surface-light hover:bg-accent-rose/10 text-text-muted hover:text-accent-rose border border-surface-border transition-all"
                    title="Delete Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
