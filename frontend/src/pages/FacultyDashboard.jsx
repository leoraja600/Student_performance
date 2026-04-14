import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import { StatCard, Spinner, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function FacultyDashboard() {
  const [data, setData] = useState(null);
  const [trends, setTrends] = useState(null);
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [aRes, tRes, iRes] = await Promise.all([
        adminAPI.analytics(),
        adminAPI.trends(),
        adminAPI.interventions()
      ]);
      setData(aRes.data.data);
      setTrends(tRes.data.data);
      setInterventions(iRes.data.data);
    } catch {
      toast.error('Failed to load oversight data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="flex items-center justify-center h-screen"><Spinner size={12} /></div>;
  if (!data) return <EmptyState message="No data for academic oversight." />;

  const { averages, skillGaps, topPerformers, eliteCount, jobReadyCount } = data;

  const exportAdvancedCSV = () => {
    const headers = ['Name', 'Roll Number', 'LC Solved', 'HR Solved', 'Combined Score', 'Elite Status', 'Progress Trend'];
    const rows = topPerformers.byScore.map(s => {
      const isElite = s.leetcodeHardSolved > 50 ? 'Elite' : 'Stable';
      const isAtRisk = interventions.some(i => i.id === s.id) ? 'DECLINING' : 'NORMAL';
      return [s.name, s.rollNumber, s.leetcodeTotalSolved, s.hackerrankTotalSolved, s.combinedScore, isElite, isAtRisk];
    });
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `academic_master_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const trendChartData = {
    labels: Object.keys(trends || {}).slice(0, 8),
    datasets: [{
      label: 'Class Solves',
      data: Object.values(trends || {}).map(t => t.solved).slice(0, 8),
      backgroundColor: 'rgba(90, 106, 248, 0.5)',
      borderColor: '#5a6af8',
      borderWidth: 1,
    }]
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Academic Oversight Portal</h1>
          <p className="text-sm text-slate-500 mt-1">Class monitoring & intervention management</p>
        </div>
        <button onClick={exportAdvancedCSV} className="btn-primary flex items-center gap-2 text-sm">
           <span>📄</span> Download Accreditation Report
        </button>
      </div>

      {/* Class Success Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Avg Class Score" value={averages.combinedScore} color="primary" />
        <StatCard title="Elite Candidates" value={eliteCount} color="purple" icon="💎" />
        <StatCard title="Job Ready Status" value={jobReadyCount} color="green" icon="💼" />
        <StatCard title="Priority Interventions" value={interventions.length} color="red" icon="🚩" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Intervention Bucket */}
         <div className="card border-t-4 border-red-500 overflow-hidden bg-white">
            <div className="p-4 bg-red-50 border-b border-slate-100">
               <h2 className="text-xs font-black text-red-600 uppercase tracking-widest">Intervention Required (Score Declining)</h2>
            </div>
            <div className="divide-y divide-slate-50">
               {interventions.length > 0 ? interventions.map((s, i) => (
                 <div key={i} className="p-4 flex justify-between items-center group hover:bg-red-50/30 transition-colors">
                   <div>
                     <p className="text-sm font-bold text-slate-900 group-hover:text-red-700">{s.name}</p>
                     <p className="text-[10px] text-slate-400 font-mono">{s.rollNumber}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-xs font-mono text-red-600 font-bold">-{s.declineRate} pts</p>
                     <p className="text-[10px] text-slate-400 italic">3-Week Consecutive Drop</p>
                   </div>
                 </div>
               )) : <div className="p-8 text-center text-xs text-slate-400 italic font-mono">No students currently flagged for decline.</div>}
            </div>
         </div>

         {/* Topic Trends Heatmap */}
         <div className="card p-6 bg-white">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold text-slate-900">Class-wide Technical Strengths</h2>
              <span className="text-[10px] bg-primary-50 text-primary-600 px-2 py-0.5 rounded border border-primary-100 uppercase font-black">Topic Coverage</span>
            </div>
            <div className="h-64">
               <Bar 
                 data={trendChartData} 
                 options={{ 
                   responsive: true, 
                   maintainAspectRatio: false,
                   plugins: { legend: { display: false } },
                   scales: { 
                     x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { display: false } },
                     y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#f1f5f9' } }
                   }
                }} 
               />
            </div>
            <div className="mt-4 p-3 bg-primary-50 rounded border border-primary-100">
               <p className="text-xs text-primary-700">💡 <b>Faculty Insight:</b> Data shows high proficiency in Arrays/Strings. Recommend introducing DP or Graphs in the next lecture series.</p>
            </div>
         </div>
      </div>

      {/* Elite Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card overflow-hidden bg-white border-t-4 border-purple-500">
          <div className="p-4 bg-purple-50 border-b border-slate-100">
            <h2 className="text-xs font-black text-purple-700 uppercase tracking-widest">Elite Candidate Nominations</h2>
          </div>
          <div className="grid grid-cols-1 divide-y divide-slate-50">
            {topPerformers.byScore.filter(s => s.leetcodeHardSolved > 10).slice(0, 5).map((s, i) => (
              <div key={i} className="p-4 flex items-center justify-between group hover:bg-purple-50/20 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-300">#{i+1}</span>
                  <div>
                    <p className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">{s.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{s.rollNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs font-black text-purple-600 font-mono">{s.leetcodeHardSolved} Hard</p>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Competitive Ready</p>
                  </div>
                  <span className="text-lg">🏅</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Gainers section */}
        <div className="card overflow-hidden bg-white border-t-4 border-emerald-500">
           <div className="p-4 bg-emerald-50 border-b border-slate-100">
              <h2 className="text-xs font-black text-emerald-700 uppercase tracking-widest">Top Gainers (This Week)</h2>
           </div>
           <div className="grid grid-cols-1 divide-y divide-slate-50">
              {topPerformers.byImprovement?.map((s, i) => (
                <div key={i} className="p-4 flex items-center justify-between group hover:bg-emerald-50/20 transition-colors">
                   <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-300">+{i+1}</span>
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{s.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{s.rollNumber}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-black text-emerald-600 font-mono">+{s.improvement}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-bold">Points Improved</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Peer Trajectory Comparison (Concept) */}
        <div className="card p-6 flex flex-col justify-center items-center text-center space-y-4 bg-white">
           <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-2xl shadow-inner">⚖️</div>
           <div>
             <h3 className="text-sm font-bold text-slate-900">Side-by-Side Trajectory View</h3>
             <p className="text-[10px] text-slate-500 mt-2 max-w-xs font-medium">Select any two students to compare their learning velocity and patterns. Useful for identifying peer-learning pairs.</p>
           </div>
           <button className="btn-secondary text-[9px] uppercase font-black tracking-widest px-8 py-2.5">Open Comparison Tool</button>
        </div>
      </div>
    </div>
  );
}
