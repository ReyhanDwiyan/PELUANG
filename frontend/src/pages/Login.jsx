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
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      
      // Server kita mengirim { success: true, data: { ... } }
      if (response.data.success) { 
        // Simpan data user (ID, username, role, dsb.) ke Local Storage
        storage.setUser(response.data.data); 
        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Login gagal.');
      }
      
    } catch (error) {
      // Axios error.response.data adalah body respons 401/400 dari backend
      setError(error.response?.data?.message || 'Login gagal. Periksa kredensial/koneksi Anda.');
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