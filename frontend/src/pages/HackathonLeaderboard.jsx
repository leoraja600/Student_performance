import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { leaderboardAPI } from '../services/api';
import { RankBadge, EmptyState, Spinner } from '../components/UI';
import toast from 'react-hot-toast';

export default function HackathonLeaderboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fetchHackathonLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      // Sort specifically by hackathonScore
      const res = await leaderboardAPI.get({ 
        page, 
        limit: 20, 
        search,
        sortBy: 'hackathonScore',
        sortDir: 'desc',
        onlyHackathons: 'true'
      });
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load hackathon rankings');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timeout = setTimeout(fetchHackathonLeaderboard, 300);
    return () => clearTimeout(timeout);
  }, [fetchHackathonLeaderboard]);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
             🚀 Event Champions
             <span className="text-[10px] bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100 uppercase font-black tracking-tighter">
               Hackathon Leaderboard
             </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Top performers based on verified hackathon points and positions.
          </p>
        </div>
        
        <input
          type="text"
          className="input-field w-full sm:w-64 shadow-sm"
          placeholder="Search by student name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Grid for Top 3 */}
      {!loading && data.length > 0 && page === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 0, 2].map((idx) => {
            const entry = data[idx];
            if (!entry) return null;
            const colors = [
              'from-yellow-400 to-orange-500', // 1st
              'from-slate-300 to-slate-400',   // 2nd
              'from-amber-600 to-amber-700'    // 3rd
            ];
            const rankLabel = idx === 0 ? 'GOLD' : idx === 1 ? 'SILVER' : 'BRONZE';
            return (
              <div key={entry.studentId} className={`card p-6 relative overflow-hidden group ${idx === 0 ? 'md:-translate-y-4 ring-2 ring-yellow-400 shadow-xl' : ''}`}>
                 <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${colors[idx]} opacity-10 rounded-bl-full`}></div>
                 <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${colors[idx]} flex items-center justify-center text-white text-xl font-black shadow-lg`}>
                        {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 truncate max-w-full">{entry.name}</h3>
                      <p className="text-xs text-slate-400 font-mono">{entry.rollNumber}</p>
                    </div>
                    <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Points</p>
                       <p className="text-2xl font-black text-slate-900">{entry.hackathonScore}</p>
                    </div>
                    <Link to={`/dashboard/${entry.studentId}`} className="text-[10px] font-black text-primary-600 hover:underline uppercase">View Profile →</Link>
                 </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Spinner size={8} /></div>
        ) : data.length === 0 ? (
          <EmptyState message="No hackathon records found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="table-header text-left">Rank</th>
                  <th className="table-header text-left">Elite Node</th>
                  <th className="table-header text-left">Points</th>
                  <th className="table-header text-left">Submissions</th>
                  <th className="table-header text-left">LeetCode</th>
                  <th className="table-header text-left">HackerRank</th>
                  <th className="table-header text-right px-6">Combined Score</th>
                </tr>
              </thead>
              <tbody>
                {data.map((entry) => (
                  <tr key={entry.studentId} className="hover:bg-slate-50/50 border-b border-slate-50 transition-colors">
                    <td className="table-cell"><RankBadge rank={entry.rank} /></td>
                    <td className="table-cell">
                      <div className="flex flex-col">
                        <Link to={`/dashboard/${entry.studentId}`} className="font-bold text-slate-900 hover:text-primary-600">
                          {entry.name}
                        </Link>
                        <span className="text-[10px] text-slate-400 font-mono">{entry.rollNumber}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                       <span className="text-xl font-black text-slate-900">
                         {entry.hackathonScore}
                       </span>
                    </td>
                    <td className="table-cell font-bold text-slate-500">
                       {entry.hackathonCount}
                    </td>
                    <td className="table-cell text-xs text-slate-500 font-mono">{entry.leetcodeTotalSolved}</td>
                    <td className="table-cell text-xs text-slate-500 font-mono">{entry.hackerrankTotalSolved}</td>
                    <td className="table-cell text-right px-6">
                       <span className="text-sm font-black text-slate-900">{entry.combinedScore}</span>
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
        <div className="flex items-center justify-center gap-2">
           <button onClick={() => setPage(p => Math.max(1, p - 1))} className="btn-secondary px-3 py-1 text-xs font-bold">PREV</button>
           <span className="text-xs font-black text-slate-400">PAGE {page} OF {pagination.pages}</span>
           <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} className="btn-secondary px-3 py-1 text-xs font-bold">NEXT</button>
        </div>
      )}
    </div>
  );
}
