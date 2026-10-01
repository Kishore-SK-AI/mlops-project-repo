import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, Shield, Sliders } from 'lucide-react';
import { fetchApi } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultThreshold, setDefaultThreshold] = useState(0.65);
  const [maxUploadMB, setMaxUploadMB] = useState(50);
  const [refreshInterval, setRefreshInterval] = useState(10);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const data = await fetchApi<any>('/settings');
        setSettings(data);
        setProjectName(data.projectName || '3Age — Graph Based Threat Engine');
        setDescription(data.description || '');
        setDefaultThreshold(data.defaultThreshold ?? 0.65);
        setMaxUploadMB(Math.round((data.maxUploadSizeBytes || 52428800) / 1024 / 1024));
        setRefreshInterval(data.uiPreferences?.refreshIntervalSeconds ?? 10);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const updated = await fetchApi<any>('/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          projectName,
          description,
          defaultThreshold: Number(defaultThreshold),
          maxUploadSizeBytes: Number(maxUploadMB) * 1024 * 1024,
          uiPreferences: { refreshIntervalSeconds: Number(refreshInterval) }
        })
      });
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(`Failed to update settings: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-blue-600" /> Platform & Engine Configuration
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure system default thresholds, simulation engine parameters, and dataset limits.
          </p>
        </div>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-md flex items-center">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2" />
          <span>Application settings saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-6">
        {/* Project Metadata */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Project Identity & Academic Metadata
          </h3>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Engine Defaults */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center">
            <Sliders className="w-4 h-4 mr-2 text-blue-600" /> Simulated Engine Defaults
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Anomaly Decision Threshold</label>
              <input
                type="number"
                step="0.05"
                min="0.10"
                max="0.95"
                value={defaultThreshold}
                onChange={(e) => setDefaultThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">Scores above this threshold trigger an ATTACK prediction.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max CSV Upload Limit (MB)</label>
              <input
                type="number"
                value={maxUploadMB}
                onChange={(e) => setMaxUploadMB(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">Maximum allowed CSV dataset file size for ingestion.</p>
            </div>
          </div>
        </div>

        {/* Engine Transparency Box */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 space-y-1 font-mono">
          <div className="font-bold flex items-center text-amber-950">
            <Shield className="w-4 h-4 mr-1.5 text-amber-700" /> Engine Transparency Notice
          </div>
          <p>
            Engine Operating Mode: <strong>SIMULATED / DEMO MODE</strong>. All evaluation metrics, anomaly scores, and model artifacts are computed deterministically via the backend pattern matcher service for demonstration purposes.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md shadow-xs transition-colors"
        >
          <Save className="w-4 h-4 mr-2" /> Save Settings
        </button>
      </form>
    </div>
  );
};
