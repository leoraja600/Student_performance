import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { hackathonAPI } from '../services/api';
import { Spinner, EmptyState } from '../components/UI';
import HackathonFormModal from '../components/HackathonFormModal';
import toast from 'react-hot-toast';

const POSITION_OPTIONS = [
  { value: 'WINNER', label: '🥇 Winner', points: 10 },
  { value: 'RUNNER_UP', label: '🥈 Runner Up', points: 7 },
  { value: 'TOP_5', label: '🏅 Top 5', points: 5 },
  { value: 'PARTICIPANT', label: '👤 Participant', points: 3 },
];

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

export default function MyHackathons() {
  const { user } = useAuth();
  const [hackathons, setHackathons] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [viewProof, setViewProof] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await hackathonAPI.getMyHackathons();
      setHackathons(res.data.data.hackathons);
      setStats(res.data.data.stats);
    } catch (err) {
      toast.error('Failed to load hackathons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this hackathon entry?')) return;
    setDeleting(id);
    try {
      await hackathonAPI.delete(id);
      toast.success('Hackathon deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const openEdit = (h) => {
    setEditData(h);
    setShowForm(true);
  };

  const openNew = () => {
    setEditData(null);
    setShowForm(true);
  };

  if (loading) return <div className="p-6 h-screen flex items-center justify-center"><Spinner size={12} /></div>;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="text-3xl">🏆</span> My Hackathons
          </h1>
          <p className="text-sm text-slate-400 mt-1">Submit your hackathon participations and upload proof for verification</p>
        </div>
        <button
          onClick={openNew}
          className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2 shadow-sm"
        >
          <span className="text-lg leading-none">+</span> Add Hackathon
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4 border-l-4 border-primary-500">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Submitted</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="card p-4 border-l-4 border-emerald-500">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats.verified}</p>
          </div>
          <div className="card p-4 border-l-4 border-amber-500">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{stats.pending}</p>
          </div>
          <div className="card p-4 border-l-4 border-violet-500">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score Earned</p>
            <p className="text-2xl font-black text-violet-600 mt-1">{stats.totalScore} pts</p>
          </div>
        </div>
      )}

      {/* Hackathon List */}
      {hackathons.length === 0 ? (
        <EmptyState message="No hackathons submitted yet. Click 'Add Hackathon' to get started!" />
      ) : (
        <div className="space-y-4">
          {hackathons.map((h) => {
            const posInfo = POSITION_OPTIONS.find(p => p.value === h.position) || POSITION_OPTIONS[3];
            return (
              <div key={h.id} className="card p-0 overflow-hidden hover:shadow-md transition-shadow group">
                <div className="flex flex-col md:flex-row">
                  {/* Proof Thumbnail */}
                  <div
                    className="w-full md:w-44 h-32 md:h-auto bg-slate-100 flex items-center justify-center cursor-pointer relative overflow-hidden flex-shrink-0"
                    onClick={() => h.proofUrl && setViewProof(h.proofUrl)}
                  >
                    {h.proofUrl ? (
                      h.proofUrl.endsWith('.pdf') ? (
                        <div className="flex flex-col items-center gap-1 text-slate-400">
                          <span className="text-4xl">📄</span>
                          <span className="text-[9px] font-bold uppercase">PDF Proof</span>
                        </div>
                      ) : (
                        <>
                          <img src={h.proofUrl} alt="Proof" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-bold transition-opacity">🔍 View</span>
                          </div>
                        </>
                      )
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-300">
                        <span className="text-3xl">📷</span>
                        <span className="text-[9px] font-bold uppercase">No Proof</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-base font-bold text-slate-900">{h.eventName}</h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${STATUS_STYLES[h.status]}`}>
                            {STATUS_ICONS[h.status]} {h.status}
                          </span>
                        </div>
                        {h.organizer && (
                          <p className="text-xs text-slate-400 font-medium">by {h.organizer}</p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-2.5 text-[11px] text-slate-500 font-medium">
                          <span className="flex items-center gap-1">📅 {new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span className="flex items-center gap-1">{posInfo.label}</span>
                          <span className="flex items-center gap-1">👥 Team of {h.teamSize}</span>
                          {h.status === 'VERIFIED' && (
                            <span className="flex items-center gap-1 text-emerald-600 font-bold">⭐ +{posInfo.points} pts</span>
                          )}
                        </div>
                        {h.description && (
                          <p className="text-xs text-slate-400 mt-2 line-clamp-2">{h.description}</p>
                        )}
                        {h.status === 'REJECTED' && h.rejectionReason && (
                          <div className="mt-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                            <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Rejection Reason</p>
                            <p className="text-xs text-red-500 mt-0.5">{h.rejectionReason}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1.5 flex-shrink-0">
                        {h.proofUrl && (
                          <button
                            onClick={() => setViewProof(h.proofUrl)}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                            title="View proof"
                          >
                            👁
                          </button>
                        )}
                        {h.status !== 'VERIFIED' && (
                          <>
                            <button
                              onClick={() => openEdit(h)}
                              className="w-8 h-8 rounded-lg bg-primary-50 hover:bg-primary-100 flex items-center justify-center text-primary-600 transition-colors"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(h.id)}
                              disabled={deleting === h.id}
                              className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              🗑
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Banner */}
      <div className="card p-5 bg-gradient-to-r from-primary-50 to-violet-50 border border-primary-100">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="text-sm font-bold text-slate-800">How Hackathon Scoring Works</h3>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
              {POSITION_OPTIONS.map(p => (
                <div key={p.value} className="bg-white/70 rounded-lg px-3 py-2 border border-white">
                  <p className="text-xs font-bold text-slate-700">{p.label}</p>
                  <p className="text-lg font-black text-primary-600">+{p.points}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-medium">
              Points are awarded only after admin verification. Upload clear proof (certificates, photos) to speed up the process.
            </p>
          </div>
        </div>
      </div>

      {/* Modal */}
      <HackathonFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditData(null); }}
        onSuccess={fetchData}
        editData={editData}
      />

      {/* Proof Viewer */}
      {viewProof && <ProofViewer url={viewProof} onClose={() => setViewProof(null)} />}
    </div>
  );
}
