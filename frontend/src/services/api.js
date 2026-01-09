import axios from 'axios';
import { storage } from '../utils/auth';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true // PENTING: Untuk mengirim cookies
});

// Interceptor untuk menambahkan token/user-id di header
api.interceptors.request.use(
  (config) => {
    // 1. Coba ambil token dari localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // 2. Fallback: kirim user-id (backward compatibility)
    const userId = storage.getUserId();
    if (userId) {
      config.headers['user-id'] = userId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor untuk handle 401 (expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired atau invalid
      console.log('Token expired, logging out...');
      storage.removeUser();
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.get('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me')
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
  getStatistics: () => api.get('/spatial-data/statistics'),
  predict: (data) => api.post('/spatial-data/predict', data),
};

export const demographicAPI = {
  create: (data) => api.post('/demographic', data),
  getAll: () => api.get('/demographic'),
  getByMarkerId: (markerId) => api.get(`/demographic/marker/${markerId}`),
  update: (id, data) => api.put(`/demographic/${id}`, data),
  delete: (id) => api.delete(`/demographic/${id}`)
};

export const economicAPI = {
  create: (data) => api.post('/economic', data),
  getAll: () => api.get('/economic'),
  getByMarkerId: (markerId) => api.get(`/economic/marker/${markerId}`),
  update: (id, data) => api.put(`/economic/${id}`, data),
  delete: (id) => api.delete(`/economic/${id}`)
};

export const infrastructureAPI = {
  create: (data) => api.post('/infrastructure', data),
  getAll: () => api.get('/infrastructure'),
  getByMarkerId: (markerId) => api.get(`/infrastructure/marker/${markerId}`),
  update: (id, data) => api.put(`/infrastructure/${id}`, data),
  delete: (id) => api.delete(`/infrastructure/${id}`)
};

// Untuk data gabungan
export const combinedDataAPI = {
  getAll: () => api.get('/spatial-data/combined'),
  getByMarkerId: (markerId) => api.get(`/spatial-data/combined/marker/${markerId}`)
};

export default api;