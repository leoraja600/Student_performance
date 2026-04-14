import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { hackathonAPI } from '../services/api';
import { Spinner, EmptyState } from '../components/UI';
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

function HackathonFormModal({ isOpen, onClose, onSuccess, editData }) {
  const [form, setForm] = useState({
    eventName: '',
    organizer: '',
    position: 'PARTICIPANT',
    date: '',
    description: '',
    teamSize: 1,
  });
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editData) {
      setForm({
        eventName: editData.eventName || '',
        organizer: editData.organizer || '',
        position: editData.position || 'PARTICIPANT',
        date: editData.date ? new Date(editData.date).toISOString().split('T')[0] : '',
        description: editData.description || '',
        teamSize: editData.teamSize || 1,
      });
      if (editData.proofUrl) setProofPreview(editData.proofUrl);
    } else {
      setForm({ eventName: '', organizer: '', position: 'PARTICIPANT', date: '', description: '', teamSize: 1 });
      setProofPreview(null);
    }
    setProofFile(null);
  }, [editData, isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File must be under 5MB');
        return;
      }
      setProofFile(file);
      if (file.type.startsWith('image/')) {
        setProofPreview(URL.createObjectURL(file));
      } else {
        setProofPreview(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.eventName.trim() || !form.date) {
      toast.error('Event name and date are required');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('eventName', form.eventName.trim());
      formData.append('organizer', form.organizer.trim());
      formData.append('position', form.position);
      formData.append('date', form.date);
      formData.append('description', form.description.trim());
      formData.append('teamSize', form.teamSize);
      if (proofFile) formData.append('proof', proofFile);

      if (editData) {
        await hackathonAPI.update(editData.id, formData);
        toast.success('Hackathon updated!');
      } else {
        await hackathonAPI.create(formData);
        toast.success('Hackathon submitted for review!');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto border border-slate-100">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {editData ? 'Edit Hackathon' : 'Submit Hackathon'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Fill in the details and upload proof</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <span className="text-slate-500 text-lg leading-none">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Event Name */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Event Name *</label>
            <input
              type="text"
              value={form.eventName}
              onChange={(e) => setForm({ ...form, eventName: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-slate-300"
              placeholder="e.g. Smart India Hackathon 2026"
              required
            />
          </div>

          {/* Organizer */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Organizer</label>
            <input
              type="text"
              value={form.organizer}
              onChange={(e) => setForm({ ...form, organizer: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-slate-300"
              placeholder="e.g. Ministry of Education"
            />
          </div>

          {/* Position & Date Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Position *</label>
              <select
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              >
                {POSITION_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label} (+{p.points} pts)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Team Size */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Team Size</label>
            <input
              type="number"
              min="1"
              max="20"
              value={form.teamSize}
              onChange={(e) => setForm({ ...form, teamSize: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none placeholder:text-slate-300"
              placeholder="Brief description of the hackathon and your project..."
            />
          </div>

          {/* Proof Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Proof (Certificate/Photo)
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-primary-300 transition-colors bg-slate-50/50">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="proof-upload"
              />
              <label htmlFor="proof-upload" className="cursor-pointer">
                {proofPreview ? (
                  <div className="space-y-2">
                    {proofFile?.type === 'application/pdf' || (!proofFile && editData?.proofUrl?.endsWith('.pdf')) ? (
                      <div className="flex items-center justify-center gap-2 py-4">
                        <span className="text-3xl">📄</span>
                        <span className="text-sm text-slate-600 font-medium">{proofFile?.name || 'Certificate.pdf'}</span>
                      </div>
                    ) : (
                      <img src={proofPreview} alt="Proof preview" className="w-full max-h-48 object-contain rounded-lg" />
                    )}
                    <p className="text-[10px] text-slate-400 font-medium">Click to change file</p>
                  </div>
                ) : (
                  <div className="py-6 space-y-2">
                    <div className="text-4xl">📎</div>
                    <p className="text-sm text-slate-500 font-medium">Click to upload certificate or photo</p>
                    <p className="text-[10px] text-slate-400">JPEG, PNG, WebP, or PDF · Max 5MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl text-sm font-bold hover:from-primary-700 hover:to-primary-600 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Spinner size={4} /> : null}
              {editData ? 'Update' : 'Submit for Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
