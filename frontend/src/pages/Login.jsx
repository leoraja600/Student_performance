import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      const { user } = await login(form.email.toLowerCase().trim(), form.password);
      toast.success('Welcome back!');
      
      let redirect = from;
      if (from === '/dashboard') {
        if (user.role === 'ADMIN') redirect = '/admin';
        else if (user.role === 'FACULTY') redirect = '/admin'; // This goes to FacultyDashboard in AppLayout logic
      }
      
      navigate(redirect, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-accent-200/20 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10 translate-y-2">
          <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-primary-500/10 mb-8 border border-slate-100 rotate-6 group hover:rotate-0 transition-transform duration-500 overflow-hidden p-3">
            <img src="/logo.jpg" alt="KCE Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">KARPAGAM</h1>
          <p className="text-primary-600 text-[10px] font-black uppercase tracking-[0.3em] mt-2">College of Engineering</p>
          <p className="text-slate-400 text-[9px] font-bold mt-4 uppercase tracking-widest">Unified Performance Analytics</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200/60 p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50">
          <div className="mb-8">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Secure Access</h2>
            <p className="text-xs text-slate-400 font-bold mt-1">LOG IN TO YOUR PORTAL</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Email Terminal</label>
              <div className="relative group">
                <input
                  id="email"
                  type="text"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 placeholder-slate-300 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all outline-none"
                  placeholder="Email or Roll Number"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="username"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                   <span className="text-primary-600 text-lg">📧</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Security Key</label>
              <div className="relative group">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 placeholder-slate-300 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all outline-none"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors bg-white p-1 rounded-lg"
                >
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    {showPw
                      ? <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                    }
                  </svg>
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="login-btn"
              className="w-full bg-slate-900 text-white rounded-2xl py-4.5 text-xs font-black uppercase tracking-widest hover:bg-black hover:shadow-2xl hover:shadow-slate-900/20 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 mt-4"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AUTHENTICATING...
                </>
              ) : (
                <>
                  SIGN IN TO PORTAL
                  <span className="text-lg">→</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
              Access Restricted to Institutional Personnel
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-10">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
             System Admin: <span className="text-slate-600">admin@college.edu</span>
           </p>
        </div>
      </div>
    </div>
  );
}
