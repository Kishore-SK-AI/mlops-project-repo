import React, { useState, useEffect } from 'react';
import { FlaskConical, PlusCircle, Play, BarChart2, Check, ArrowRightLeft } from 'lucide-react';
import { fetchApi } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';

export const ExperimentsPage: React.FC = () => {
  const [experiments, setExperiments] = useState<any[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<any | null>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRunIds, setSelectedRunIds] = useState<string[]>([]);
  const [comparedRuns, setComparedRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // New Exp form
  const [newExpName, setNewExpName] = useState('');
  const [algorithm, setAlgorithm] = useState('Graph Neural Network');
  const [description, setDescription] = useState('');

  // Run Exp form
  const [selectedDatasetVerId, setSelectedDatasetVerId] = useState('');
  const [threshold, setThreshold] = useState(0.65);
  const [graphDepth, setGraphDepth] = useState(3);

  const loadExperiments = async () => {
    try {
      setLoading(true);
      const [expData, dsData] = await Promise.all([
        fetchApi<any[]>('/experiments'),
        fetchApi<any[]>('/datasets')
      ]);
      setExperiments(expData);
      setDatasets(dsData);

      if (expData.length > 0 && !selectedExperiment) {
        selectExp(expData[0]._id);
      }
    } catch (err) {
      console.error('Failed to load experiments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExperiments();
  }, []);

  const selectExp = async (expId: string) => {
    try {
      const details = await fetchApi<any>(`/experiments/${expId}`);
      setSelectedExperiment(details.experiment);
      setRuns(details.runs || []);
    } catch (err) {
      console.error('Failed to load experiment details:', err);
    }
  };

  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpName) return;
    try {
      setLoading(true);
      await fetchApi('/experiments', {
        method: 'POST',
        body: JSON.stringify({ name: newExpName, algorithm, description })
      });
      setNewExpName('');
      setDescription('');
      await loadExperiments();
    } catch (err: any) {
      alert(`Error creating experiment: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExperiment) return;

    let targetVerId = selectedDatasetVerId;
    if (!targetVerId && datasets.length > 0) {
      const details = await fetchApi<any>(`/datasets/${datasets[0]._id}`);
      targetVerId = details.versions?.[0]?._id;
    }

    if (!targetVerId) return alert('No dataset version available for experiment execution.');

    try {
      setLoading(true);
      await fetchApi(`/experiments/${selectedExperiment._id}/run`, {
        method: 'POST',
        body: JSON.stringify({
          datasetVersionId: targetVerId,
          parameters: {
            algorithm: selectedExperiment.algorithm,
            threshold: Number(threshold),
            graphDepth: Number(graphDepth)
          }
        })
      });

      await selectExp(selectedExperiment._id);
    } catch (err: any) {
      alert(`Error running experiment: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleCompareRun = (runId: string) => {
    if (selectedRunIds.includes(runId)) {
      setSelectedRunIds(selectedRunIds.filter(id => id !== runId));
    } else {
      setSelectedRunIds([...selectedRunIds, runId]);
    }
  };

  const handleCompare = async () => {
    if (selectedRunIds.length < 2) return alert('Select at least 2 runs to compare.');
    try {
      setLoading(true);
      const res = await fetchApi<any[]>(`/experiments/compare?ids=${selectedRunIds.join(',')}`);
      setComparedRuns(res);
    } catch (err: any) {
      alert(err.message);
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
            <FlaskConical className="w-5 h-5 mr-2 text-blue-600" /> Experiment Tracking & Tuning
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Track reproducible runs, hyperparameter thresholds, graph depth, and compare metric performance.
          </p>
        </div>
      </div>

      {/* Grid: Create Exp Form + Experiment List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Exp Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center">
            <PlusCircle className="w-4 h-4 mr-2 text-blue-600" /> Create New Experiment
          </h3>

          <form onSubmit={handleCreateExperiment} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Experiment Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Graph GNN Threshold Tuning"
                value={newExpName}
                onChange={(e) => setNewExpName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model Algorithm</label>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Graph Neural Network">Graph Neural Network (GNN)</option>
                <option value="Isolation Forest + Graph Depth">Isolation Forest + Process Graph</option>
                <option value="Rule Pattern Matcher">Rule Pattern Matcher</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Hyperparameter search objective..."
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
              Initialize Tracked Experiment
            </button>
          </form>
        </div>

        {/* Experiment Master List */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">
            Tracked Experiments ({experiments.length})
          </h3>

          {experiments.length === 0 ? (
            <EmptyState title="No experiments" description="Create an experiment track on the left to get started." />
          ) : (
            <div className="space-y-3">
              {experiments.map((exp) => (
                <div
                  key={exp._id}
                  onClick={() => selectExp(exp._id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedExperiment?._id === exp._id
                      ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">{exp.name}</h4>
                    <span className="text-[10px] font-mono font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      {exp.algorithm}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{exp.description || 'No description provided.'}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-mono">
                    <span>Total Runs: <strong className="text-slate-800">{exp.runCount}</strong></span>
                    <span>Created: {new Date(exp.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected Experiment Run & Compare Panel */}
      {selectedExperiment && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">{selectedExperiment.name} — Runs</h3>
              <p className="text-xs text-slate-500 font-mono">Algorithm: {selectedExperiment.algorithm}</p>
            </div>

            <div className="flex items-center space-x-3">
              {selectedRunIds.length >= 2 && (
                <button
                  onClick={handleCompare}
                  className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5" /> Compare {selectedRunIds.length} Selected Runs
                </button>
              )}
            </div>
          </div>

          {/* Trigger Run Controls */}
          <form onSubmit={handleRunExperiment} className="bg-slate-50 p-4 rounded-md border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Decision Anomaly Threshold</label>
              <input
                type="number"
                step="0.05"
                min="0.20"
                max="0.95"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Process Graph Depth</label>
              <input
                type="number"
                min="1"
                max="10"
                value={graphDepth}
                onChange={(e) => setGraphDepth(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-xs transition-colors flex items-center justify-center"
            >
              <Play className="w-3.5 h-3.5 mr-1.5" /> Execute Demo Run
            </button>
          </form>

          {/* Runs Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-md">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Compare</th>
                  <th className="p-2.5">Run Name</th>
                  <th className="p-2.5">Threshold</th>
                  <th className="p-2.5">Precision</th>
                  <th className="p-2.5">Recall</th>
                  <th className="p-2.5">F1-Score</th>
                  <th className="p-2.5">Latency</th>
                  <th className="p-2.5">Tag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {runs.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50">
                    <td className="p-2.5">
                      <input
                        type="checkbox"
                        checked={selectedRunIds.includes(r._id)}
                        onChange={() => toggleCompareRun(r._id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-2.5 font-bold text-slate-900">{r.runName}</td>
                    <td className="p-2.5 text-slate-700">{r.parameters?.threshold}</td>
                    <td className="p-2.5 text-emerald-700 font-bold">{r.metrics?.precision}</td>
                    <td className="p-2.5 text-blue-700 font-bold">{r.metrics?.recall}</td>
                    <td className="p-2.5 text-teal-700 font-bold">{r.metrics?.f1Score}</td>
                    <td className="p-2.5 text-slate-600">{r.metrics?.inferenceLatencyMs}ms</td>
                    <td className="p-2.5">
                      <span className="text-[9px] uppercase font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        DEMO DATA
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Compared Runs Side-by-Side Table */}
          {comparedRuns.length > 0 && (
            <div className="mt-6 border-t border-slate-200 pt-6">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Side-by-Side Metric Comparison</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {comparedRuns.map((cr) => (
                  <div key={cr._id} className="bg-slate-50 border border-slate-200 p-4 rounded-md space-y-2">
                    <span className="text-xs font-bold text-slate-900">{cr.runName}</span>
                    <div className="text-xs space-y-1 font-mono pt-2 border-t border-slate-200">
                      <div className="flex justify-between"><span>Precision:</span><strong className="text-emerald-700">{cr.metrics?.precision}</strong></div>
                      <div className="flex justify-between"><span>Recall:</span><strong className="text-blue-700">{cr.metrics?.recall}</strong></div>
                      <div className="flex justify-between"><span>F1-Score:</span><strong className="text-teal-700">{cr.metrics?.f1Score}</strong></div>
                      <div className="flex justify-between"><span>FPR:</span><strong className="text-rose-700">{cr.metrics?.falsePositiveRate}</strong></div>
                      <div className="flex justify-between"><span>Latency:</span><span>{cr.metrics?.inferenceLatencyMs}ms</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
