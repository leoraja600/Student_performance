import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import { Badge, Spinner, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';

export default function FetchLogs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [platform, setPlatform] = useState('');
  const [status, setStatus] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.logs({ page, limit: 30, platform, status });
      setLogs(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [page, platform, status]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="p-6 space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Event Logs</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">{pagination.total} data synchronization entries</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <select
            className="input-field w-44 shadow-sm"
            value={platform}
            onChange={(e) => { setPlatform(e.target.value); setPage(1); }}
          >
            <option value="">All Platforms</option>
            <option value="LEETCODE">LeetCode</option>
            <option value="HACKERRANK">HackerRank</option>
            <option value="COMBINED">Combined Sync</option>
          </select>
          <select
            className="input-field w-40 shadow-sm"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">Success Only</option>
            <option value="FAILED">Fetch Failures</option>
            <option value="PARTIAL">Partial Sync</option>
            <option value="SKIPPED">No Updates</option>
          </select>
        </div>
      </div>

      {/* Log Table */}
      <div className="card overflow-hidden bg-white border-slate-100 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Spinner size={10} /></div>
        ) : logs.length === 0 ? (
          <EmptyState message="No system logs identified for current filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="table-header text-left font-black uppercase text-[10px]">Timestamp</th>
                  <th className="table-header text-left font-black uppercase text-[10px]">Entity</th>
                  <th className="table-header text-left font-black uppercase text-[10px]">Terminal</th>
                  <th className="table-header text-left font-black uppercase text-[10px]">Status Code</th>
                  <th className="table-header text-left font-black uppercase text-[10px]">Execution Detail</th>
                  <th className="table-header text-left font-black uppercase text-[10px]">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="table-cell">
                       <p className="text-[10px] text-slate-500 font-bold whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleDateString()}
                       </p>
                       <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </p>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px]">
                            {log.student?.name?.[0] || 'S'}
                        </div>
                        <div className="flex flex-col">
                          <p className="text-xs font-bold text-slate-900 tracking-tight">{log.student?.name || 'System Auto'}</p>
                          <p className="text-[9px] text-slate-400 font-mono font-bold">{log.student?.rollNumber || 'Node Service'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`badge text-[10px] py-1 px-3 ${
                        log.platform === 'LEETCODE' ? 'badge-yellow' :
                        log.platform === 'HACKERRANK' ? 'badge-green' : 'badge-blue'
                      }`}>
                        {log.platform}
                      </span>
                    </td>
                    <td className="table-cell"><Badge status={log.status} /></td>
                    <td className="table-cell">
                       <p className="text-[11px] text-slate-500 font-medium max-w-xs truncate" title={log.message}>
                          {log.message || 'Verification successful.'}
                       </p>
                    </td>
                    <td className="table-cell">
                      <span className="text-[11px] font-mono font-black text-slate-400">
                        {log.duration ? `${log.duration}ms` : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-4 py-2 text-xs font-bold disabled:opacity-30 transition-all shadow-sm">← PREV</button>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Page {page} of {pagination.pages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary px-4 py-2 text-xs font-bold disabled:opacity-30 transition-all shadow-sm">NEXT →</button>
        </div>
      )}
    </div>
  );
}
