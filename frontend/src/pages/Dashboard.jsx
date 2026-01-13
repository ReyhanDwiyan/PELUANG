import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { spatialDataAPI } from '../services/api'; // Gunakan spatialDataAPI
import { requireAuth } from '../utils/auth';
import '../styles/GlobalPages.css';
import '../styles/Dashboard.css'; // Pastikan file CSS ini ada

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    avgPotential: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requireAuth(navigate)) return;
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      // 1. Ambil Statistik Angka (Total & Rata-rata)
      const statsRes = await spatialDataAPI.getUserStats();
      if (statsRes.data.success) {
        setStats({
          total: statsRes.data.data.totalAnalysis,
          avgPotential: statsRes.data.data.averagePotential
        });
      }

      // 2. Ambil Riwayat Terbaru (Top 5) untuk List Bawah
      const historyRes = await spatialDataAPI.getHistory();
      if (historyRes.data.success) {
        // Ambil 5 data pertama saja
        setRecentActivity(historyRes.data.data.slice(0, 5));
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
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getScoreColor = (score) => {
    if (score >= 75) return '#10b981'; // Hijau
    if (score >= 60) return '#3b82f6'; // Biru
    if (score >= 40) return '#f59e0b'; // Kuning
    return '#ef4444'; // Merah
  };

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <header className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Ringkasan aktivitas analisis bisnis Anda</p>
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
            <small className="stat-desc">Kali dilakukan</small>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <h3>Rata-rata Potensi</h3>
            </div>
            <div className="stat-value" style={{ color: getScoreColor(stats.avgPotential) }}>
              {loading ? '...' : `${stats.avgPotential}%`}
            </div>
            <small className="stat-desc">Skor keberhasilan rata-rata</small>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <h3>Status Akun</h3>
            </div>
            <div className="stat-value" style={{ color: '#8b5cf6' }}>
              Aktif
            </div>
            <small className="stat-desc">Member Regular</small>
          </div>
        </div>

        {/* Recent Analysis List */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Analisis Terbaru</h2>
            <button className="btn-link" onClick={() => navigate('/history')} style={{
                    background: '#009b97', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', marginTop: '10px'}}>Lihat Semua</button>
          </div>
          <div className="card-body">
            {loading ? (
              <p className="empty-message">Memuat data...</p>
            ) : recentActivity.length > 0 ? (
              <div className="activity-list">
                {recentActivity.map((item) => (
                  <div key={item._id} className="activity-item" style={{borderBottom: '1px solid #f3f4f6', padding: '12px 0'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div>
                        <h4 style={{margin: '0 0 4px 0', color: '#1f2937'}}>
                          {item.category.charAt(0).toUpperCase() + item.category.slice(1)} 
                          <span style={{fontWeight: 'normal', color: '#6b7280'}}> di </span>
                          {item.markerId?.title || 'Lokasi Terhapus'}
                        </h4>
                        <small style={{color: '#9ca3af'}}>{formatDate(item.analyzedAt)}</small>
                      </div>
                      <div className="score-badge" style={{
                        background: getScoreColor(item.finalScore),
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        fontSize: '0.85rem'
                      }}>
                        {item.finalScore}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{textAlign: 'center', padding: '20px'}}>
                <p>Belum ada aktivitas analisis.</p>
                <button 
                  style={{
                    background: '#009b97', color: 'white', border: 'none', 
                    padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', marginTop: '10px'
                  }}
                  onClick={() => navigate('/map')}
                >
                  Mulai Analisis Pertama
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;