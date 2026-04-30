import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

// Pages
import Dashboard from '../pages/Dashboard';
import Leaderboard from '../pages/Leaderboard';
import Compare from '../pages/Compare';
import MyHackathons from '../pages/MyHackathons';
import ReviewHackathons from '../pages/ReviewHackathons';
import AdminDashboard from '../pages/AdminDashboard';
import AdminSettings from '../pages/AdminSettings';
import FacultyDashboard from '../pages/FacultyDashboard';
import ManageStudents from '../pages/ManageStudents';
import FetchLogs from '../pages/FetchLogs';
import GlobalAnalytics from '../pages/GlobalAnalytics';
import HackathonLeaderboard from '../pages/HackathonLeaderboard';
import Profile from '../pages/Profile';

export default function AppLayout() {
  const { isAdmin, isFaculty, isStudent } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const isFacultyOrAdmin = isAdmin || isFaculty;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex flex-col items-center gap-3 px-4 py-4 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Logo" className="w-10 h-10 object-contain" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">KARPAGAM</span>
              <span className="text-[9px] font-bold text-primary-600 uppercase tracking-tighter">College of Engineering</span>
            </div>
          </div>
          
          <button 
            onClick={() => setSidebarOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all border border-slate-100"
          >
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
            <span className="text-[10px] font-black uppercase tracking-widest">Open Menu</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto relative">
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="dashboard/:id" element={<Dashboard />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="hackathon-leaderboard" element={<HackathonLeaderboard />} />
            <Route path="compare" element={<Compare />} />
            <Route path="hackathons" element={<MyHackathons />} />
            <Route path="profile" element={<Profile />} />

            {isFacultyOrAdmin && (
              <>
                <Route path="admin" element={isAdmin ? <AdminDashboard /> : <FacultyDashboard />} />
                <Route path="admin/analytics" element={<GlobalAnalytics />} />
                <Route path="admin/logs" element={<FetchLogs />} />
                <Route path="admin/hackathons" element={<ReviewHackathons />} />
              </>
            )}

            {isAdmin && (
              <Route path="admin/students" element={<ManageStudents />} />
            )}

            <Route path="*" element={<Navigate to={isAdmin ? '/admin' : (isFaculty ? '/admin/analytics' : '/dashboard')} replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

