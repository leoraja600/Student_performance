import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentsAPI, hackathonAPI } from '../services/api';
import { StatCard, ScoreBar, Spinner, SkeletonCard, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';
import { Line, Bar, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  RadialLinearScale, Title, Tooltip, Legend, Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, RadialLinearScale, Title, Tooltip, Legend, Filler);

function HistoryChart({ history }) {
  if (!history || history.length < 2) return <div className="h-40 flex items-center justify-center text-gray-500 text-xs italic">Sync more data to see history.</div>;
  const labels = history.map((h) => new Date(h.fetchedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
  const data = {
    labels,
    datasets: [
      {
        label: 'Combined Score',
        data: history.map((h) => h.combinedScore),
        borderColor: '#5a6af8',
        backgroundColor: 'rgba(90, 106, 248, 0.05)',
        fill: true,
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 2,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: '#f1f5f9' }, ticks: { color: '#64748b', font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } },
    }
  };
  return (
    <div className="h-64">
      <Line data={data} options={options} />
    </div>
  );
}

function SkillRadarChart({ latest }) {
  if (!latest) return null;
  let topics = [];
  try { topics = latest.topTopics ? JSON.parse(latest.topTopics) : []; } catch { topics = []; }
  
  // Aggregate common topics for radar
  const categories = ['Arrays', 'Strings', 'DP', 'Graphs', 'Trees', 'Math'];
  const dataMap = categories.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {});
  
  topics.forEach(t => {
    if (t.name.includes('Array')) dataMap['Arrays'] += 1;
    if (t.name.includes('String')) dataMap['Strings'] += 1;
    if (t.name.includes('Dynamic')) dataMap['DP'] += 1;
    if (t.name.includes('Graph')) dataMap['Graphs'] += 1;
    if (t.name.includes('Tree')) dataMap['Trees'] += 1;
    if (t.name.includes('Math')) dataMap['Math'] += 1;
  });

  const data = {
    labels: categories,
    datasets: [
      {
        label: 'Skill Strength',
        data: categories.map(cat => Math.min(dataMap[cat] * 20, 100)), // Scale for visualization
        backgroundColor: 'rgba(90, 106, 248, 0.2)',
        borderColor: '#5a6af8',
        borderWidth: 2,
        pointBackgroundColor: '#5a6af8',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: '#e2e8f0' },
        grid: { color: '#e2e8f0' },
        pointLabels: { color: '#64748b', font: { size: 10, weight: 'bold' } },
        ticks: { display: false },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
    plugins: { legend: { display: false } },
  };

  return (
    <div className="h-64">
      <h3 className="text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-widest text-center">Topic Proficiency Radar</h3>
      <Radar data={data} options={options} />
    </div>
  );
}

function GhostModeChart({ benchmarks }) {
  if (!benchmarks) return null;
  const data = {
    labels: ['LeetCode', 'HackerRank', 'Score'],
    datasets: [
      {
        label: 'Me',
        data: [benchmarks.user.leetcode, benchmarks.user.hackerrank, benchmarks.user.score],
        backgroundColor: '#5a6af8',
        borderRadius: 4,
      },
      {
        label: 'Class Avg',
        data: [benchmarks.average.leetcode, benchmarks.average.hackerrank, benchmarks.average.score],
        backgroundColor: '#e2e8f0',
        borderRadius: 4,
      },
    ],
  };
  return (
    <div className="h-64">
      <h3 className="text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-widest">Ghost Mode: Me vs Class Average</h3>
      <Bar 
        data={data} 
        options={{ 
          responsive: true, 
          maintainAspectRatio: false, 
          scales: { 
            y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { color: '#64748b', font: { size: 10 } } }, 
            x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } } 
          },
          plugins: { legend: { position: 'bottom', labels: { color: '#64748b', boxWidth: 12, padding: 20, font: { size: 10 } } } }
        }} 
      />
    </div>
  );
}


