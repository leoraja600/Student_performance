import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Spinner, StatCard } from '../components/UI';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await adminAPI.getSettings();
      setSettings(res.data.data);
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (key, newValue) => {
    setSaving(key);
    try {
      await adminAPI.updateSetting(key, { value: newValue });
      toast.success('Setting updated');
      setSettings(prev => prev.map(s => s.key === key ? { ...s, value: newValue } : s));
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size={12} /></div>;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Configuration</h1>
        <p className="text-sm text-slate-500 mt-1">Manage global scoring weights and platform limits</p>
      </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settings.map((s) => (
          <div key={s.key} className="card p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div>
              <div>
                <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest font-mono">{s.key}</p>
                <p className="text-sm text-slate-600 font-medium mt-1">{s.description}</p>
              </div>
              </div>
              {saving === s.key && <Spinner size={4} />}
            </div>
            
            <div className="flex gap-3">
              <input
                type="number"
                value={s.value}
                onChange={(e) => {
                  const val = e.target.value;
                  setSettings(prev => prev.map(item => item.key === s.key ? { ...item, value: val } : item));
                }}
                className="input flex-1"
              />
              <button
                onClick={() => handleUpdate(s.key, s.value)}
                disabled={saving === s.key}
                className="btn-primary"
              >
                Save
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6 border-l-4 border-amber-500 bg-amber-50/50">
        <h3 className="text-sm font-bold text-amber-700 mb-2">💡 Note on Normalization</h3>
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          The <b>Combined Score</b> is calculated as: <br/> 
          <code className="bg-white/50 px-2 py-1 rounded inline-block mt-2 text-[10px] border border-amber-100 font-bold">
            (LC_Solved / LC_Max) * LC_Weight + (HR_Score / HR_Max) * HR_Weight
          </code>
          <br/><br/>
          Ensure that the sum of <b>Weights</b> equals 100 for a standard 0-100 score distribution. Changes apply immediately upon next profile sync.
        </p>
      </div>
    </div>
  );
}
