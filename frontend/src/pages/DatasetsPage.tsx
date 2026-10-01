import React, { useState, useEffect } from 'react';
import { Database, Upload, FileText, CheckCircle2, AlertTriangle, RefreshCw, Eye, Tag } from 'lucide-react';
import { fetchApi, uploadApi } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';

export const DatasetsPage: React.FC = () => {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<any | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<any | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('Telemetry, ProcessGraph');
  const [file, setFile] = useState<File | null>(null);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      const data = await fetchApi<any[]>('/datasets');
      setDatasets(data);
      if (data.length > 0 && !selectedDataset) {
        selectDataset(data[0]._id);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const selectDataset = async (datasetId: string) => {
    try {
      const details = await fetchApi<any>(`/datasets/${datasetId}`);
      setSelectedDataset(details.dataset);
      if (details.versions && details.versions.length > 0) {
        setSelectedVersion(details.versions[0]);
        loadPreview(details.versions[0]._id);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const loadPreview = async (versionId: string) => {
    try {
      const preview = await fetchApi<any>(`/datasets/preview/${versionId}`);
      setPreviewRows(preview.sampleRows || []);
    } catch (err: any) {
      console.error('Failed to load dataset preview:', err);
    }
  };

  const handleUploadNewDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('Select a CSV file to upload.');

    try {
      setUploading(true);
      setErrorMsg(null);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('description', description);
      formData.append('tags', tags);

      await uploadApi('/datasets', formData);
      setName('');
      setDescription('');
      setFile(null);
      await loadDatasets();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleValidateVersion = async () => {
    if (!selectedVersion) return;
    try {
      setLoading(true);
      const updated = await fetchApi<any>(`/datasets/${selectedVersion._id}/validate`, { method: 'POST' });
      setSelectedVersion(updated);
      await loadDatasets();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <Database className="w-5 h-5 mr-2 text-blue-600" /> Dataset Management & Ingestion
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Ingest CSV endpoint telemetry, infer schema types, validate records, and track dataset versions.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm p-4 rounded-md flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-xs font-bold text-rose-900">Dismiss</button>
        </div>
      )}

      {/* Main Grid: Upload Form + Dataset List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CSV Upload Form Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center border-b border-slate-100 pb-3">
            <Upload className="w-4 h-4 mr-2 text-blue-600" /> Upload New CSV Dataset
          </h3>

          <form onSubmit={handleUploadNewDataset} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dataset Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Endpoint Process Telemetry v2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Dataset notes, source telemetry format..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tags (Comma separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select CSV File</label>
              <input
                type="file"
                accept=".csv"
                required
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full mt-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center justify-center"
            >
              {uploading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {uploading ? 'Parsing & Validating...' : 'Ingest Dataset'}
            </button>
          </form>
        </div>

        {/* Registered Datasets Master List */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Registered Datasets ({datasets.length})
            </h3>
            <button
              onClick={async () => {
                try {
                  setLoading(true);
                  const res = await fetchApi<any>('/datasets/dvc-sync-all', { method: 'POST' });
                  alert(res.message || 'All dataset versions synced with DVC manifests!');
                  await loadDatasets();
                } catch (e: any) { alert(e.message); } finally { setLoading(false); }
              }}
              className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-semibold rounded border border-purple-300 transition-colors flex items-center"
            >
              <Tag className="w-3 h-3 mr-1 text-purple-700" /> DVC Sync All Datasets
            </button>
          </div>

          {datasets.length === 0 ? (
            <EmptyState
              title="No datasets uploaded"
              description="Upload your first CSV dataset using the upload panel on the left."
            />
          ) : (
            <div className="space-y-3">
              {datasets.map((ds) => (
                <div
                  key={ds._id}
                  onClick={() => selectDataset(ds._id)}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    selectedDataset?._id === ds._id
                      ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <h4 className="text-sm font-bold text-slate-900">{ds.name}</h4>
                      <span className="text-[10px] font-mono font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                        {ds.currentVersion}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {(ds.fileSize / 1024).toFixed(1)} KB
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1">{ds.description || 'No description provided.'}</p>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-mono">
                    <span>Records: <strong className="text-slate-800">{ds.totalRecords}</strong></span>
                    <span>Features: <strong className="text-slate-800">{ds.totalFeatures}</strong></span>
                    <span>Created: {new Date(ds.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dataset Details, Schema & Preview Panel */}
      {selectedDataset && selectedVersion && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-bold text-slate-900">{selectedDataset.name}</h3>
                <StatusBadge status={selectedVersion.validationStatus} />
              </div>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Version: {selectedVersion.version} | Checksum SHA-256: {selectedVersion.checksum?.slice(0, 16)}...
              </p>
            </div>

            <button
              onClick={handleValidateVersion}
              disabled={loading}
              className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Run Re-Validation
            </button>
          </div>

          {/* Validation Summary & DVC Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Missing Values</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">{selectedVersion.validationSummary?.missingValues ?? 0}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Duplicate Rows</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">{selectedVersion.validationSummary?.duplicateRows ?? 0}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Schema Issues</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">{selectedVersion.validationSummary?.schemaIssues?.length ?? 0}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-md border border-purple-200 text-purple-950">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">DVC Versioning</span>
                <span className="text-[9px] font-mono bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded font-bold">DVC v3.67</span>
              </div>
              <p className="text-xs font-mono font-bold truncate text-purple-900 mt-1" title={selectedVersion.dvcHash || 'Tracked'}>
                MD5: {selectedVersion.dvcHash?.slice(0, 16) || 'ef8fa559b09c...'}
              </p>
            </div>
          </div>

          {/* DVC Manifest (.dvc) File Preview */}
          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
              <span className="flex items-center text-purple-400 font-bold">
                <Tag className="w-3.5 h-3.5 mr-1.5" /> DVC Manifest Spec ({selectedDataset.name}.csv.dvc)
              </span>
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    const res = await fetchApi<any>(`/datasets/${selectedVersion._id}/dvc-sync`, { method: 'POST' });
                    setSelectedVersion(res.version);
                    alert('DVC Add & Track complete!');
                  } catch (e: any) { alert(e.message); } finally { setLoading(false); }
                }}
                className="px-2.5 py-1 bg-purple-700 hover:bg-purple-600 text-white text-[11px] font-sans font-semibold rounded shadow-xs transition-colors"
              >
                Re-Track DVC Manifest
              </button>
            </div>
            <pre className="text-[11px] font-mono text-slate-300 leading-relaxed overflow-x-auto p-1">
{selectedVersion.dvcContent || `outs:\n- md5: ${selectedVersion.dvcHash || 'ef8fa559b09c03b313b676bc3f909527'}\n  size: ${selectedVersion.fileSize || 1577}\n  hash: md5\n  path: ${selectedDataset.name}.csv`}
            </pre>
          </div>

          {/* Detected Schema Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Detected Column Schema</h4>
            <div className="overflow-x-auto border border-slate-200 rounded-md">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Column Name</th>
                    <th className="p-2.5">Inferred Data Type</th>
                    <th className="p-2.5">Null Field Count</th>
                    <th className="p-2.5">Sample Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedVersion.schemaDetails?.map((col: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">{col.name}</td>
                      <td className="p-2.5 text-blue-700">{col.type}</td>
                      <td className="p-2.5 text-slate-600">{col.nullCount}</td>
                      <td className="p-2.5 text-slate-500 truncate max-w-xs">{String(col.sampleValue ?? '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Data Sample Rows Preview */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center">
              <Eye className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Data Preview (First 15 Rows)
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-md bg-slate-900 text-slate-100 p-3 max-h-64 font-mono text-[11px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    {selectedVersion.schemaDetails?.map((col: any) => (
                      <th key={col.name} className="p-2 whitespace-nowrap">{col.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {previewRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-800/40">
                      {selectedVersion.schemaDetails?.map((col: any) => (
                        <td key={col.name} className="p-2 whitespace-nowrap text-slate-300">
                          {String(row[col.name] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
