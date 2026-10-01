import React, { useState, useEffect } from 'react';
import { Boxes, PlusCircle, ArrowUpRight, ShieldCheck, GitBranch, CheckCircle, Archive } from 'lucide-react';
import { fetchApi } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';

export const ModelsPage: React.FC = () => {
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<any | null>(null);
  const [lineage, setLineage] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Register form
  const [versionStr, setVersionStr] = useState('');
  const [modelType, setModelType] = useState('Graph-Based Behavioral Threat Engine');
  const [description, setDescription] = useState('');

  const loadModels = async () => {
    try {
      setLoading(true);
      const data = await fetchApi<any[]>('/models');
      setModels(data);
      if (data.length > 0 && !selectedModel) {
        selectModel(data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load model registry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const selectModel = async (id: string) => {
    try {
      const model = models.find(m => m._id === id) || await fetchApi<any>(`/models/${id}`);
      setSelectedModel(model);
      const lineageData = await fetchApi<any>(`/models/${id}/lineage`);
      setLineage(lineageData);
    } catch (err) {
      console.error('Failed to fetch model lineage:', err);
    }
  };

  const handleRegisterModel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await fetchApi('/models/register', {
        method: 'POST',
        body: JSON.stringify({
          version: versionStr,
          modelType,
          description
        })
      });
      setVersionStr('');
      setDescription('');
      await loadModels();
    } catch (err: any) {
      alert(`Error registering model: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusTransition = async (newStatus: string) => {
    if (!selectedModel) return;
    try {
      setLoading(true);
      const updated = await fetchApi<any>(`/models/${selectedModel._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      setSelectedModel(updated);
      await loadModels();
    } catch (err: any) {
      alert(`Status transition error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <Boxes className="w-5 h-5 mr-2 text-blue-600" /> Model Registry & Lifecycle Management
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage model versioning, lifecycle stages (Development, Staging, Production, Archived), and audit end-to-end lineage.
          </p>
        </div>
      </div>

      {/* Grid: Register Card + Model List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Register Form */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center">
            <PlusCircle className="w-4 h-4 mr-2 text-blue-600" /> Register Model Version
          </h3>

          <form onSubmit={handleRegisterModel} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Version Identifier</label>
              <input
                type="text"
                required
                placeholder="e.g. v1.1.0"
                value={versionStr}
                onChange={(e) => setVersionStr(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model Architecture</label>
              <input
                type="text"
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes</label>
              <textarea
                rows={2}
                placeholder="Model configuration artifact details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
            >
              Register Version
            </button>
          </form>
        </div>

        {/* Model Version Master List */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">
            Registered Model Versions ({models.length})
          </h3>

          {models.length === 0 ? (
            <EmptyState title="No registered models" description="Register a model version using the form on the left." />
          ) : (
            <div className="space-y-3">
              {models.map((m) => (
                <div
                  key={m._id}
                  onClick={() => selectModel(m._id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedModel?._id === m._id
                      ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-slate-900">{m.modelName}</span>
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {m.version}
                      </span>
                    </div>
                    <StatusBadge status={m.status} />
                  </div>

                  <p className="text-xs text-slate-600 mt-1">{m.description || 'No description provided.'}</p>

                  <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-500">
                    <span>Precision: <strong className="text-emerald-700">{m.metricsSummary?.precision}</strong></span>
                    <span>Recall: <strong className="text-blue-700">{m.metricsSummary?.recall}</strong></span>
                    <span>F1: <strong className="text-teal-700">{m.metricsSummary?.f1Score}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Model Details & Lineage Tracker */}
      {selectedModel && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center space-x-3">
                <h3 className="text-base font-bold text-slate-900">{selectedModel.modelName} ({selectedModel.version})</h3>
                <StatusBadge status={selectedModel.status} />
              </div>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Registered: {new Date(selectedModel.createdAt).toLocaleString()} | Engine: Simulated Rule Artifact
              </p>
            </div>

            {/* Lifecycle Stage Transitions */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-600 mr-1">Promote Stage:</span>
              <button
                onClick={() => handleStatusTransition('Staging')}
                disabled={selectedModel.status === 'Staging'}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded border border-amber-300 transition-colors"
              >
                Staging
              </button>
              <button
                onClick={() => handleStatusTransition('Production')}
                disabled={selectedModel.status === 'Production'}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded border border-emerald-300 transition-colors"
              >
                Production
              </button>
              <button
                onClick={() => handleStatusTransition('Archived')}
                disabled={selectedModel.status === 'Archived'}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-300 transition-colors"
              >
                Archive
              </button>
            </div>
          </div>

          {/* End-to-End Lineage Visualizer */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center">
              <GitBranch className="w-4 h-4 mr-1.5 text-blue-600" /> End-to-End MLOps Lineage
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="bg-white p-3 rounded border border-slate-200 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400">1. Dataset Version</span>
                <p className="text-xs font-bold text-slate-900">{lineage?.datasetVersion?.version || 'v1.0'}</p>
                <p className="text-[11px] text-slate-500 font-mono">{lineage?.datasetVersion?.recordCount || 1000} records</p>
              </div>

              <div className="bg-white p-3 rounded border border-slate-200 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400">2. Experiment Run</span>
                <p className="text-xs font-bold text-slate-900">{lineage?.experimentRun?.runName || 'Pipeline Auto Run'}</p>
                <p className="text-[11px] text-slate-500 font-mono">F1-Score: {selectedModel.metricsSummary?.f1Score}</p>
              </div>

              <div className="bg-white p-3 rounded border border-slate-200 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400">3. Registered Model</span>
                <p className="text-xs font-bold text-blue-700 font-mono">{selectedModel.version}</p>
                <p className="text-[11px] text-slate-500 font-mono">Stage: {selectedModel.status}</p>
              </div>

              <div className="bg-white p-3 rounded border border-slate-200 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400">4. Target Deployment</span>
                <p className="text-xs font-bold text-slate-900">
                  {lineage?.deployments?.[0]?.name || 'threat-engine-prod'}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {lineage?.deployments?.[0]?.status || 'ACTIVE'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