function PlacementReadiness({ latest }) {
  if (!latest) return null;
  const score = latest.combinedScore;
  let status = 'Needs Improvement';
  let color = 'text-red-500';
  let bg = 'bg-red-50';
  let border = 'border-red-100';
  let percentage = score;

  if (score > 85) {
    status = 'TIER 1 READY';
    color = 'text-emerald-600';
    bg = 'bg-emerald-50';
    border = 'border-emerald-100';
  } else if (score > 65) {
    status = 'TIER 2 READY';
    color = 'text-blue-600';
    bg = 'bg-blue-50';
    border = 'border-blue-100';
  } else if (score > 50) {
    status = 'JOB READY';
    color = 'text-indigo-600';
    bg = 'bg-indigo-50';
    border = 'border-indigo-100';
  }

  return (
    <div className={`card p-6 border-2 ${border} ${bg} relative overflow-hidden group`}>
      <div className="flex justify-between items-center relative z-10">
        <div>
           <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Career Trajectory</h4>
           <h2 className={`text-xl font-black ${color} mt-1`}>{status}</h2>
           <p className="text-[10px] text-slate-500 mt-2 max-w-[140px] font-medium leading-relaxed">Based on your LeetCode consistency and HackerRank versatility.</p>
        </div>
        <div className="flex flex-col items-center">
           <div className="w-16 h-16 rounded-full border-4 border-white shadow-sm flex items-center justify-center bg-white">
              <span className={`text-lg font-black ${color}`}>{Math.round(percentage)}%</span>
           </div>
           <span className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">Readiness Index</span>
        </div>
      </div>
      <div className="absolute -bottom-1 -right-1 text-6xl opacity-5 group-hover:scale-110 transition-transform grayscale">🚀</div>
    </div>
  );
}


const STATUS_STYLES = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_ICONS = {
  PENDING: '⏳',
  VERIFIED: '✅',
  REJECTED: '❌',
};

const POSITION_OPTIONS = [
  { value: 'WINNER', label: '🥇 Winner', points: 10 },
  { value: 'RUNNER_UP', label: '🥈 Runner Up', points: 7 },
  { value: 'TOP_5', label: '🏅 Top 5', points: 5 },
  { value: 'PARTICIPANT', label: '👤 Participant', points: 3 },
];

