import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { studentsAPI, leaderboardAPI } from '../services/api';
import { Spinner } from '../components/UI';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

function StatBar({ label, valueA, valueB, maxVal, colorA = '#5a6af8', colorB = '#34d399' }) {
  const pctA = Math.min((valueA / (maxVal || 1)) * 100, 100);
  const pctB = Math.min((valueB / (maxVal || 1)) * 100, 100);
  const winner = valueA > valueB ? 'A' : valueB > valueA ? 'B' : 'tie';
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
        <span>{label}</span>
        {winner !== 'tie' && (
          <span className="text-[10px] text-emerald-500 font-black">
            {winner === 'A' ? '← WINS' : 'WINS →'}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className={`w-12 text-right text-sm font-black ${winner === 'A' ? 'text-indigo-600' : 'text-slate-400'}`}>{valueA}</span>
        <div className="flex-1 flex h-3 bg-slate-100 rounded-full overflow-hidden gap-0.5">
          <div className="flex-1 flex justify-end">
            <div className="h-full rounded-l-full transition-all duration-700" style={{ width: `${pctA}%`, background: colorA }} />
          </div>
          <div className="w-px bg-slate-300" />
          <div className="flex-1">
            <div className="h-full rounded-r-full transition-all duration-700" style={{ width: `${pctB}%`, background: colorB }} />
          </div>
        </div>
        <span className={`w-12 text-sm font-black ${winner === 'B' ? 'text-emerald-600' : 'text-slate-400'}`}>{valueB}</span>
      </div>
    </div>
  );
}

function ScoreCircle({ score, label, color }) {
  const pct = Math.min(score, 100);
  const r = 40, cx = 50, cy = 50;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={110} height={110} viewBox="0 0 100 100">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={10} />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={10}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fontSize="18" fontWeight="900" fill="#1e293b">
          {score.toFixed(1)}
        </text>
      </svg>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
    </div>
  );
}

