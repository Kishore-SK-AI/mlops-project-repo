import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  GitMerge,
  FlaskConical,
  Boxes,
  Rocket,
  PlaySquare,
  ArrowUpRight,
  ShieldAlert,
  Activity,
  PlusCircle,
  Play
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { fetchApi } from '../services/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    datasetsCount: 0,
    pipelinesCount: 0,
    experimentsCount: 0,
    modelsCount: 0,
    deploymentsCount: 0,
    inferenceCount: 0
  });

  const [recentInferences, setRecentInferences] = useState<any[]>([]);
  const [recentPipelines, setRecentPipelines] = useState<any[]>([]);

  useEffect(() => {
    const loadOverviewData = async () => {
      try {
        setLoading(true);
        const [datasets, pipelines, experiments, models, deployments, history] = await Promise.all([
          fetchApi<any[]>('/datasets').catch(() => []),
          fetchApi<any[]>('/pipelines').catch(() => []),
          fetchApi<any[]>('/experiments').catch(() => []),
          fetchApi<any[]>('/models').catch(() => []),
          fetchApi<any[]>('/deployments').catch(() => []),
          fetchApi<any[]>('/inference/history?limit=10').catch(() => [])
        ]);

        setStats({
          datasetsCount: datasets.length,
          pipelinesCount: pipelines.length,
          experimentsCount: experiments.length,
          modelsCount: models.length,
          deploymentsCount: deployments.filter(d => d.status === 'ACTIVE').length,
          inferenceCount: history.length
        });

        setRecentInferences(history.slice(0, 5));
        setRecentPipelines(pipelines.slice(0, 4));
      } catch (err) {
        console.error('Failed to load overview metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOverviewData();
  }, []);

  const metricChartData = [
    { name: 'Model v1.0.0', precision: 96.2, recall: 90.8, f1: 93.4 },
    { name: 'Pipeline Run #1', precision: 94.2, recall: 91.5, f1: 92.8 },
    { name: 'GNN Baseline', precision: 94.5, recall: 92.0, f1: 93.2 }
  ];

  const inferenceDistData = [
    { name: 'Normal Telemetry', value: stats.inferenceCount > 0 ? 3 : 7, color: '#10b981' },
    { name: 'Attack Patterns', value: stats.inferenceCount > 0 ? 2 : 3, color: '#f43f5e' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">3Age MLOps Operational Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time operational status for Graph-Based Behavioral Threat Engine and MLOps Pipeline Lifecycle.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/inference')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md shadow-xs transition-colors"
          >
            <PlaySquare className="w-4 h-4 mr-2" /> Inference Playground
          </button>
          <button
            onClick={() => navigate('/pipelines')}
            className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-md border border-slate-300 transition-colors"
          >
            <Play className="w-4 h-4 mr-2 text-slate-600" /> Run Pipeline
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard title="Datasets" value={stats.datasetsCount} icon={Database} subtitle="CSV Versioned Data" />
        <MetricCard title="Pipelines" value={stats.pipelinesCount} icon={GitMerge} subtitle="Execution Runs" />
        <MetricCard title="Experiments" value={stats.experimentsCount} icon={FlaskConical} subtitle="Tracked Runs" />
        <MetricCard title="Model Versions" value={stats.modelsCount} icon={Boxes} subtitle="In Model Registry" />
        <MetricCard title="Deployments" value={stats.deploymentsCount} icon={Rocket} subtitle="Active Endpoints" />
        <MetricCard title="Inferences" value={stats.inferenceCount} icon={Activity} subtitle="Processed Telemetry" />
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Evaluation Metrics Comparison */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Model Evaluation Metrics Comparison (%)</h3>
              <p className="text-xs text-slate-500">Precision, Recall, and F1-Score across registered models</p>
            </div>
            <span className="text-[10px] font-mono uppercase bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
              DEMO DATA
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metricChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="precision" name="Precision" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recall" name="Recall" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="f1" name="F1-Score" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inference Traffic Threat Classification */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Threat Distribution</h3>
              <p className="text-xs text-slate-500">Normal telemetry vs Attack chains</p>
            </div>
          </div>
          <div className="h-64 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="70%">
              <PieChart>
                <Pie
                  data={inferenceDistData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  dataKey="value"
                  paddingAngle={4}
                >
                  {inferenceDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center space-x-6 text-xs font-medium">
              <span className="flex items-center text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5"></span> Safe Telemetry
              </span>
              <span className="flex items-center text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-1.5"></span> Threat Chain
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Inference Activity Table */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Recent Telemetry Inference Log</h3>
            <button
              onClick={() => navigate('/inference')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center"
            >
              View Playground <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Request ID</th>
                  <th className="py-2.5 px-3">Process Chain / Telemetry</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Classification</th>
                  <th className="py-2.5 px-3">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {recentInferences.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 font-sans text-xs">
                      No inference records logged yet. Use the Playground to submit requests.
                    </td>
                  </tr>
                ) : (
                  recentInferences.map((req) => (
                    <tr key={req.requestId} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{req.requestId}</td>
                      <td className="py-2.5 px-3 text-slate-600 truncate max-w-xs font-mono">
                        {req.graphAnalysis?.processChain?.join(' -> ') || req.inputPayload?.process_name || 'telemetry record'}
                      </td>
                      <td className="py-2.5 px-3 font-bold">{req.anomalyScore}</td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={req.prediction} />
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{req.processingTimeMs}ms</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MLOps Quick Actions Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
            MLOps Quick Actions
          </h3>

          <button
            onClick={() => navigate('/datasets')}
            className="w-full flex items-center justify-between p-3 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition-colors"
          >
            <span className="flex items-center">
              <Database className="w-4 h-4 text-blue-600 mr-2.5" /> Upload CSV Dataset
            </span>
            <PlusCircle className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => navigate('/pipelines')}
            className="w-full flex items-center justify-between p-3 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition-colors"
          >
            <span className="flex items-center">
              <GitMerge className="w-4 h-4 text-emerald-600 mr-2.5" /> Trigger Pipeline Run
            </span>
            <Play className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => navigate('/experiments')}
            className="w-full flex items-center justify-between p-3 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition-colors"
          >
            <span className="flex items-center">
              <FlaskConical className="w-4 h-4 text-purple-600 mr-2.5" /> Create Experiment
            </span>
            <PlusCircle className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => navigate('/models')}
            className="w-full flex items-center justify-between p-3 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition-colors"
          >
            <span className="flex items-center">
              <Boxes className="w-4 h-4 text-amber-600 mr-2.5" /> Register Model Version
            </span>
            <PlusCircle className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