function ProofViewer({ url, onClose }) {
  if (!url) return null;
  const isPdf = url.endsWith('.pdf');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl max-h-[85vh] w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-700">Proof Document</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500">&times;</button>
        </div>
        <div className="p-4 flex items-center justify-center bg-slate-50 min-h-[400px]">
          {isPdf ? (
            <iframe src={url} className="w-full h-[70vh] rounded-lg" title="Proof PDF" />
          ) : (
            <img src={url} alt="Proof" className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, isAdmin, isFaculty } = useAuth();
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [history, setHistory] = useState([]);
  const [achievements, setAchievements] = useState(null);
  const [hackathonStats, setHackathonStats] = useState(null);
  const [hackathonsList, setHackathonsList] = useState([]);
  const [viewProof, setViewProof] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const studentId = id || user?.studentId;

  const fetchData = useCallback(async () => {
    if (!studentId) return;
    try {
      const sRes = await studentsAPI.get(studentId);
      setStudent(sRes.data.data);

      // Attempt to load auxiliary data in parallel but handle gracefully
      const [hRes, aRes] = await Promise.allSettled([
        studentsAPI.history(studentId, { limit: 30 }),
        studentsAPI.achievements(studentId),
      ]);

      if (hRes.status === 'fulfilled') setHistory(hRes.value.data.data || []);
      if (aRes.status === 'fulfilled') setAchievements(aRes.value.data.data);
      
      // Fetch hackathon stats and list
      if (!id || id === user?.studentId) {
        try {
          const hkRes = await hackathonAPI.getMyHackathons();
          if (hkRes?.data?.data) {
            setHackathonStats(hkRes.data.data.stats);
            setHackathonsList(hkRes.data.data.hackathons || []);
          }
        } catch (e) { console.warn("Hackathon fetch failed", e); }
      } else if (isAdmin || isFaculty) {
        try {
          const hkRes = await hackathonAPI.getStudentHackathons(studentId);
          if (hkRes?.data?.data) {
            setHackathonStats(hkRes.data.data.stats);
            setHackathonsList(hkRes.data.data.hackathons || []);
          }
        } catch (e) { console.warn("Hackathon fetch failed", e); }
      }
    } catch (err) {
      console.error("Dashboard core load failed:", err);
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Failed to load profile';
      toast.error(`${msg} (${status || 'Network Error'})`);
    } finally {
      setLoading(false);
    }
  }, [studentId, id, user?.studentId, isAdmin, isFaculty]);

  const handleDeleteHackathon = async (hackathonId) => {
    if (!confirm('Are you sure you want to permanently delete this hackathon submission?')) return;
    try {
      await hackathonAPI.delete(hackathonId);
      toast.success('Hackathon submission deleted successfully');
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete hackathon');
    }
  };

  useEffect(() => {
    if (studentId) fetchData();
    else setLoading(false);
  }, [fetchData, studentId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await studentsAPI.refresh(studentId);
      toast.success('Refreshed!');
      await fetchData();
    } catch (err) { toast.error('Refresh failing'); }
    finally { setRefreshing(false); }
  };

  const latest = student?.snapshots?.[0];

  if (loading) return <div className="p-6 h-screen flex items-center justify-center bg-white"><Spinner size={12}/></div>;
  if (!studentId && (isAdmin || isFaculty)) return <Navigate to="/admin" replace />;
  if (!studentId) return <div className="p-20 text-slate-400 text-center font-bold bg-white h-screen">Student session not identified. Please select a profile from the leaderboard.</div>;

  return (
    <div className="p-6 space-y-6 animate-fade-in relative">
      {/* Job Ready Badge Floating */}
      {latest?.combinedScore > 50 && (
        <div className="absolute top-6 right-6 z-10 animate-bounce">
          <div className="bg-yellow-500 text-black text-[10px] font-black px-3 py-1 rounded-full shadow-lg border-2 border-white flex items-center gap-1">
             <span>💼</span> JOB READY
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-2xl font-bold shadow-sm">
            {student?.name?.[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              {student?.name}
              {achievements?.streak > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 bg-orange-50 border border-orange-200 rounded-lg text-orange-600 text-[10px] font-black uppercase tracking-tighter">
                   🔥 {achievements.streak} DAY STREAK
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-500 font-mono">{student?.rollNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={handleRefresh} disabled={refreshing} className="btn-secondary text-xs py-2">
              Sync Profile
           </button>
           <button className="btn-primary text-xs py-2">
              Share Report
           </button>
        </div>
      </div>

      {achievements?.badges?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {achievements.badges.map(b => (
            <div key={b.id} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl group transition-all hover:bg-slate-50 shadow-sm">
               <span className="text-xl">{b.icon}</span>
               <div className="flex flex-col">
                 <span className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">{b.name}</span>
                 <span className="text-[8px] text-slate-400 font-bold">{b.desc}</span>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Core Stats */}
      {latest ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Overall Score" value={latest.combinedScore} subtitle="Normalized Performance" color="primary" />
            <StatCard title="LeetCode" value={latest.leetcodeTotalSolved} subtitle={`${latest.leetcodeHardSolved} Hard Solved`} color="yellow" />
            <StatCard title="HackerRank" value={latest.hackerrankScore} subtitle="Platform Score" color="green" />
            <StatCard title="Hackathons" value={hackathonStats?.verified || student?.hackathonCount || 0} subtitle={`${hackathonStats?.totalScore || latest.hackathonScore || 0} pts earned`} color="purple" />
          </div>

          {/* Hackathon Quick Summary */}
          {hackathonStats && (
            <div className="card p-5 border-l-4 border-violet-500 bg-gradient-to-r from-violet-50/50 to-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Hackathon Portfolio</h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {hackathonStats.verified} verified · {hackathonStats.pending} pending review · {hackathonStats.totalScore} total points
                    </p>
                  </div>
                </div>
                {(!id || id === user?.studentId) ? (
                  <Link
                    to="/hackathons"
                    className="px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-700 transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <span>+</span> Add / View All
                  </Link>
                ) : (isAdmin || isFaculty) ? (
                  <Link
                    to="/admin/hackathons"
                    className="px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-700 transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    Review All Submissions
                  </Link>
                ) : null}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="space-y-6 lg:col-span-1">
               <PlacementReadiness latest={latest} />
               <div className="card p-6 h-full bg-white relative group overflow-hidden">
                 <div className="relative z-10">
                    <SkillRadarChart latest={latest} />
                 </div>
                 <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[8px] bg-slate-900 text-white px-2 py-1 rounded-full font-black uppercase tracking-tighter">Insight Engine</span>
                 </div>
               </div>
             </div>
             <div className="lg:col-span-2 space-y-6">
                <div className="card p-8 bg-white relative">
                  <GhostModeChart benchmarks={achievements?.benchmarks} />
                  <div className="absolute bottom-4 right-4">
                     <button 
                        onClick={() => window.location.href = `/compare?a=${student.rollNumber}`}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-[10px] font-black rounded-xl hover:bg-black transition-all shadow-lg active:scale-95"
                     >
                        <span>⚔️</span> CHALLENGE PEER
                     </button>
                  </div>
                </div>
             </div>
          </div>

          <div className="card p-6 bg-white border-slate-100">
             <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase">Performance History</h2>
                  <p className="text-[10px] text-slate-400">Activity from last 30 snapshots</p>
                </div>
                <div className="flex gap-2">
                   <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-primary-500"></span> Score
                   </div>
                </div>
             </div>
             <HistoryChart history={history} />
          </div>

          {/* Detailed Hackathons list for students details registration */}
          {hackathonsList.length > 0 && (
            <div className="card p-6 bg-white border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    🏆 Hackathon Registration & Submissions
                  </h2>
                  <p className="text-[10px] text-slate-400">Detailed overview of participations and awards for this student</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="table-header text-left">Event Details</th>
                      <th className="table-header text-left">Organizer</th>
                      <th className="table-header text-left">Position</th>
                      <th className="table-header text-left">Date</th>
                      <th className="table-header text-left">Status</th>
                      <th className="table-header text-left">Points</th>
                      <th className="table-header text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {hackathonsList.map((h) => {
                      const posInfo = POSITION_OPTIONS.find(p => p.value === h.position) || { label: h.position, points: 3 };
                      const canDelete = isAdmin || isFaculty || (h.status !== 'VERIFIED' && (!id || id === user?.studentId));
                      return (
                        <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="table-cell">
                            <div>
                              <p className="font-bold text-slate-900">{h.eventName}</p>
                              {h.description && <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{h.description}</p>}
                            </div>
                          </td>
                          <td className="table-cell text-xs text-slate-500 font-medium">{h.organizer || '—'}</td>
                          <td className="table-cell text-xs font-semibold text-slate-700">{posInfo.label}</td>
                          <td className="table-cell text-xs text-slate-500 font-mono">
                            {new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="table-cell">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${STATUS_STYLES[h.status]}`}>
                              {STATUS_ICONS[h.status]} {h.status}
                            </span>
                          </td>
                          <td className="table-cell">
                            <span className={`text-xs font-bold ${h.status === 'VERIFIED' ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {h.status === 'VERIFIED' ? `+${posInfo.points} pts` : '—'}
                            </span>
                          </td>
                          <td className="table-cell text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {h.proofUrl && (
                                <button
                                  onClick={() => setViewProof(h.proofUrl)}
                                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                                  title="View Proof"
                                >
                                  👁
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteHackathon(h.id)}
                                  className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors"
                                  title="Delete Registration"
                                >
                                  🗑
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState message="Sync your profiles to see data." />
      )}
      {viewProof && <ProofViewer url={viewProof} onClose={() => setViewProof(null)} />}
    </div>
  );
}
