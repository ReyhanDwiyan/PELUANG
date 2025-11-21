import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // ← Ubah dari 3000 ke 5000

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData)
};

// Marker APIs
export const markerAPI = {
  getAll: (params) => api.get('/markers', { params }),
  getById: (id) => api.get(`/markers/${id}`),
  create: (data) => api.post('/markers', data),
  update: (id, data) => api.put(`/markers/${id}`, data),
  delete: (id) => api.delete(`/markers/${id}`),
  getStats: () => api.get('/markers/stats'),
  getNearby: (lat, lng, radius) => api.get('/markers/nearby', {
    params: { latitude: lat, longitude: lng, radius }
  })
};

// User APIs
export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`)
};

export default api;