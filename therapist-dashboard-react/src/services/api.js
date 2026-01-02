import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('therapist_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('therapist_token');
      localStorage.removeItem('therapist_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/api/auth/login', { username, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  verify: async () => {
    const response = await api.get('/api/auth/verify');
    return response.data;
  },
};

// Dashboard Stats API
export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get('/api/therapist/dashboard/stats');
    return response.data;
  },
};

// Children API
export const childrenAPI = {
  getAll: async () => {
    const response = await api.get('/api/therapist/children');
    return response.data;
  },

  getUnassigned: async () => {
    const response = await api.get('/api/therapist/unassigned-children');
    return response.data;
  },

  assign: async (childId) => {
    const response = await api.post('/api/therapist/assign-child', { childId });
    return response.data;
  },

  getById: async (childId) => {
    const response = await api.get(`/api/therapist/children/${childId}`);
    return response.data;
  },

  create: async (childData) => {
    const response = await api.post('/api/therapist/children', childData);
    return response.data;
  },

  update: async (childId, childData) => {
    const response = await api.put(`/api/therapist/children/${childId}`, childData);
    return response.data;
  },

  delete: async (childId) => {
    const response = await api.delete(`/api/therapist/children/${childId}`);
    return response.data;
  },
};

// Settings API
export const settingsAPI = {
  get: async (childId) => {
    const response = await api.get(`/api/therapist/children/${childId}/settings`);
    return response.data;
  },

  update: async (childId, settings) => {
    const response = await api.put(`/api/therapist/children/${childId}/settings`, settings);
    return response.data;
  },
};

// Sessions API
export const sessionsAPI = {
  getByChild: async (childId, page = 1, limit = 20) => {
    const response = await api.get(`/api/therapist/children/${childId}/sessions`, {
      params: { page, limit },
    });
    return response.data;
  },

  getById: async (sessionId) => {
    const response = await api.get(`/api/therapist/sessions/${sessionId}`);
    return response.data;
  },

  update: async (sessionId, data) => {
    const response = await api.put(`/api/therapist/sessions/${sessionId}`, data);
    return response.data;
  },

  delete: async (sessionId) => {
    const response = await api.delete(`/api/therapist/sessions/${sessionId}`);
    return response.data;
  },
};

// Progress API
export const progressAPI = {
  get: async (childId) => {
    const response = await api.get(`/api/therapist/children/${childId}/progress`);
    return response.data;
  },
};

// Heatmap API
export const heatmapAPI = {
  get: async (childId, sessionId = null) => {
    const params = sessionId ? { sessionId } : {};
    const response = await api.get(`/api/therapist/children/${childId}/heatmap`, { params });
    return response.data;
  },
};

export default api;
