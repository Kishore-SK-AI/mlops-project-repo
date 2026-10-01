import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  GitMerge,
  FlaskConical,
  Boxes,
  Rocket,
  PlaySquare,
  Activity,
  Settings,
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Menu,
  X
} from 'lucide-react';
import { fetchApi } from '../services/api';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const location = useLocation();
  const [apiConnected, setApiConnected] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await fetchApi('/health');
        setApiConnected(true);
      } catch (err) {
        setApiConnected(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Datasets', path: '/datasets', icon: Database },
    { name: 'Pipelines', path: '/pipelines', icon: GitMerge },
    { name: 'Experiments', path: '/experiments', icon: FlaskConical },
    { name: 'Model Registry', path: '/models', icon: Boxes },
    { name: 'Deployments', path: '/deployments', icon: Rocket },
    { name: 'Inference', path: '/inference', icon: PlaySquare },
    { name: 'Monitoring', path: '/monitoring', icon: Activity },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-900">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transform transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-slate-800 bg-slate-950/50">
          <div className="p-2 rounded bg-blue-600 text-white mr-3 shadow-sm">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide leading-none">3Age Platform</h1>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">Graph Threat Engine</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs">
          <div className="flex items-center justify-between text-slate-400 font-mono text-[11px] mb-1">
            <span>Domain: Cybersecurity</span>
            <span>MLOps v1.0</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Academic Project — Chennai Institute of Technology
          </p>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Navigation */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-md text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Project Selector Badge */}
            <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
              <span className="text-xs font-semibold text-slate-700">Project:</span>
              <span className="text-xs font-medium text-blue-700">3Age — Graph Based Threat Engine</span>
            </div>
          </div>

          {/* Right Status Indicators */}
          <div className="flex items-center space-x-3">
            {/* Demo Mode Indicator Pill */}
            <div
              className="flex items-center space-x-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs px-2.5 py-1 rounded-md font-mono"
              title="Demonstration Engine Mode active: Scores derived deterministically via pattern matching engine."
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="font-semibold">SIMULATED / DEMO MODE</span>
            </div>

            {/* Backend API Health Status */}
            <div
              className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-md border font-mono ${
                apiConnected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {apiConnected ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>API CONNECTED</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>API DISCONNECTED</span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
