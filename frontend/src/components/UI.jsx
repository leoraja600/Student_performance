import React from 'react';

export function StatCard({ title, value, subtitle, icon, color = 'primary', trend }) {
  const colors = {
    primary: 'text-primary-600 bg-primary-50',
    green: 'text-accent-600 bg-emerald-50',
    yellow: 'text-yellow-600 bg-yellow-50',
    red: 'text-red-600 bg-red-50',
    purple: 'text-purple-600 bg-purple-50',
  };

  return (
    <div className="card p-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mb-1">{value ?? '—'}</p>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          {trend !== undefined && (
            <p className={`text-xs mt-1 font-medium ${trend >= 0 ? 'text-accent-400' : 'text-red-400'}`}>
              {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% from last snapshot
            </p>
          )}
        </div>
        {icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="h-4 bg-surface-600 rounded w-24 mb-3 shimmer" />
      <div className="h-8 bg-surface-600 rounded w-16 mb-2 shimmer" />
      <div className="h-3 bg-surface-600 rounded w-32 shimmer" />
    </div>
  );
}

export function ScoreBar({ label, value, max, color = '#5a6af8' }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>{label}</span>
        <span>{value} / {max}</span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function Badge({ status }) {
  const map = {
    SUCCESS: 'badge-green',
    FAILED: 'badge-red',
    PARTIAL: 'badge-yellow',
    SKIPPED: 'badge-gray',
    ADMIN: 'badge-blue',
    STUDENT: 'badge-green',
  };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
}

export function Spinner({ size = 5 }) {
  return (
    <div
      className={`w-${size} h-${size} border-2 border-primary-500 border-t-transparent rounded-full animate-spin`}
    />
  );
}

export function EmptyState({ message = 'No data available', icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
      {icon || (
        <svg className="w-12 h-12 mb-4 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
      )}
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function RankBadge({ rank }) {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return (
    <span className="inline-flex w-8 h-8 items-center justify-center bg-slate-100 rounded-full text-sm font-bold text-slate-600">
      {rank}
    </span>
  );
}
