import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { studentsAPI } from '../services/api';
import { Badge, Spinner, EmptyState } from '../components/UI';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const POLICIES = [
  { id: 'SYSTEM', name: 'Global Standard', lcWeight: 50, hrWeight: 50 },
  { id: 'ALGO_FOCUS', name: 'LeetCode Elite', lcWeight: 70, hrWeight: 30 },
  { id: 'VERSATILE', name: 'HackerRank Depth', lcWeight: 30, hrWeight: 70 },
  { id: 'BALANCED', name: 'Balanced Progress', lcWeight: 50, hrWeight: 50 },
];

function ScoreMini({ value, max = 100, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-slate-500 font-mono w-8">{value}</span>
    </div>
  );
}

function StudentForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState(
    initial || { rollNumber: '', name: '', email: '', leetcodeUsername: '', hackerrankUsername: '', hackathonCount: 0, password: '', validateUsernames: false }
  );

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label text-slate-700 font-bold">Roll Number *</label>
          <input className="input-field" placeholder="CS2021001" value={form.rollNumber} onChange={set('rollNumber')} required />
        </div>
        <div>
          <label className="label text-slate-700 font-bold">Full Name *</label>
          <input className="input-field" placeholder="John Doe" value={form.name} onChange={set('name')} required />
        </div>
      </div>
      <div>
        <label className="label text-slate-700 font-bold">Email *</label>
        <input className="input-field" type="email" placeholder="student@college.edu" value={form.email} onChange={set('email')} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label text-slate-700 font-bold">LeetCode Username *</label>
          <input className="input-field font-mono" placeholder="username" value={form.leetcodeUsername} onChange={set('leetcodeUsername')} required />
        </div>
        <div>
          <label className="label text-slate-700 font-bold">HackerRank Username *</label>
          <input className="input-field font-mono" placeholder="username" value={form.hackerrankUsername} onChange={set('hackerrankUsername')} required />
        </div>
      </div>
      <div>
        <label className="label text-slate-700 font-bold">Hackathon Count (Score Aspect)</label>
        <input className="input-field" type="number" placeholder="Enter number of hackathons" value={form.hackathonCount} onChange={set('hackathonCount')} min="0" />
        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Weight: 20% | Max score at count: 5</p>
      </div>
      {!initial && (
        <div>
          <label className="label text-slate-700 font-bold">Password *</label>
          <input className="input-field" type="password" placeholder="Min 8 characters" value={form.password} onChange={set('password')} required minLength={8} />
        </div>
      )}
      {!initial && (
        <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer">
          <input type="checkbox" checked={form.validateUsernames} onChange={set('validateUsernames')} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
          Validate usernames on platforms (slower, recommended)
        </label>
      )}
      <div className="flex gap-3 pt-4">
        <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
          {loading ? <><Spinner size={4} />{initial ? 'Updating...' : 'Creating...'}</> : (initial ? 'Update Student' : 'Create Student')}
        </button>
      </div>
    </form>
  );
}

