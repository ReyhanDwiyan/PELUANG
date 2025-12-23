import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { markerAPI } from '../services/api';
import { requireAuth } from '../utils/auth';
import '../styles/GlobalPages.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    avgPotential: 0
  });
  const [recentMarkers, setRecentMarkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requireAuth(navigate)) return;
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      const statsResponse = await markerAPI.getStats();
      if (statsResponse.data.success) {
        const data = statsResponse.data.data;

        let totalRating = 0;
        data.byCategory.forEach(cat => {
          totalRating += cat.avgRating || 0;
        });
        const avgRating = data.byCategory.length > 0
          ? (totalRating / data.byCategory.length).toFixed(1)
          : 0;

        setStats({
          total: data.total,
          avgPotential: avgRating
        });
      }

      const markersResponse = await markerAPI.getAll({ limit: 5 });
      if (markersResponse.data.success) {
        setRecentMarkers(markersResponse.data.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <header className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Ringkasan data dan aktivitas terbaru</p>
        </header>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <h3>Total Analisis</h3>
            </div>
            <div className="stat-value" style={{ color: '#667eea' }}>
              {loading ? '...' : stats.total}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <h3>Rata-rata Potensi</h3>
            </div>
            <div className="stat-value" style={{ color: '#10b981' }}>
              {loading ? '...' : stats.avgPotential}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <h3>Status</h3>
            </div>
            <div className="stat-value" style={{ color: '#8b5cf6' }}>
              Aktif
            </div>
          </div>
        </div>

        {/* Recent Analysis */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Analisis Terbaru</h2>
          </div>
          <div className="card-body">
            {loading ? (
              <p className="empty-message">Loading...</p>
            ) : recentMarkers.length > 0 ? (
              recentMarkers.map((marker) => (
                <div key={marker._id} className="list-item">
                  <h4>{marker.title}</h4>
                  <p>{marker.description || 'Tidak ada deskripsi'}</p>
                  <small>{formatDate(marker.createdAt)}</small>
                </div>
              ))
            ) : (
              <p className="empty-message">
                Belum ada analisis. Mulai analisis sekarang!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;