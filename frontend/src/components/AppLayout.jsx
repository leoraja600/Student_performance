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
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Logo" className="w-8 h-8 object-contain" />
            <span className="text-xs font-black text-slate-800 uppercase tracking-tighter">Student Performance</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
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