export default function ManageStudents() {
  const { isAdmin, isFaculty } = useAuth();
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [deleteStudent, setDeleteStudent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(null);
  const [policyId, setPolicyId] = useState(() => localStorage.getItem('scoring_policy') || 'SYSTEM');

  const handlePolicyChange = (id) => {
    setPolicyId(id);
    localStorage.setItem('scoring_policy', id);
    toast.success(`Perspective shifted: ${POLICIES.find(p => p.id === id).name}`);
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentsAPI.list({ page, limit: 15, search });
      setStudents(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(fetchStudents, 300);
    return () => clearTimeout(t);
  }, [fetchStudents]);

  const studentsWithPolicy = useMemo(() => {
    const policy = POLICIES.find(p => p.id === policyId);
    if (!policy || policyId === 'SYSTEM') return students;

    return students.map(s => {
      const latest = s.snapshots?.[0];
      if (!latest) return s;
      const lcComponent = Math.min(latest.leetcodeTotalSolved / 300, 1) * policy.lcWeight;
      const hrComponent = Math.min(latest.hackerrankTotalSolved / 500, 1) * policy.hrWeight;
      const customScore = parseFloat((lcComponent + hrComponent).toFixed(2));
      return { 
        ...s, 
        snapshots: [{ ...latest, combinedScore: customScore }, ...s.snapshots.slice(1)]
      };
    });
  }, [students, policyId]);

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      await studentsAPI.create(form);
      toast.success('Student created successfully!');
      setShowCreate(false);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create student');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (form) => {
    setSaving(true);
    try {
      await studentsAPI.update(editStudent.id, form);
      toast.success('Student updated!');
      setEditStudent(null);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await studentsAPI.delete(deleteStudent.id);
      toast.success('Student deactivated');
      setDeleteStudent(null);
      fetchStudents();
    } catch {
      toast.error('Failed to delete student');
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async (student) => {
    setRefreshing(student.id);
    try {
      await studentsAPI.refresh(student.id);
      toast.success(`Refreshed data for ${student.name}`);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refresh failed');
    } finally {
      setRefreshing(null);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
             Manage Students
             {policyId !== 'SYSTEM' && (
                <span className="text-[10px] bg-primary-50 text-primary-600 px-3 py-1 rounded-full border border-primary-100 uppercase font-black tracking-tighter">
                  View: {POLICIES.find(p => p.id === policyId)?.name}
                </span>
              )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{pagination.total} active nodes monitored</p>
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
            className="input-field w-56 shadow-sm"
            placeholder="Search students..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <button id="add-student-btn" onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 shadow-sm">
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Student
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden bg-white border border-slate-100 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Spinner size={10} /></div>
        ) : studentsWithPolicy.length === 0 ? (
          <EmptyState message={search ? 'No students match your search' : 'No students yet. Add your first student!'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="table-header text-left">Student</th>
                  <th className="table-header text-left font-bold">Roll No.</th>
                  <th className="table-header text-left">LeetCode</th>
                  <th className="table-header text-left bg-accent-50/10 text-accent-600">This Week</th>
                  <th className="table-header text-left">HackerRank</th>
                  <th className="table-header text-left text-purple-600">Rating</th>
                  <th className="table-header text-left">Score</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {studentsWithPolicy.map((s) => {
                  const latest = s.snapshots?.[0];
                  const weekProgress = s.weeklyLeetcodeProgress || 0;
                  const weekGoal = s.weeklyGoal || 10;
                  const weekPercent = Math.min((weekProgress / weekGoal) * 100, 100);
                  const isGoalMet = weekProgress >= weekGoal;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="table-cell">
                        <div>
                          <Link to={`/dashboard/${s.id}`} className="font-bold text-slate-900 hover:text-primary-600 transition-colors tracking-tight">
                            {s.name}
                          </Link>
                          <p className="text-[10px] text-slate-400 font-mono tracking-tighter">{s.email}</p>
                        </div>
                      </td>
                      <td className="table-cell font-mono text-xs text-slate-500 font-bold uppercase">{s.rollNumber}</td>
                      <td className="table-cell">
                        {latest ? (
                          <ScoreMini value={latest.leetcodeTotalSolved} max={300} color="#f59e0b" />
                        ) : (
                          <span className="text-[10px] text-slate-300 italic font-mono">NO DATA</span>
                        )}
                        <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-widest">{s.leetcodeUsername}</p>
                      </td>
                      <td className="table-cell bg-accent-50/5">
                        <div className="flex flex-col gap-1.5">
                           <div className="flex items-center gap-2">
                              <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                 <div className={`h-full transition-all duration-1000 ${isGoalMet ? 'bg-emerald-500' : 'bg-accent-500'}`} style={{ width: `${weekPercent}%` }}></div>
                              </div>
                              <span className={`text-[10px] font-black ${isGoalMet ? 'text-emerald-600' : 'text-accent-600'}`}>+{weekProgress}</span>
                           </div>
                           <div className="flex items-center gap-1">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Goal: {weekGoal}</span>
                              {isGoalMet && <span className="text-[8px] px-1 bg-emerald-500 text-white rounded font-black italic">MET</span>}
                           </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        {latest ? (
                          <ScoreMini value={latest.hackerrankTotalSolved} max={500} color="#34d399" />
                        ) : (
                          <span className="text-[10px] text-slate-300 italic font-mono">NO DATA</span>
                        )}
                        <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-widest">{s.hackerrankUsername}</p>
                      </td>
                      <td className="table-cell">
                        <span className="font-mono text-xs font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
                          {latest?.leetcodeContestRating ? Math.round(latest.leetcodeContestRating) : '—'}
                        </span>
                      </td>
                      <td className="table-cell">
                        {latest ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0 max-w-[50px]">
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-1000"
                                  style={{
                                    width: `${latest.combinedScore}%`,
                                    background: 'linear-gradient(to right, #5a6af8, #34d399)',
                                  }}
                                />
                              </div>
                            </div>
                            <span className="text-xs font-black text-slate-900">{latest.combinedScore}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic font-mono">—</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleRefresh(s)}
                            disabled={refreshing === s.id}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Refresh Stats"
                          >
                            {refreshing === s.id ? <Spinner size={4} /> : (
                              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => setEditStudent(s)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                            title="Edit"
                          >
                            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteStudent(s)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
                          >
                            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        </div>
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
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-4 py-2 text-xs font-bold shadow-sm disabled:opacity-30 transition-all">← PREVIOUS</button>
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Page {page} of {pagination.pages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary px-4 py-2 text-xs font-bold shadow-sm disabled:opacity-30 transition-all">NEXT →</button>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add New Student">
        <StudentForm onSubmit={handleCreate} loading={saving} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editStudent} onClose={() => setEditStudent(null)} title="Modify Student Profile">
        {editStudent && (
          <StudentForm
            initial={{ rollNumber: editStudent.rollNumber, name: editStudent.name, email: editStudent.email, leetcodeUsername: editStudent.leetcodeUsername, hackerrankUsername: editStudent.hackerrankUsername, hackathonCount: editStudent.hackathonCount }}
            onSubmit={handleUpdate}
            loading={saving}
          />
        )}
      </Modal>

      {/* Delete confirm Modal */}
      <Modal isOpen={!!deleteStudent} onClose={() => setDeleteStudent(null)} title="Deactivate Student" maxWidth="max-w-sm">
        <div className="space-y-4">
           <p className="text-slate-600 text-sm">
            Are you sure you want to deactivate <strong className="text-slate-900 font-black">{deleteStudent?.name}</strong>? Their historical performance data will be preserved but they will no longer appear on the active leaderboard.
           </p>
           <div className="flex gap-3">
            <button onClick={() => setDeleteStudent(null)} className="btn-secondary flex-1 font-bold text-xs">CANCEL</button>
            <button onClick={handleDelete} disabled={saving} className="btn-danger flex-1 font-bold text-xs ring-offset-2 focus:ring-2 focus:ring-red-500">
              {saving ? 'DEACTIVATING...' : 'DEACTIVATE'}
            </button>
           </div>
        </div>
      </Modal>
    </div>
  );
}
