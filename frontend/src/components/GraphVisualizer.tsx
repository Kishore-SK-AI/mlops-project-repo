import React from 'react';
import { ShieldAlert, ShieldCheck, ArrowRight, Terminal, Cpu, Network } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  type: string;
}

interface Edge {
  source: string;
  target: string;
  relationship: string;
}

interface GraphVisualizerProps {
  nodes?: Node[];
  edges?: Edge[];
  processChain?: string[];
  isAttack?: boolean;
  isLivingOffTheLand?: boolean;
}

export const GraphVisualizer: React.FC<GraphVisualizerProps> = ({
  nodes = [],
  edges = [],
  processChain = [],
  isAttack = false,
  isLivingOffTheLand = false
}) => {
  const chain = processChain.length > 0 ? processChain : nodes.map(n => n.label);

  return (
    <div className="bg-slate-900 text-slate-100 rounded-lg p-5 border border-slate-800 shadow-inner">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div className="flex items-center space-x-2">
          <Network className="w-5 h-5 text-sky-400" />
          <h4 className="text-sm font-semibold tracking-wide uppercase text-slate-200">
            Reconstructed Process Execution Graph
          </h4>
        </div>
        <div className="flex items-center space-x-2">
          {isLivingOffTheLand && (
            <span className="bg-amber-950 text-amber-300 border border-amber-800 text-xs px-2.5 py-0.5 rounded font-mono">
              LotL Attack Path
            </span>
          )}
          {isAttack ? (
            <span className="bg-rose-950 text-rose-300 border border-rose-800 text-xs px-2 py-0.5 rounded font-mono inline-flex items-center">
              <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Malicious Graph
            </span>
          ) : (
            <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs px-2 py-0.5 rounded font-mono inline-flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Safe Graph
            </span>
          )}
        </div>
      </div>

      {chain.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm font-mono">
          No process chain telemetry provided.
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex items-center justify-start min-w-max space-x-3 px-2 py-4">
            {chain.map((proc, index) => {
              const isRoot = index === 0;
              const isLeaf = index === chain.length - 1;
              const isSuspiciousProc = ['powershell.exe', 'cmd.exe', 'mimikatz.exe', 'nc.exe', 'python.exe', 'wscript.exe'].includes(proc.toLowerCase());

              let badgeColor = 'bg-slate-800 border-slate-700 text-slate-200';
              if (isSuspiciousProc && isAttack) {
                badgeColor = 'bg-rose-950 border-rose-700 text-rose-200 ring-2 ring-rose-500/50';
              } else if (isRoot) {
                badgeColor = 'bg-sky-950 border-sky-800 text-sky-200';
              }

              return (
                <React.Fragment key={index}>
                  <div className={`flex flex-col items-center p-3 rounded-lg border min-w-[140px] transition-all ${badgeColor}`}>
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {isRoot ? 'Root Parent' : isLeaf ? 'Target Process' : `Child Node ${index}`}
                      </span>
                      <Terminal className="w-3.5 h-3.5 opacity-60" />
                    </div>
                    <span className="font-mono text-sm font-bold tracking-tight text-white my-1">
                      {proc}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      PID: {1000 + index * 412}
                    </span>
                  </div>

                  {index < chain.length - 1 && (
                    <div className="flex flex-col items-center px-1 text-slate-500">
                      <span className="text-[9px] font-mono text-slate-500 mb-0.5">spawns</span>
                      <ArrowRight className="w-5 h-5 text-slate-600 animate-pulse" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>Graph Nodes: {chain.length}</span>
        <span>Relationships: {Math.max(0, chain.length - 1)} (SPAWNS_PROCESS)</span>
        <span>Depth: {chain.length}</span>
      </div>
    </div>
  );
};
