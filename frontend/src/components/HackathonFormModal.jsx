import React, { useState, useEffect } from 'react';
import { hackathonAPI } from '../services/api';
import { Spinner } from './UI';
import toast from 'react-hot-toast';

const POSITION_OPTIONS = [
  { value: 'WINNER', label: '🥇 Winner', points: 10 },
  { value: 'RUNNER_UP', label: '🥈 Runner Up', points: 7 },
  { value: 'TOP_5', label: '🏅 Top 5', points: 5 },
  { value: 'PARTICIPANT', label: '👤 Participant', points: 3 },
];

export default function HackathonFormModal({ isOpen, onClose, onSuccess, editData }) {
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
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{editData ? 'Edit Details' : 'Submit Hackathon'}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <span className="text-slate-500 text-lg">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Event Name *</label>
            <input type="text" value={form.eventName} onChange={(e) => setForm({ ...form, eventName: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Organizer</label>
            <input type="text" value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Position *</label>
              <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                {POSITION_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Date *</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Team Size</label>
            <input type="number" min="1" value={form.teamSize} onChange={(e) => setForm({ ...form, teamSize: parseInt(e.target.value) || 1 })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Proof (Certificate/Photo)</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50/50">
              <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="hidden" id="proof-upload-shared" />
              <label htmlFor="proof-upload-shared" className="cursor-pointer">
                {proofPreview ? (
                  <div className="space-y-2">
                    {proofPreview.includes('pdf') ? <span>📄 PDF Proof</span> : <img src={proofPreview} alt="Preview" className="w-full max-h-48 object-contain rounded-lg" />}
                    <p className="text-[10px] text-slate-400">Click to change</p>
                  </div>
                ) : <span className="text-sm text-slate-500">Click to upload</span>}
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-100 rounded-xl text-sm font-bold">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold disabled:opacity-50">
              {submitting ? 'Processing...' : 'Update Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
