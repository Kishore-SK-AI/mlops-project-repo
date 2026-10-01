import React, { useState, useEffect } from 'react';
import { PlaySquare, Send, ShieldAlert, ShieldCheck, Terminal, Code, Cpu, Network, History, Sparkles } from 'lucide-react';
import { fetchApi } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { GraphVisualizer } from '../components/GraphVisualizer';

export const InferencePage: React.FC = () => {
  const [deployments, setDeployments] = useState<any[]>([]);
  const [selectedDeploymentId, setSelectedDeploymentId] = useState('');
  const [mode, setMode] = useState<'form' | 'json'>('form');

  // Form Fields
  const [parentProcess, setParentProcess] = useState('winword.exe');
  const [processName, setProcessName] = useState('powershell.exe');
  const [processChainStr, setProcessChainStr] = useState('winword.exe -> powershell.exe -> python.exe');
  const [commandLine, setCommandLine] = useState('powershell.exe -ExecutionPolicy Bypass -enc AAAA1234');
  const [outboundBytes, setOutboundBytes] = useState(45000000);
  const [destPort, setDestPort] = useState(4444);
  const [cpuUsage, setCpuUsage] = useState(88.5);
  const [fileEntropy, setFileEntropy] = useState(7.8);

  // Raw JSON
  const [jsonText, setJsonText] = useState(`{
  "parent_process": "winword.exe",
  "process_name": "powershell.exe",
  "process_chain": ["winword.exe", "powershell.exe", "python.exe"],
  "command_line": "powershell.exe -ExecutionPolicy Bypass -enc AAAA1234",
  "outbound_bytes": 45000000,
  "dest_port": 4444,
  "cpu_usage": 88.5,
  "file_entropy": 7.8
}`);

  // Result & History
  const [result, setResult] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [executing, setExecuting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadInitialData = async () => {
    try {
      const [deps, hist] = await Promise.all([
        fetchApi<any[]>('/deployments'),
        fetchApi<any[]>('/inference/history?limit=15')
      ]);
      const activeDeps = deps.filter(d => d.status === 'ACTIVE');
      setDeployments(activeDeps);
      if (activeDeps.length > 0) {
        setSelectedDeploymentId(activeDeps[0]._id);
      }
      setHistory(hist);
    } catch (err) {
      console.error('Failed to load inference page initial data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadPreset = (type: 'attack1' | 'attack2' | 'normal') => {
    if (type === 'attack1') {
      setParentProcess('winword.exe');
      setProcessName('powershell.exe');
      setProcessChainStr('winword.exe -> powershell.exe -> python.exe');
      setCommandLine('powershell.exe -ExecutionPolicy Bypass -enc AAAA1234');
      setOutboundBytes(45000000);
      setDestPort(4444);
      setCpuUsage(88.5);
      setFileEntropy(7.8);
    } else if (type === 'attack2') {
      setParentProcess('excel.exe');
      setProcessName('cmd.exe');
      setProcessChainStr('excel.exe -> cmd.exe -> mimikatz.exe');
      setCommandLine('cmd.exe /c mimikatz.exe sekurlsa::logonpasswords');
      setOutboundBytes(12000000);
      setDestPort(1337);
      setCpuUsage(94.0);
      setFileEntropy(7.9);
    } else if (type === 'normal') {
      setParentProcess('explorer.exe');
      setProcessName('chrome.exe');
      setProcessChainStr('explorer.exe -> chrome.exe');
      setCommandLine('chrome.exe --no-sandbox');
      setOutboundBytes(142050);
      setDestPort(443);
      setCpuUsage(12.0);
      setFileEntropy(4.2);
    }
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setExecuting(true);

    try {
      let payload: any = {};
      if (mode === 'json') {
        payload = JSON.parse(jsonText);
      } else {
        const chainArray = processChainStr.split('->').map(s => s.trim()).filter(Boolean);
        payload = {
          parent_process: parentProcess,
          process_name: processName,
          process_chain: chainArray,
          command_line: commandLine,
          outbound_bytes: Number(outboundBytes),
          dest_port: Number(destPort),
          cpu_usage: Number(cpuUsage),
          file_entropy: Number(fileEntropy)
        };
      }

      const res = await fetchApi<any>(
        `/inference/predict?deploymentId=${selectedDeploymentId}`,
        {
          method: 'POST',
          body: JSON.stringify(payload)
        }
      );

      setResult(res);
      // Reload history
      const hist = await fetchApi<any[]>('/inference/history?limit=15');
      setHistory(hist);
    } catch (err: any) {
      setErrorMsg(err.message || 'Inference call failed');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <PlaySquare className="w-5 h-5 mr-2 text-blue-600" /> Interactive Threat Inference Playground
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Submit telemetry payloads to the rule-based Graph Threat Engine for real-time attack sequence classification.
          </p>
        </div>

        {/* Presets Quick Picker */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" /> Jury Presets:
          </span>
          <button
            onClick={() => loadPreset('attack1')}
            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded border border-rose-200 shadow-xs"
          >
            Attack 1: LotL Chain
          </button>
          <button
            onClick={() => loadPreset('attack2')}
            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded border border-rose-200 shadow-xs"
          >
            Attack 2: Mimikatz Exfil
          </button>
          <button
            onClick={() => loadPreset('normal')}
            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded border border-emerald-200 shadow-xs"
          >
            Normal Telemetry
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm p-4 rounded-md flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-xs font-bold text-rose-900">Dismiss</button>
        </div>
      )}

      {/* Main Grid: Telemetry Input Form + Realtime Prediction Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & JSON Editor (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Input Telemetry Payload</h3>

            {/* Mode Switcher */}
            <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded border border-slate-200">
              <button
                onClick={() => setMode('form')}
                className={`px-2 py-0.5 text-xs font-semibold rounded ${mode === 'form' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600'}`}
              >
                Form
              </button>
              <button
                onClick={() => setMode('json')}
                className={`px-2 py-0.5 text-xs font-semibold rounded ${mode === 'json' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600'}`}
              >
                JSON
              </button>
            </div>
          </div>

          <form onSubmit={handlePredict} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Active Deployment</label>
              <select
                value={selectedDeploymentId}
                onChange={(e) => setSelectedDeploymentId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {deployments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.environment})
                  </option>
                ))}
              </select>
            </div>

            {mode === 'form' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Process Execution Chain (A -&gt; B -&gt; C)</label>
                  <input
                    type="text"
                    value={processChainStr}
                    onChange={(e) => setProcessChainStr(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Process</label>
                    <input
                      type="text"
                      value={parentProcess}
                      onChange={(e) => setParentProcess(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Process Name</label>
                    <input
                      type="text"
                      value={processName}
                      onChange={(e) => setProcessName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Command Line Arguments</label>
                  <input
                    type="text"
                    value={commandLine}
                    onChange={(e) => setCommandLine(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Outbound Bytes</label>
                    <input
                      type="number"
                      value={outboundBytes}
                      onChange={(e) => setOutboundBytes(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Port</label>
                    <input
                      type="number"
                      value={destPort}
                      onChange={(e) => setDestPort(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">CPU Usage (%)</label>
                    <input
                      type="number"
                      value={cpuUsage}
                      onChange={(e) => setCpuUsage(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">File Entropy Score</label>
                    <input
                      type="number"
                      step="0.1"
                      value={fileEntropy}
                      onChange={(e) => setFileEntropy(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Raw JSON Record Editor</label>
                <textarea
                  rows={12}
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  className="w-full p-3 text-xs font-mono bg-slate-900 text-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={executing}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md shadow-xs transition-colors flex items-center justify-center"
            >
              <Send className="w-4 h-4 mr-2" />
              {executing ? 'Evaluating Threat Engine...' : 'Submit Inference Request'}
            </button>
          </form>
        </div>

        {/* Right Column: Interactive Prediction Result & Graph (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-6">
              {/* Classification Header Banner */}
              <div className={`p-4 rounded-lg border flex items-center justify-between ${
                result.prediction === 'ATTACK'
                  ? 'bg-rose-50 border-rose-200 text-rose-950'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
              }`}>
                <div className="flex items-center space-x-3">
                  {result.prediction === 'ATTACK' ? (
                    <ShieldAlert className="w-8 h-8 text-rose-600" />
                  ) : (
                    <ShieldCheck className="w-8 h-8 text-emerald-600" />
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-black tracking-tight">{result.prediction} DETECTED</span>
                      <span className="text-xs font-mono uppercase bg-white px-2 py-0.5 rounded border font-semibold">
                        {result.engineMode}
                      </span>
                    </div>
                    <p className="text-xs opacity-80 font-mono mt-0.5">
                      Request ID: {result.requestId} | Model: {result.modelName} ({result.modelVersion})
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-2xl font-extrabold">{result.anomalyScore}</span>
                  <p className="text-[10px] text-slate-500">Anomaly Score</p>
                </div>
              </div>

              {/* Anomaly Meter Score Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-slate-600 font-semibold">
                  <span>Anomaly Score Progress Meter</span>
                  <span>Threshold: {result.threshold}</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200 relative">
                  <div
                    className={`h-full transition-all duration-500 ${
                      result.anomalyScore >= result.threshold ? 'bg-rose-600' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, result.anomalyScore * 100)}%` }}
                  />
                </div>
              </div>

              {/* Process Graph Component */}
              <GraphVisualizer
                processChain={result.graphAnalysis?.processChain}
                isAttack={result.prediction === 'ATTACK'}
                isLivingOffTheLand={result.graphAnalysis?.isLivingOffTheLand}
                nodes={result.graphAnalysis?.graphNodes}
                edges={result.graphAnalysis?.graphEdges}
              />

              {/* Triggered Reason Codes & Explanation */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Engine Rule Findings & Reason Codes
                </h4>
                <div className="space-y-1.5">
                  {result.reasonCodes?.map((code: string, idx: number) => (
                    <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-800 flex items-start">
                      <span className="w-2 h-2 rounded-full bg-blue-600 mr-2 mt-1 shrink-0"></span>
                      <span>{code}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-100 pt-3">
                <span>Inference Execution Latency: <strong className="text-slate-800">{result.processingTimeMs}ms</strong></span>
                <span>Evaluated At: {new Date(result.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-500 space-y-2">
              <PlaySquare className="w-10 h-10 mx-auto text-slate-300" />
              <h3 className="text-base font-bold text-slate-800">No Inference Executed Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Fill the telemetry details or select a quick preset on the top right, then click "Submit Inference Request".
              </p>
            </div>
          )}
        </div>
      </div>

      {/* History Log Table */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3 flex items-center">
          <History className="w-4 h-4 mr-2 text-blue-600" /> Persistent Inference Request History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-2.5">Request ID</th>
                <th className="p-2.5">Process Chain</th>
                <th className="p-2.5">Prediction</th>
                <th className="p-2.5">Score</th>
                <th className="p-2.5">Threshold</th>
                <th className="p-2.5">Latency</th>
                <th className="p-2.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((h) => (
                <tr key={h._id} className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-900">{h.requestId}</td>
                  <td className="p-2.5 text-slate-700 truncate max-w-xs">
                    {h.graphAnalysis?.processChain?.join(' -> ') || h.inputPayload?.process_name || 'telemetry record'}
                  </td>
                  <td className="p-2.5">
                    <StatusBadge status={h.prediction} />
                  </td>
                  <td className="p-2.5 font-bold">{h.anomalyScore}</td>
                  <td className="p-2.5 text-slate-600">{h.threshold}</td>
                  <td className="p-2.5 text-slate-600">{h.processingTimeMs}ms</td>
                  <td className="p-2.5 text-slate-500">{new Date(h.createdAt).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
