import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  isSimulated?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = 'neutral',
  isSimulated
}) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        <div className="p-2 rounded-md bg-blue-50 text-blue-600">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded ${
              trendType === 'positive'
                ? 'bg-emerald-50 text-emerald-700'
                : trendType === 'negative'
                ? 'bg-rose-50 text-rose-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      {isSimulated && (
        <span className="mt-2 inline-block text-[10px] uppercase tracking-wider font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
          Demo Metric
        </span>
      )}
    </div>
  );
};
