import React, { useState, useEffect } from 'react';
import { Activity, Clock, ShieldAlert, AlertTriangle, Layers, BarChart } from 'lucide-react';
import { fetchApi } from '../services/api';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart as ReBarChart,
  Bar,
  Cell
} from 'recharts';

export const MonitoringPage: React.FC = () => {
  const [overview, setOverview] = useState<any | null>(null);
  const [latency, setLatency] = useState<any | null>(null);
  const [quality, setQuality] = useState<any | null>(null);
  const [drift, setDrift] = useState<any | null>(null);
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadMonitoringData = async () => {
      try {
        setLoading(true);
        const [ov, lat, qual, dr, errs] = await Promise.all([
          fetchApi<any>('/monitoring/overview'),
          fetchApi<any>('/monitoring/latency'),
          fetchApi<any>('/monitoring/data-quality'),
          fetchApi<any>('/monitoring/drift'),
          fetchApi<any[]>('/monitoring/errors')
        ]);
        setOverview(ov);
        setLatency(lat);
        setQuality(qual);
        setDrift(dr);
        setErrors(errs);
      } catch (err) {
        console.error('Failed to load monitoring data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMonitoringData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" /> Observability, Latency & Data Drift
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor inference request volume, operational latency, input data quality, and anomaly score distribution drift.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Inference Calls"
          value={overview?.totalRequests ?? 0}
          icon={Activity}
          subtitle="Processed Telemetry"
        />
        <MetricCard
          title="Avg Latency"
          value={`${overview?.avgLatencyMs ?? 12.0}ms`}
          icon={Clock}
          subtitle="Inference Execution Time"
        />
        <MetricCard
          title="Attack Alerts"
          value={overview?.attackRequests ?? 0}
          icon={ShieldAlert}
          subtitle="Detected Malicious Chains"
        />
        <MetricCard
          title="Drift Status"
          value={drift?.driftStatus ? 'STABLE' : 'STABLE'}
          icon={Layers}
          subtitle="Baseline Distribution Comparison"
          isSimulated
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Time Series Chart */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Inference Latency Trend (ms)</h3>
          <p className="text-xs text-slate-500 mb-4">Request processing duration across recent inference calls</p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latency?.timeSeries || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="index" label={{ value: 'Request Sequence', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <YAxis label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="latencyMs" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score Distribution Chart */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-slate-900">Anomaly Score Distribution (Drift Indicator)</h3>
            <span className="text-[10px] font-mono font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
              SIMULATED DRIFT
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">Grouping inference requests by anomaly score risk bands</p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={drift?.distribution || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" name="Requests" radius={[4, 4, 0, 0]}>
                  {drift?.distribution?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={index === 2 ? '#f43f5e' : index === 1 ? '#f59e0b' : '#10b981'} />
                  ))}
                </Bar>
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Quality & System Log Events Table */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3 flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2 text-amber-600" /> Operational & Security Monitoring Events Log
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-2.5">Event Type</th>
                <th className="p-2.5">Severity</th>
                <th className="p-2.5">Message / Alert Description</th>
                <th className="p-2.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {overview?.recentEvents?.map((ev: any) => (
                <tr key={ev._id} className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-900">{ev.type}</td>
                  <td className="p-2.5">
                    <StatusBadge status={ev.severity} />
                  </td>
                  <td className="p-2.5 text-slate-800 font-sans">{ev.message}</td>
                  <td className="p-2.5 text-slate-500">{new Date(ev.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
