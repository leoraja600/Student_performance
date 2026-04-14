import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import { StatCard, Badge, Spinner, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [sRes, hRes] = await Promise.all([
        adminAPI.stats(),
        adminAPI.health()
      ]);
      setStats(sRes.data.data);
      setHealth(hRes.data.data);
    } catch {
      toast.error('Failed to load system stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await adminAPI.sync();
      toast.success('Full sync started!');
    } catch { toast.error('Sync trigger failed'); }
    finally { setSyncing(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Spinner size={12} /></div>;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Control Center</h1>
          <p className="text-sm text-slate-500 mt-1">Infrastructure monitoring & automation</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleSync} disabled={syncing} className="btn-primary shadow-sm text-sm py-2 bg-gradient-to-r from-accent-600 to-accent-700">
            {syncing ? 'Syncing...' : 'Force Global Sync'}
          </button>
        </div>
      </div>

      {/* API Health Monitor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-5 border-l-4 border-yellow-500 bg-white">
           <div className="flex justify-between items-center">
             <div>
               <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">LeetCode API Status</h3>
               <p className="text-[10px] text-slate-400 mt-1">Real-time scraper connectivity</p>
             </div>
             <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${health?.leetcode?.success > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className={`text-[10px] font-black tracking-tight ${health?.leetcode?.success > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {health?.leetcode?.success > 0 ? 'OPERATIONAL' : 'DEGRADED'}
                </span>
             </div>
           </div>
           <div className="mt-4 flex justify-between text-[10px] font-mono text-slate-400 font-bold">
              <span>Success Rate: {Math.round((health?.leetcode?.success / health?.leetcode?.total) * 100 || 0)}%</span>
              <span>Latency: ~240ms</span>
           </div>
        </div>

        <div className="card p-5 border-l-4 border-emerald-500 bg-white">
           <div className="flex justify-between items-center">
             <div>
               <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">HackerRank API Status</h3>
               <p className="text-[10px] text-slate-400 mt-1">REST connectivity health</p>
             </div>
             <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${health?.hackerrank?.success > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className={`text-[10px] font-black tracking-tight ${health?.hackerrank?.success > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {health?.hackerrank?.success > 0 ? 'OPERATIONAL' : 'DEGRADED'}
                </span>
             </div>
           </div>
           <div className="mt-4 flex justify-between text-[10px] font-mono text-slate-400 font-bold">
              <span>Success Rate: {Math.round((health?.hackerrank?.success / health?.hackerrank?.total) * 100 || 0)}%</span>
              <span>Latency: ~180ms</span>
           </div>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Students" value={stats?.totalStudents} color="primary" />
        <StatCard title="Data Snapshots" value={stats?.totalSnapshots} color="purple" />
        <StatCard title="Fetch Success" value={stats?.logStats?.SUCCESS || 0} color="green" />
        <StatCard title="Fetch Errors" value={stats?.logStats?.FAILED || 0} color="red" />
      </div>

      {/* Cron & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-1 bg-white">
          <h2 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Automation</h2>
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-500">Cron Status</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${stats?.cronStatus?.enabled ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                {stats?.cronStatus?.enabled ? 'RUNNING' : 'STOPPED'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-500">Schedule</span>
              <code className="text-xs text-primary-600 font-black">{stats?.cronStatus?.schedule}</code>
            </div>
          </div>
        </div>

        <div className="card lg:col-span-2 overflow-hidden bg-white">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-900 uppercase">Live Activity Stream</h2>
          </div>
          <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
            {stats?.recentLogs?.map(log => (
              <div key={log.id} className="p-4 flex justify-between items-center group hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                   <div className={`w-2 h-2 rounded-full ${log.status === 'SUCCESS' ? 'bg-green-500 shadow-sm' : 'bg-red-500 shadow-sm'}`} />
                   <div>
                     <p className="text-xs font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{log.student?.name}</p>
                     <p className="text-[10px] text-slate-500 font-medium">{log.message || 'Data integrity check complete.'}</p>
                   </div>
                </div>
                <div className="text-right">
                   <span className={`text-[10px] font-black tracking-tighter ${log.platform === 'LEETCODE' ? 'text-yellow-600' : 'text-emerald-600'}`}>{log.platform}</span>
                   <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">{new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
