import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { leaderboardAPI } from '../services/api';
import { RankBadge, EmptyState, Spinner, StatCard } from '../components/UI';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const POLICIES = [
  { id: 'SYSTEM', name: 'Global Standard', lcWeight: 50, hrWeight: 50 },
  { id: 'ALGO_FOCUS', name: 'LeetCode Elite (70/30)', lcWeight: 70, hrWeight: 30 },
  { id: 'VERSATILE', name: 'HackerRank Depth (30/70)', lcWeight: 30, hrWeight: 70 },
  { id: 'BALANCED', name: 'Balanced Progress (50/50)', lcWeight: 50, hrWeight: 50 },
];

function ScoreMini({ value, max = 100, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-slate-500 font-mono w-8">{value}</span>
    </div>
  );
}

export default function Leaderboard() {
  const { isFaculty, isAdmin } = useAuth();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('combinedScore');
  const [sortDir, setSortDir] = useState('desc');
  const [policyId, setPolicyId] = useState(() => localStorage.getItem('scoring_policy') || 'SYSTEM');

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leaderboardAPI.get({ 
        page, 
        limit: 20, 
        search,
        sortBy,
        sortDir 
      });
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, sortDir]);

  useEffect(() => {
    const timeout = setTimeout(fetchLeaderboard, 300);
    return () => clearTimeout(timeout);
  }, [fetchLeaderboard]);

  const handlePolicyChange = (id) => {
    setPolicyId(id);
    localStorage.setItem('scoring_policy', id);
    toast.success(`Perspective shifted: ${POLICIES.find(p => p.id === id).name}`);
  };

  const sortedData = useMemo(() => {
    const policy = POLICIES.find(p => p.id === policyId);

    let result;
    if (!policy || policyId === 'SYSTEM') {
      result = data;
    } else {
      // Local perspective recalculation
      result = [...data].map(s => {
        const lcComponent = Math.min(s.leetcodeTotalSolved / 2000, 1) * policy.lcWeight;
        const hrComponent = Math.min(s.hackerrankTotalSolved / 500, 1) * policy.hrWeight;
        return { ...s, combinedScore: parseFloat((lcComponent + hrComponent).toFixed(2)) };
      }).sort((a, b) => b.combinedScore - a.combinedScore);
    }

    // Always reassign ranks to match current display order
    const pageOffset = (page - 1) * 20;
    return result.map((entry, index) => ({ ...entry, rank: pageOffset + index + 1 }));
  }, [data, policyId, page]);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const SortBtn = ({ col, label }) => (
    <button
      onClick={() => toggleSort(col)}
      className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
        sortBy === col ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      {label}
      {sortBy === col && <span className="ml-1 text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>}
    </button>
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
             🏆 Leaderboard
             {policyId !== 'SYSTEM' && (
                <span className="text-[10px] bg-primary-50 text-primary-600 px-3 py-1 rounded-full border border-primary-100 uppercase font-black tracking-tighter">
                  Perspective: {POLICIES.find(p => p.id === policyId)?.name}
                </span>
              )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {pagination.total} students ranked by {policyId === 'SYSTEM' ? 'system score' : 'custom perspective'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
            {(isFaculty || isAdmin) && (
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Focus</span>
                <select 
                  value={policyId} 
                  onChange={(e) => handlePolicyChange(e.target.value)}
                  className="bg-transparent text-[10px] font-black text-slate-700 outline-none cursor-pointer uppercase"
                >
                  {POLICIES.map(p => <option key={p.id} value={p.id}>{p.name.split(' (')[0]}</option>)}
                </select>
              </div>
            )}
            <input
              type="text"
              className="input-field w-full sm:w-64 shadow-sm"
              placeholder="Search by name or roll no..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size={8} />
          </div>
        ) : sortedData.length === 0 ? (
          <EmptyState message={search ? 'No students match your search' : 'No leaderboard data yet. Add students and refresh data.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="table-header text-left">Rank</th>
                  <th className="table-header text-left"><SortBtn col="name" label="Name" /></th>
                  <th className="table-header text-left">Roll No.</th>
                  <th className="table-header text-left"><SortBtn col="leetcodeTotalSolved" label="LeetCode" /></th>
                  <th className="table-header text-left"><SortBtn col="weeklyLeetcodeProgress" label="This Week" /></th>
                  <th className="table-header text-left"><SortBtn col="hackerrankTotalSolved" label="HackerRank" /></th>
                  <th className="table-header text-left"><SortBtn col="hackathonScore" label="Hackathons" /></th>
                  <th className="table-header text-left">Contest Rating</th>
                  <th className="table-header text-left"><SortBtn col="combinedScore" label="Score" /></th>
                  <th className="table-header text-center">Compare</th>
                  <th className="table-header text-left text-right px-4">Updated</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((entry) => {
                  const rank = entry.rank;
                  const isTop3 = rank <= 3;
                  const weekProgress = entry.weeklyLeetcodeProgress || 0;
                  
                  return (
                    <tr
                      key={entry.studentId}
                      className={`border-b border-slate-50 hover:bg-slate-50/80 transition-colors ${
                        isTop3 ? 'bg-primary-50/30' : ''
                      }`}
                    >
                      <td className="table-cell">
                        <RankBadge rank={rank} />
                      </td>
                      <td className="table-cell font-semibold">
                        <Link to={`/dashboard/${entry.studentId}`} className="text-primary-600 hover:text-primary-700 hover:underline">
                          {entry.name}
                        </Link>
                      </td>
                      <td className="table-cell">
                        <span className="font-mono text-xs text-slate-400">{entry.rollNumber}</span>
                      </td>
                      <td className="table-cell">
                        <ScoreMini value={entry.leetcodeTotalSolved} max={300} color="#f59e0b" />
                      </td>
                      <td className="table-cell">
                         <div className="flex items-center gap-2">
                           <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${weekProgress > 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                             +{weekProgress}
                           </span>
                         </div>
                      </td>
                      <td className="table-cell">
                        <ScoreMini value={entry.hackerrankTotalSolved} max={500} color="#34d399" />
                      </td>
                      <td className="table-cell text-center">
                        <span className="text-xs font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                          {entry.hackathonScore || 0}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="font-mono text-sm text-purple-400">
                          {entry.leetcodeContestRating ? Math.round(entry.leetcodeContestRating) : '—'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0 max-w-[60px]">
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${entry.combinedScore}%`,
                                  background: 'linear-gradient(to right, #5a6af8, #34d399)',
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-bold text-slate-900">{entry.combinedScore}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex justify-center">
                          <Link
                            to={`/compare?b=${entry.rollNumber}`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-primary-50 hover:text-primary-600 transition-all border border-slate-100 hover:border-primary-100"
                            title="Compare"
                          >
                            ⚔️
                          </Link>
                        </div>
                      </td>
                      <td className="table-cell text-[10px] text-gray-400 text-right px-4 font-bold uppercase">
                        {entry.lastUpdated
                          ? new Date(entry.lastUpdated).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary px-3 py-2 text-sm disabled:opacity-30"
          >←</button>
          {[...Array(pagination.pages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                page === i + 1
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="btn-secondary px-3 py-2 text-sm disabled:opacity-30"
          >→</button>
        </div>
      )}
    </div>
  );
}
