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

export default function AppLayout() {
  const { isAdmin, isFaculty, isStudent } = useAuth();
  const isFacultyOrAdmin = isAdmin || isFaculty;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dashboard/:id" element={<Dashboard />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="hackathon-leaderboard" element={<HackathonLeaderboard />} />
          <Route path="compare" element={<Compare />} />
          <Route path="hackathons" element={<MyHackathons />} />

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
  );
}

