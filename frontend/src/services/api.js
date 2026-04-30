import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================
// Auth
// ============================================================
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// ============================================================
// Students
// ============================================================
export const studentsAPI = {
  list: (params) => api.get('/students', { params }),
  get: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  refresh: (studentId) => api.post(`/students/refresh/${studentId}`),
  history: (id, params) => api.get(`/students/${id}/history`, { params }),
  logs: (id, params) => api.get(`/students/${id}/logs`, { params }),
  updateGoal: (id, goal) => api.put(`/students/${id}/goal`, { goal }),
  updateProfile: (id, data) => api.put(`/students/${id}/profile`, data),
  achievements: (id) => api.get(`/students/${id}/achievements`),
};

// ============================================================
// Leaderboard
// ============================================================
export const leaderboardAPI = {
  get: (params) => api.get('/leaderboard', { params }),
};

// ============================================================
// Admin
// ============================================================
export const adminAPI = {
  sync: () => api.post('/admin/sync'),
  stats: () => api.get('/admin/stats'),
  logs: (params) => api.get('/admin/logs', { params }),
  analytics: () => api.get('/admin/analytics'),
  trends: () => api.get('/admin/trends'),
  interventions: () => api.get('/admin/interventions'),
  getSettings: () => api.get('/admin/settings'),
  updateSetting: (key, data) => api.put(`/admin/settings/${key}`, data),
  health: () => api.get('/admin/health'),
};

// ============================================================
// Hackathons
// ============================================================
export const hackathonAPI = {
  getMyHackathons: () => api.get('/hackathons/my'),
  create: (formData) => api.post('/hackathons', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, formData) => api.put(`/hackathons/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/hackathons/${id}`),
  // Admin
  getPending: (params) => api.get('/hackathons/admin/pending', { params }),
  verify: (id, data) => api.put(`/hackathons/admin/${id}/verify`, data),
  getStudentHackathons: (studentId) => api.get(`/hackathons/student/${studentId}`),
};

export default api;
