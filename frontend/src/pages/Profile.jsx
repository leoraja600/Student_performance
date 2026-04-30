import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { User, Link as LinkIcon, Save, Info, ExternalLink } from 'lucide-react';

export default function Profile() {
  const { user, studentId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentData, setStudentData] = useState({
    leetcodeUsername: '',
    hackerrankUsername: '',
  });

  useEffect(() => {
    if (studentId) {
      loadProfile();
    }
  }, [studentId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await studentsAPI.get(studentId);
      if (res.data.success) {
        setStudentData({
          leetcodeUsername: res.data.data.leetcodeUsername || '',
          hackerrankUsername: res.data.data.hackerrankUsername || '',
        });
      }
    } catch (error) {
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await studentsAPI.updateProfile(studentId, studentData);
      if (res.data.success) {
        toast.success('Profile links updated! A new sync will reflect these changes.');
        // Refresh local data to show normalized usernames if links were pasted
        setStudentData({
          leetcodeUsername: res.data.data.leetcodeUsername,
          hackerrankUsername: res.data.data.hackerrankUsername,
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Your Profile</h1>
        <p className="text-slate-500">Manage your LeetCode and HackerRank connections</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <User size={20} />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{user?.email}</p>
              <p className="text-sm text-slate-500 uppercase tracking-wider font-bold">Student Account</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div className="space-y-4">
            <label className="block">
              <span className="text-slate-700 font-medium flex items-center gap-2 mb-2">
                <img src="https://leetcode.com/favicon.ico" className="w-4 h-4" alt="" />
                LeetCode Profile Link or Username
              </span>
              <input
                type="text"
                placeholder="e.g. leetcode.com/username"
                className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 text-slate-900"
                value={studentData.leetcodeUsername}
                onChange={(e) => setStudentData({ ...studentData, leetcodeUsername: e.target.value })}
                required
              />
            </label>

            <label className="block">
              <span className="text-slate-700 font-medium flex items-center gap-2 mb-2">
                <img src="https://www.hackerrank.com/favicon.ico" className="w-4 h-4" alt="" />
                HackerRank Profile Link or Username
              </span>
              <input
                type="text"
                placeholder="e.g. hackerrank.com/profile/username"
                className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 text-slate-900"
                value={studentData.hackerrankUsername}
                onChange={(e) => setStudentData({ ...studentData, hackerrankUsername: e.target.value })}
                required
              />
            </label>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 flex gap-3 text-blue-800 text-sm">
            <Info size={18} className="shrink-0 mt-0.5" />
            <p>
              You can paste the **full URL** from your browser (e.g. `https://leetcode.com/u/myuser/`) or just your **username**. 
              The system will automatically extract the correct ID for you.
            </p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? 'Updating...' : (
                <>
                  <Save size={18} />
                  Update Profile Links
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {studentData.leetcodeUsername && (
          <a
            href={studentData.leetcodeUsername.includes('http') ? studentData.leetcodeUsername : `https://leetcode.com/u/${studentData.leetcodeUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between hover:border-indigo-300 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <img src="https://leetcode.com/favicon.ico" className="w-5 h-5" alt="" />
              <span className="font-medium text-slate-700">View LeetCode</span>
            </div>
            <ExternalLink size={16} className="text-slate-400 group-hover:text-indigo-600" />
          </a>
        )}
        {studentData.hackerrankUsername && (
          <a
            href={studentData.hackerrankUsername.includes('http') ? studentData.hackerrankUsername : `https://www.hackerrank.com/profile/${studentData.hackerrankUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between hover:border-indigo-300 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <img src="https://www.hackerrank.com/favicon.ico" className="w-5 h-5" alt="" />
              <span className="font-medium text-slate-700">View HackerRank</span>
            </div>
            <ExternalLink size={16} className="text-slate-400 group-hover:text-indigo-600" />
          </a>
        )}
      </div>
    </div>
  );
}
