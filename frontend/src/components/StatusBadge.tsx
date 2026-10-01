import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type }) => {
  let colorStyle = 'bg-slate-100 text-slate-700 border-slate-200';

  const s = status.toUpperCase();

  if (type === 'success' || s === 'ACTIVE' || s === 'COMPLETED' || s === 'VALID' || s === 'PRODUCTION' || s === 'NORMAL') {
    colorStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (type === 'warning' || s === 'WARNING' || s === 'STAGING' || s === 'PENDING' || s === 'RUNNING') {
    colorStyle = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (type === 'error' || s === 'INACTIVE' || s === 'FAILED' || s === 'ATTACK' || s === 'CRITICAL') {
    colorStyle = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (type === 'info' || s === 'DEVELOPMENT' || s === 'INFO') {
    colorStyle = 'bg-sky-50 text-sky-700 border-sky-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorStyle}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {status}
    </span>
  );
};