function StudentPicker({ label, onSelect, color }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q) => {
    if (!q || q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await leaderboardAPI.get({ search: q, limit: 8, page: 1 });
      setResults(res.data.data || []);
    } catch {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    const timeout = setTimeout(() => search(q), 300);
    return () => clearTimeout(timeout);
  };

  const pick = (entry) => {
    onSelect(entry);
    setQuery(entry.name);
    setResults([]);
  };

  return (
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      <div className="relative">
        <input
          type="text"
          className="w-full bg-white border-2 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 placeholder-slate-300 focus:outline-none transition-all"
          style={{ borderColor: color + '60', focusBorderColor: color }}
          placeholder="Search by name or roll no..."
          value={query}
          onChange={handleChange}
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2"><Spinner size={4} /></div>
        )}
        {results.length > 0 && (
          <div className="absolute z-20 top-full mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
            {results.map(r => (
              <button
                key={r.studentId}
                onClick={() => pick(r)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b last:border-0 border-slate-50"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black"
                  style={{ background: color }}>
                  {r.name[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{r.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{r.rollNumber}</p>
                </div>
                <div className="ml-auto text-xs font-black" style={{ color }}>
                  #{r.rank}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Compare() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [studentA, setStudentA] = useState(null);
  const [studentB, setStudentB] = useState(null);
  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);
  const [loading, setLoading] = useState(false);

  // Helper to fetch student by ID and set it as A or B
  const selectById = useCallback(async (id, setStudent, setData) => {
    try {
      const res = await leaderboardAPI.get({ search: id, limit: 1 });
      if (res.data.data && res.data.data.length > 0) {
        const entry = res.data.data[0];
        setStudent(entry);
        
        // Fetch full profile, history, and achievements
        const [resDetail, resHistory, resAchieve] = await Promise.all([
          studentsAPI.get(entry.studentId),
          studentsAPI.history(entry.studentId, { limit: 10 }),
          studentsAPI.achievements(entry.studentId)
        ]);
        
        const snap = resDetail.data.data.snapshots?.[0] || {};
        setData({ 
          ...resDetail.data.data, 
          snap,
          history: resHistory.data.data,
          achievements: resAchieve.data.data 
        });
      }
    } catch (err) {
      console.error("Failed to fetch student by ID:", err);
      toast.error(`Access denied or student not found: ${id}`);
    }
  }, []);

  // Initial load logic
  React.useEffect(() => {
    const init = async () => {
      setLoading(true);
      
      const idA = searchParams.get('a');
      const idB = searchParams.get('b');

      if (idA) {
        await selectById(idA, setStudentA, setDataA);
      } else if (user?.role === 'STUDENT' && user?.student) {
        await selectById(user.student.rollNumber, setStudentA, setDataA);
      }

      if (idB) {
        await selectById(idB, setStudentB, setDataB);
      }
      
      setLoading(false);
    };
    init();
  }, [user, searchParams, selectById]);

  const fetchStudent = async (entry) => {
    const [resDetail, resHistory, resAchieve] = await Promise.all([
      studentsAPI.get(entry.studentId),
      studentsAPI.history(entry.studentId, { limit: 10 }),
      studentsAPI.achievements(entry.studentId)
    ]);
    const snap = resDetail.data.data.snapshots?.[0] || {};
    return { 
      ...resDetail.data.data, 
      snap,
      history: resHistory.data.data,
      achievements: resAchieve.data.data 
    };
  };

  const handleSelectA = async (entry) => {
    setStudentA(entry);
    try {
      const d = await fetchStudent(entry);
      setDataA(d);
    } catch { toast.error('Failed to load student A'); }
  };

  const handleSelectB = async (entry) => {
    setStudentB(entry);
    try {
      const d = await fetchStudent(entry);
      setDataB(d);
    } catch { toast.error('Failed to load student B'); }
  };

  const isReady = dataA && dataB;
  const snapA = dataA?.snap || {};
  const snapB = dataB?.snap || {};

  const maxLC = Math.max(snapA.leetcodeTotalSolved || 0, snapB.leetcodeTotalSolved || 1);
  const maxHR = Math.max(snapA.hackerrankTotalSolved || 0, snapB.hackerrankTotalSolved || 1);
  const maxEasy = Math.max(snapA.leetcodeEasySolved || 0, snapB.leetcodeEasySolved || 1);
  const maxMed = Math.max(snapA.leetcodeMediumSolved || 0, snapB.leetcodeMediumSolved || 1);
  const maxHard = Math.max(snapA.leetcodeHardSolved || 0, snapB.leetcodeHardSolved || 1);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          ⚔️ Compare Students
        </h1>
        <p className="text-sm text-slate-500 mt-1">Select two students to compare their performance head-to-head</p>
      </div>

      {/* Pickers */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <StudentPicker label="Student A" onSelect={handleSelectA} color="#5a6af8" />
          <div className="flex items-center justify-center pt-8">
            <span className="text-2xl font-black text-slate-300">VS</span>
          </div>
          <StudentPicker label="Student B" onSelect={handleSelectB} color="#34d399" />
        </div>
      </div>

      {/* Results */}
      {isReady ? (
        <div className="space-y-4">
          {/* Score circles */}
          <div className="card p-6">
            <div className="flex justify-around items-center flex-wrap gap-6">
              <div className="text-center">
                <p className="text-lg font-black text-slate-900">{dataA.name}</p>
                <p className="text-xs text-slate-400 font-mono">{dataA.rollNumber}</p>
                <p className="text-xs text-indigo-500 font-black mt-1">Rank #{studentA.rank}</p>
              </div>
              <ScoreCircle score={snapA.combinedScore || 0} label="Score A" color="#5a6af8" />
              <div className="text-center px-4">
                <p className="text-4xl font-black text-slate-200">VS</p>
              </div>
              <ScoreCircle score={snapB.combinedScore || 0} label="Score B" color="#34d399" />
              <div className="text-center">
                <p className="text-lg font-black text-slate-900">{dataB.name}</p>
                <p className="text-xs text-slate-400 font-mono">{dataB.rollNumber}</p>
                <p className="text-xs text-emerald-500 font-black mt-1">Rank #{studentB.rank}</p>
              </div>
            </div>

            {/* winner banner */}
            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              {snapA.combinedScore > snapB.combinedScore ? (
                <p className="text-sm font-black text-indigo-600">🏆 {dataA.name} leads by {(snapA.combinedScore - snapB.combinedScore).toFixed(2)} points</p>
              ) : snapB.combinedScore > snapA.combinedScore ? (
                <p className="text-sm font-black text-emerald-600">🏆 {dataB.name} leads by {(snapB.combinedScore - snapA.combinedScore).toFixed(2)} points</p>
              ) : (
                <p className="text-sm font-black text-slate-500">🤝 It's a tie!</p>
              )}
            </div>
          </div>

          {/* Detailed bars */}
          <div className="card p-6 space-y-5">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Detailed Comparison</h3>
            <StatBar label="LeetCode Total" valueA={snapA.leetcodeTotalSolved || 0} valueB={snapB.leetcodeTotalSolved || 0} maxVal={maxLC} />
            <StatBar label="Easy Solved" valueA={snapA.leetcodeEasySolved || 0} valueB={snapB.leetcodeEasySolved || 0} maxVal={maxEasy} colorA="#f59e0b" colorB="#fbbf24" />
            <StatBar label="Medium Solved" valueA={snapA.leetcodeMediumSolved || 0} valueB={snapB.leetcodeMediumSolved || 0} maxVal={maxMed} colorA="#f97316" colorB="#fb923c" />
            <StatBar label="Hard Solved" valueA={snapA.leetcodeHardSolved || 0} valueB={snapB.leetcodeHardSolved || 0} maxVal={maxHard} colorA="#ef4444" colorB="#f87171" />
            <StatBar label="HackerRank" valueA={snapA.hackerrankTotalSolved || 0} valueB={snapB.hackerrankTotalSolved || 0} maxVal={maxHR} colorA="#34d399" colorB="#10b981" />
            <StatBar label="Hackathons" valueA={snapA.hackathonScore || 0} valueB={snapB.hackathonScore || 0} maxVal={Math.max(snapA.hackathonScore || 0, snapB.hackathonScore || 1)} colorA="#8b5cf6" colorB="#a78bfa" />
            <StatBar label="Contest Rating" valueA={Math.round(snapA.leetcodeContestRating || 0)} valueB={Math.round(snapB.leetcodeContestRating || 0)} maxVal={Math.max(snapA.leetcodeContestRating || 0, snapB.leetcodeContestRating || 1)} colorA="#ec4899" colorB="#f472b6" />
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-4">⚔️</p>
          <p className="text-slate-400 font-bold">Select two students above to start comparing</p>
        </div>
      )}
    </div>
  );
}
