import React, { useState, useEffect } from 'react';
import { Rocket, PlusCircle, Power, Activity, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { fetchApi } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';

export const DeploymentsPage: React.FC = () => {
  const [deployments, setDeployments] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [selectedDeployment, setSelectedDeployment] = useState<any | null>(null);
  const [healthStatus, setHealthStatus] = useState<any | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // New deployment form
  const [name, setName] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [environment, setEnvironment] = useState<'Staging' | 'Production'>('Production');

  const loadDeployments = async () => {
    try {
      setLoading(true);
      const [depData, modelData] = await Promise.all([
        fetchApi<any[]>('/deployments'),
        fetchApi<any[]>('/models')
      ]);
      setDeployments(depData);
      setModels(modelData);

      if (depData.length > 0 && !selectedDeployment) {
        selectDeployment(depData[0]._id);
      }
      if (modelData.length > 0 && !selectedModelId) {
        setSelectedModelId(modelData[0]._id);
      }
    } catch (err) {
      console.error('Failed to load deployments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeployments();
  }, []);

  const selectDeployment = async (id: string) => {
    try {
      const dep = deployments.find(d => d._id === id) || await fetchApi<any>(`/deployments/${id}`);
      setSelectedDeployment(dep);
      const health = await fetchApi<any>(`/deployments/${id}/health`);
      setHealthStatus(health);
      const reqs = await fetchApi<any[]>(`/deployments/${id}/requests`);
      setRequests(reqs);
    } catch (err) {
      console.error('Failed to fetch deployment details:', err);
    }
  };

  const handleCreateDeployment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !selectedModelId) return alert('Fill name and model version.');

    try {
      setLoading(true);
      await fetchApi('/deployments', {
        method: 'POST',
        body: JSON.stringify({
          name,
          modelVersionId: selectedModelId,
          environment
        })
      });
      setName('');
      await loadDeployments();
    } catch (err: any) {
      alert(`Error creating deployment: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async () => {
    if (!selectedDeployment) return;
    const newStatus = selectedDeployment.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      setLoading(true);
      const updated = await fetchApi<any>(`/deployments/${selectedDeployment._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      setSelectedDeployment(updated);
      await selectDeployment(selectedDeployment._id);
      await loadDeployments();
    } catch (err: any) {
      alert(`Status toggle error: ${err.message}`);
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
            <Rocket className="w-5 h-5 mr-2 text-blue-600" /> Deployment Lifecycle & Endpoint Status
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage active inference endpoints, environment staging, and verify deployment health.
          </p>
        </div>
      </div>

      {/* Grid: Create Form + Deployments List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Deployment Form */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center">
            <PlusCircle className="w-4 h-4 mr-2 text-blue-600" /> Deploy Model Version
          </h3>

          <form onSubmit={handleCreateDeployment} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Deployment Identifier</label>
              <input
                type="text"
                required
                placeholder="e.g. threat-engine-staging"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Model Version</label>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {models.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.modelName} ({m.version} - {m.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Environment</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Production">Production</option>
                <option value="Staging">Staging</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || models.length === 0}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
            >
              Activate Endpoint Deployment
            </button>
          </form>
        </div>

        {/* Master Deployments List */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">
            Active & Staged Deployments ({deployments.length})
          </h3>

          {deployments.length === 0 ? (
            <EmptyState title="No deployments" description="Create a deployment above to register an active inference endpoint." />
          ) : (
            <div className="space-y-3">
              {deployments.map((d) => (
                <div
                  key={d._id}
                  onClick={() => selectDeployment(d._id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedDeployment?._id === d._id
                      ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono font-bold text-slate-900">{d.name}</span>
                      <span className="text-[10px] font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {d.environment}
                      </span>
                    </div>
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="text-xs font-mono text-blue-700 mt-1 truncate">{d.endpointUrl}</p>

                  <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-500">
                    <span>Total Inferences: <strong className="text-slate-800">{d.requestCount}</strong></span>
                    <span>Last Check: {new Date(d.lastHealthCheck).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected Deployment Detail & Control */}
      {selectedDeployment && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center space-x-3">
                <h3 className="text-base font-bold text-slate-900">{selectedDeployment.name}</h3>
                <StatusBadge status={selectedDeployment.status} />
              </div>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Endpoint URL: <span className="text-blue-700 font-bold">{selectedDeployment.endpointUrl}</span>
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => selectDeployment(selectedDeployment._id)}
                className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-300 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Check Health
              </button>

              <button
                onClick={toggleStatus}
                className={`inline-flex items-center px-4 py-1.5 text-xs font-semibold rounded shadow-xs transition-colors text-white ${
                  selectedDeployment.status === 'ACTIVE'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <Power className="w-3.5 h-3.5 mr-1.5" />
                {selectedDeployment.status === 'ACTIVE' ? 'Deactivate Endpoint' : 'Activate Endpoint'}
              </button>
            </div>
          </div>

          {/* Health Diagnostics Panel */}
          {healthStatus && (
            <div className={`p-4 rounded-lg border text-xs font-mono flex items-start space-x-3 ${
              healthStatus.isHealthy ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              {healthStatus.isHealthy ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold uppercase tracking-wider">{healthStatus.message}</span>
                <div className="mt-1 text-[11px] opacity-80">
                  Last verified: {new Date(healthStatus.lastHealthCheck).toLocaleTimeString()} | Mode: SIMULATED / DEMO MODE
                </div>
              </div>
            </div>
          )}

          {/* Deployment Request History Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Endpoint Inference Traffic</h4>
            <div className="overflow-x-auto border border-slate-200 rounded-md">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Request ID</th>
                    <th className="p-2.5">Classification</th>
                    <th className="p-2.5">Anomaly Score</th>
                    <th className="p-2.5">Latency</th>
                    <th className="p-2.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400 font-sans">
                        No requests sent to this specific deployment yet.
                      </td>
                    </tr>
                  ) : (
                    requests.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">{r.requestId}</td>
                        <td className="p-2.5">
                          <StatusBadge status={r.prediction} />
                        </td>
                        <td className="p-2.5 font-bold">{r.anomalyScore}</td>
                        <td className="p-2.5 text-slate-600">{r.processingTimeMs}ms</td>
                        <td className="p-2.5 text-slate-500">{new Date(r.createdAt).toLocaleTimeString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
