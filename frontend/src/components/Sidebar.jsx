import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout, isAdmin, isFaculty, isStudent } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  let navItems = [];
  if (isAdmin) {
    navItems = [
      { to: '/leaderboard', label: 'Global Leaderboard', icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
      { to: '/hackathon-leaderboard', label: 'Event Champions', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
      { to: '/compare', label: 'Compare Students', icon: 'M18 20V10M12 20V4M6 20v-6' },
      { to: '/admin/analytics', label: 'Overall Analytics', icon: 'M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM13 2v7h7M9 13h6M9 17h6M9 9h1' },
      { to: '/admin', label: 'System Stats', icon: 'M12 4l8 4-8 4-8-4 8-4zM2 12l10 5 10-5M2 18l10 5 10-5' },
      { to: '/admin/students', label: 'Manage Students', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
      { to: '/admin/hackathons', label: 'Review Hackathons', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
      { to: '/admin/logs', label: 'Sync Logs', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8' },
      { to: '/admin/settings', label: 'System Settings', icon: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' },
    ];
  } else if (isFaculty) {
    navItems = [
      { to: '/leaderboard', label: 'Global Leaderboard', icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
      { to: '/hackathon-leaderboard', label: 'Event Champions', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
      { to: '/compare', label: 'Compare Students', icon: 'M18 20V10M12 20V4M6 20v-6' },
      { to: '/admin/analytics', label: 'Performance Analytics', icon: 'M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM13 2v7h7M9 13h6M9 17h6M9 9h1' },
      { to: '/admin/hackathons', label: 'Review Hackathons', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
      { to: '/admin', label: 'Academic Overview', icon: 'M12 4l8 4-8 4-8-4 8-4zM2 12l10 5 10-5M2 18l10 5 10-5' },
      { to: '/admin/logs', label: 'Sync Logs', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8' },
    ];
  } else {
    // Student portal
    navItems = [
      { to: '/dashboard', label: 'My Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
      { to: '/profile', label: 'My Profile', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
      { to: '/hackathons', label: 'My Hackathons', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
      { to: '/leaderboard', label: 'Full Leaderboard', icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
      { to: '/hackathon-leaderboard', label: 'Event Leaderboard', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
      { to: '/compare', label: 'Compare with Others', icon: 'M18 20V10M12 20V4M6 20v-6' },
    ];
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col h-screen bg-white border-r border-slate-200 transition-all duration-300 shadow-xl lg:shadow-sm lg:static ${
        collapsed ? 'lg:w-16' : 'lg:w-64'
      } ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-100">
        <div className="w-12 h-12 flex-shrink-0">
          <img src="/logo.jpg" alt="KCE Logo" className="w-full h-full object-contain" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-tight">KARPAGAM</p>
            <p className="text-[9px] text-primary-600 font-bold uppercase tracking-tight">College of Engineering</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-gray-400 hover:text-primary-600 transition-colors hidden lg:block"
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d={collapsed ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'} />
          </svg>
        </button>
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="ml-auto text-gray-400 hover:text-red-600 transition-colors lg:hidden"
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* User badge */}
      {!collapsed && (
        <div className="mx-3 mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-700 truncate">{user?.student?.name || user?.email}</p>
              <span className={`badge text-[10px] px-1.5 py-0.5 ${isAdmin ? 'badge-blue' : 'badge-green'}`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard' || item.to === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 text-primary-600 border border-primary-100'
                  : 'text-slate-500 hover:text-primary-600 hover:bg-slate-50'
              }`
            }
            title={collapsed ? item.label : undefined}
            onClick={() => { if (window.innerWidth < 1024) onClose(); }}
          >
            <Icon d={item.icon} size={18} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
          title={collapsed ? 'Logout' : undefined}
        >
          <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" size={18} />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
