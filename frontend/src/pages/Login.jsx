import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { storage } from '../utils/auth';
import '../styles/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (storage.isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', formData.email);

      const response = await authAPI.login({
        email: formData.email,
        password: formData.password
      });

      console.log('Login response:', response.data);

      if (response.data.success) {
        const { data: userData, token } = response.data;

        // 1. Simpan user data ke localStorage
        storage.setUser(userData);

        // 2. Simpan token ke localStorage
        if (token) {
          localStorage.setItem('token', token);
          console.log('Token saved:', token.substring(0, 20) + '...');
        }

        console.log('Login successful, user data:', userData);

        alert('Login berhasil!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);

      if (error.response) {
        console.error('Error response:', error.response.data);
        setError(error.response.data.message || 'Login gagal');
      } else if (error.request) {
        console.error('No response from server');
        setError('Tidak dapat terhubung ke server. Pastikan backend berjalan.');
      } else {
        console.error('Error:', error.message);
        setError('Terjadi kesalahan: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>PELUANG</h1>
          <p>Analisis Spasial Usaha</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Masukkan email Anda"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Masukkan password Anda"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Loading...' : 'Login'}
          </button>

          <div className="auth-footer">
            <p>
              Belum punya akun? <a href="/register">Daftar di sini</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;