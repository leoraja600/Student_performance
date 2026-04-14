import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import { StatCard, Spinner, EmptyState, Badge } from '../components/UI';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function GlobalAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await adminAPI.analytics();
      setData(res.data.data);
    } catch {
      toast.error('Failed to load global analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading) return <div className="flex items-center justify-center h-screen"><Spinner size={12} /></div>;
  if (!data) return <EmptyState message="No student data available for analysis. Perform a sync first!" />;

  const { averages, totals, topPerformers } = data;

  const barData = {
    labels: ['Easy', 'Medium', 'Hard'],
    datasets: [
      {
        label: 'LeetCode Distribution',
        data: [totals.easy, totals.medium, totals.hard],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderRadius: 8,
      },
    ],
  };

  const pieData = {
    labels: ['LeetCode Solves', 'HackerRank Solves'],
    datasets: [
      {
        data: [totals.leetcode, totals.hackerrank],
        backgroundColor: ['rgba(245, 158, 11, 0.1)', 'rgba(16, 185, 129, 0.1)'],
        borderColor: ['#f59e0b', '#10b981'],
        borderWidth: 2,
      },
    ],
  };

  const TopList = ({ title, students, colorClass }) => (
    <div className="card h-full bg-white shadow-sm overflow-hidden border-slate-100">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">{title}</h3>
      </div>
      <div className="divide-y divide-slate-50">
        {students.map((s, i) => (
          <div key={s.studentId} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${i < 3 ? 'bg-primary-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
              #{i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate tracking-tight">{s.name}</p>
              <p className="text-[10px] text-slate-400 font-mono font-bold uppercase">{s.rollNumber}</p>
            </div>
            <div className={`text-right ${colorClass} font-black text-sm font-mono`}>
              {title.includes('SCORE') ? s.combinedScore : (title.includes('LEETCODE') ? s.leetcodeTotalSolved : s.hackerrankTotalSolved)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 10, padding: 20, font: { size: 10, weight: 'bold' }, color: '#64748b' }
      }
    },
    scales: {
      y: { grid: { color: '#f1f5f9' }, ticks: { color: '#64748b', font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } }
    }
  };

  return (
    <div className="p-6 space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Institutional Analytics</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Cross-platform performance synthesis and cluster analysis</p>
      </div>

      {/* Quick Averages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Avg. Score" value={averages.combinedScore} subtitle="Global Normalized Mean" color="primary" />
        <StatCard title="LeetCode Impact" value={averages.leetcode} subtitle="Problems per Node" color="yellow" />
        <StatCard title="HackerRank Reach" value={averages.hackerrank} subtitle="Score per Node" color="green" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-8 bg-white">
          <h3 className="text-[11px] font-black text-slate-400 mb-8 flex items-center gap-2 uppercase tracking-widest">
            <span className="w-2.5 h-2.5 bg-primary-500 rounded-full shadow-lg border-2 border-white" />
            Complexity Distribution
          </h3>
          <div className="h-64">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>
        <div className="card p-8 bg-white">
          <h3 className="text-[11px] font-black text-slate-400 mb-8 flex items-center gap-2 uppercase tracking-widest">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-lg border-2 border-white" />
            Platform Contribution
          </h3>
          <div className="h-64 flex items-center justify-center p-4">
            <Pie data={pieData} options={{ ...chartOptions, scales: { x: { display: false }, y: { display: false } } }} />
          </div>
        </div>

        {/* Skill Gap Analysis Section */}
        {data.skillGaps && (
          <div className="card p-8 lg:col-span-2 bg-white">
            <h3 className="text-[11px] font-black text-slate-400 mb-8 flex items-center gap-3 uppercase tracking-widest">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-lg border-2 border-white" />
              Strategic Insight Engine
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Low Versatility (LC Only)', count: data.skillGaps.lcOnly, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                { label: 'Low Problem Depth (HR Only)', count: data.skillGaps.hrOnly, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                { label: 'Critical Ease Plateau', count: data.skillGaps.easyPlateau, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
                { label: 'High Velocity Nodes', count: data.skillGaps.balanced, color: 'text-primary-600', bg: 'bg-primary-50', border: 'border-primary-100' },
              ].map((gap, i) => (
                <div key={i} className={`p-5 rounded-[1.5rem] border ${gap.border} ${gap.bg} transition-transform hover:-translate-y-1 duration-300`}>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-2">{gap.label}</p>
                  <p className={`text-3xl font-black ${gap.color}`}>{gap.count}</p>
                  <div className="w-full bg-white/50 h-1 mt-4 rounded-full overflow-hidden">
                     <div className={`h-full ${gap.color.replace('text', 'bg')}`} style={{ width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
               <span className="text-2xl">⚡</span>
               <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Analysis indicating a large percentage of students in the <b>"Easy Plateau"</b>. Faculty intervention recommended to introduce higher complexity challenges in competitive programming modules.
               </p>
            </div>
          </div>
        )}
      </div>

      {/* Hall of Fame */}
      <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] pt-4">Global Elite Nominations</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TopList title="🎖️ OVERALL SCORE" students={topPerformers.byScore} colorClass="text-primary-600" />
        <TopList title="🔥 LEETCODE ELITE" students={topPerformers.byLeetcode} colorClass="text-amber-600" />
        <TopList title="🏆 HACKERRANK ELITE" students={topPerformers.byHackerRank} colorClass="text-emerald-600" />
      </div>
    </div>
  );
}
