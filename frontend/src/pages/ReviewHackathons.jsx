import React, { useState, useEffect, useCallback } from 'react';
import { hackathonAPI } from '../services/api';
import { Spinner, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { value: 'PENDING', label: 'Pending Review', icon: '⏳' },
  { value: 'VERIFIED', label: 'Verified', icon: '✅' },
  { value: 'REJECTED', label: 'Rejected', icon: '❌' },
  { value: 'ALL', label: 'All', icon: '📋' },
];

const POSITION_LABELS = {
  WINNER: '🥇 Winner',
  RUNNER_UP: '🥈 Runner Up',
  TOP_5: '🏅 Top 5',
  PARTICIPANT: '👤 Participant',
};

const POSITION_SCORES = { WINNER: 10, RUNNER_UP: 7, TOP_5: 5, PARTICIPANT: 3 };

export default function ReviewHackathons() {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [processing, setProcessing] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewProof, setViewProof] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await hackathonAPI.getPending({ status: activeTab, page: pagination.page, limit: 20 });
      setHackathons(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load hackathons');
    } finally {
      setLoading(false);
    }
  }, [activeTab, pagination.page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleVerify = async (id) => {
    setProcessing(id);
    try {
      await hackathonAPI.verify(id, { action: 'VERIFY' });
      toast.success('Hackathon verified!');
      fetchData();
    } catch (err) {
      toast.error('Failed to verify');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setProcessing(rejectModal);
    try {
      await hackathonAPI.verify(rejectModal, { action: 'REJECT', rejectionReason: rejectReason || 'Insufficient proof' });
      toast.success('Hackathon rejected');
      setRejectModal(null);
      setRejectReason('');
      fetchData();
    } catch (err) {
      toast.error('Failed to reject');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <span className="text-3xl">📋</span> Review Hackathons
        </h1>
        <p className="text-sm text-slate-400 mt-1">Verify or reject student hackathon submissions</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => { setActiveTab(tab.value); setPagination(p => ({ ...p, page: 1 })); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.value
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={10} /></div>
      ) : hackathons.length === 0 ? (
        <EmptyState message={`No ${activeTab.toLowerCase()} hackathon submissions`} />
      ) : (
        <div className="space-y-4">
          {hackathons.map(h => (
            <div key={h.id} className="card p-0 overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row">
                {/* Proof thumbnail */}
                <div
                  className="w-full md:w-40 h-28 md:h-auto bg-slate-100 flex items-center justify-center cursor-pointer flex-shrink-0 relative overflow-hidden"
                  onClick={() => h.proofUrl && setViewProof(h.proofUrl)}
                >
                  {h.proofUrl ? (
                    h.proofUrl.endsWith('.pdf') ? (
                      <div className="flex flex-col items-center gap-1 text-slate-400">
                        <span className="text-3xl">📄</span>
                        <span className="text-[9px] font-bold uppercase">PDF</span>
                      </div>
                    ) : (
                      <img src={h.proofUrl} alt="Proof" className="w-full h-full object-cover" />
                    )
                  ) : (
                    <span className="text-slate-300 text-[10px] font-bold uppercase">No Proof</span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900">{h.eventName}</h3>
                        <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-100">
                          {POSITION_LABELS[h.position]} · +{POSITION_SCORES[h.position]}pts
                        </span>
                      </div>

                      {/* Student Info */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-[9px] font-bold">
                          {h.student?.name?.[0]}
                        </div>
                        <span className="text-xs text-slate-600 font-semibold">{h.student?.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{h.student?.rollNumber}</span>
                      </div>

                      <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-slate-400 font-medium">
                        {h.organizer && <span>🏢 {h.organizer}</span>}
                        <span>📅 {new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span>👥 Team of {h.teamSize}</span>
                      </div>
                      {h.description && <p className="text-xs text-slate-400 mt-1.5 line-clamp-1">{h.description}</p>}
                      {h.rejectionReason && (
                        <p className="text-[10px] text-red-500 mt-1 font-medium">Reason: {h.rejectionReason}</p>
                      )}
                    </div>

                    {/* Actions */}
                    {h.status === 'PENDING' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleVerify(h.id)}
                          disabled={processing === h.id}
                          className="px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          ✅ Verify
                        </button>
                        <button
                          onClick={() => { setRejectModal(h.id); setRejectReason(''); }}
                          disabled={processing === h.id}
                          className="px-3 py-2 bg-red-100 text-red-600 text-xs font-bold rounded-xl hover:bg-red-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    )}
                    {h.status === 'VERIFIED' && (
                      <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-xl border border-emerald-200">
                        ✅ VERIFIED
                      </span>
                    )}
                    {h.status === 'REJECTED' && (
                      <span className="px-3 py-1.5 bg-red-50 text-red-500 text-[10px] font-black rounded-xl border border-red-200">
                        ❌ REJECTED
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPagination(p => ({ ...p, page: i + 1 }))}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                pagination.page === i + 1 ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">Reject Hackathon</h3>
            <p className="text-xs text-slate-400 mb-4">Provide a reason so the student can correct and resubmit.</p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-red-500 outline-none resize-none placeholder:text-slate-300"
              placeholder="e.g. Certificate is not clearly visible, please re-upload a higher quality image"
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing === rejectModal}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Viewer */}
      {viewProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setViewProof(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl max-h-[85vh] w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-700">Proof Document</h3>
              <button onClick={() => setViewProof(null)} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500">&times;</button>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-50 min-h-[400px]">
              {viewProof.endsWith('.pdf') ? (
                <iframe src={viewProof} className="w-full h-[70vh] rounded-lg" title="Proof PDF" />
              ) : (
                <img src={viewProof} alt="Proof" className="max-w-full max-h-[70vh] object-contain rounded-lg" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
