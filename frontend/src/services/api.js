import axios from 'axios';
import { storage } from '../utils/auth';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor untuk menambahkan user-id di header
api.interceptors.request.use((config) => {
  const userId = storage.getUserId();
  if (userId) {
    config.headers['user-id'] = userId;
  }
  return config;
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

// Spatial Data APIs (Admin only)
export const spatialDataAPI = {
  getAll: () => api.get('/spatial-data'),
  getByMarkerId: (markerId) => api.get(`/spatial-data/marker/${markerId}`),
  create: (data) => api.post('/spatial-data', data),
  update: (id, data) => api.put(`/spatial-data/${id}`, data),
  delete: (id) => api.delete(`/spatial-data/${id}`),
  getStatistics: () => api.get('/spatial-data/statistics')
};

export default api;