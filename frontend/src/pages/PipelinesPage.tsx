import React, { useState, useEffect } from 'react';
import { GitMerge, Play, CheckCircle2, Clock, AlertCircle, RefreshCw, Terminal } from 'lucide-react';
import { fetchApi } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';

export const PipelinesPage: React.FC = () => {
  const [runs, setRuns] = useState<any[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedRun, setSelectedRun] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);

  // Form states
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [threshold, setThreshold] = useState(0.65);

  const loadPipelineData = async () => {
    try {
      setLoading(true);
      const [runsData, datasetsData] = await Promise.all([
        fetchApi<any[]>('/pipelines'),
        fetchApi<any[]>('/datasets')
      ]);
      setRuns(runsData);
      setDatasets(datasetsData);

      if (runsData.length > 0 && !selectedRun) {
        setSelectedRun(runsData[0]);
      }
      if (datasetsData.length > 0 && !selectedDatasetId) {
        setSelectedDatasetId(datasetsData[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch pipeline runs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipelineData();
    const interval = setInterval(loadPipelineData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStartPipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDatasetId) return alert('Select a dataset first');

    const ds = datasets.find(d => d._id === selectedDatasetId);
    if (!ds) return;

    try {
      setExecuting(true);
      // Fetch latest dataset version
      const details = await fetchApi<any>(`/datasets/${selectedDatasetId}`);
      const verId = details.versions?.[0]?._id;

      const newRun = await fetchApi<any>('/pipelines/run', {
        method: 'POST',
        body: JSON.stringify({
          datasetId: selectedDatasetId,
          datasetVersionId: verId,
          config: { threshold: Number(threshold) }
        })
      });

      setSelectedRun(newRun);
      await loadPipelineData();
    } catch (err: any) {
      alert(`Pipeline execution error: ${err.message}`);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <GitMerge className="w-5 h-5 mr-2 text-blue-600" /> Pipeline Orchestrator & Execution Engine
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Execute step-by-step MLOps pipelines from ingestion to simulated model registration.
          </p>
        </div>
      </div>

      {/* Pipeline Trigger Control */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">
          Trigger New Pipeline Execution
        </h3>

        <form onSubmit={handleStartPipeline} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Dataset</label>
            <select
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {datasets.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.currentVersion} - {d.totalRecords} recs)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Decision Anomaly Threshold</label>
            <input
              type="number"
              step="0.05"
              min="0.10"
              max="0.95"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={executing || datasets.length === 0}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center justify-center"
          >
            {executing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            {executing ? 'Initializing Pipeline...' : 'Run MLOps Pipeline'}
          </button>
        </form>
      </div>

      {/* Main Grid: Runs History + Active Stage Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Runs Master List */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Execution Runs ({runs.length})</h3>
            <button onClick={loadPipelineData} className="text-xs text-slate-500 hover:text-slate-800">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {runs.length === 0 ? (
            <EmptyState title="No pipeline runs" description="Trigger a pipeline run above to start execution." />
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {runs.map((r) => (
                <div
                  key={r._id}
                  onClick={() => setSelectedRun(r)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    selectedRun?._id === r._id
                      ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-900">{r.runId}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 font-mono flex items-center justify-between">
                    <span>Duration: {r.durationMs || 1200}ms</span>
                    <span>{new Date(r.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Run Details & Stage Stepper */}
        {selectedRun && (
          <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-base font-bold text-slate-900">Pipeline Run {selectedRun.runId}</h3>
                  <StatusBadge status={selectedRun.status} />
                </div>
                <p className="text-xs text-slate-500 font-mono mt-1">
                  Threshold: {selectedRun.config?.threshold} | Stages: {selectedRun.stages?.length} Completed
                </p>
              </div>
            </div>

            {/* Stages Step-by-Step Progress */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Sequential Stage Progress</h4>

              {selectedRun.stages?.map((stg: any, idx: number) => {
                const isCompleted = stg.status === 'COMPLETED';
                const isRunning = stg.status === 'RUNNING';
                const isFailed = stg.status === 'FAILED';

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-lg border transition-colors ${
                      isCompleted
                        ? 'bg-emerald-50/30 border-emerald-200'
                        : isRunning
                        ? 'bg-blue-50/50 border-blue-300 animate-pulse'
                        : isFailed
                        ? 'bg-rose-50/40 border-rose-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                            isCompleted
                              ? 'bg-emerald-600 text-white'
                              : isRunning
                              ? 'bg-blue-600 text-white'
                              : isFailed
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-300 text-slate-600'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <span className="text-xs font-bold text-slate-900">{stg.name}</span>
                      </div>
                      <div className="flex items-center space-x-3 font-mono text-[11px]">
                        {stg.durationMs && <span className="text-slate-500">{stg.durationMs}ms</span>}
                        <StatusBadge status={stg.status} />
                      </div>
                    </div>

                    {/* Stage Logs Terminal View */}
                    {stg.logs && stg.logs.length > 0 && (
                      <div className="mt-2.5 bg-slate-900 text-slate-200 rounded p-2.5 font-mono text-[11px] space-y-1">
                        {stg.logs.map((log: string, lIdx: number) => (
                          <div key={lIdx} className="flex items-start">
                            <Terminal className="w-3 h-3 text-sky-400 mr-1.5 mt-0.5 shrink-0" />
                            <span>{log}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
