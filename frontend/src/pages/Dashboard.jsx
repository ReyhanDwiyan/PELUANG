import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import { markerAPI } from '../services/api';
import { requireAuth } from '../utils/auth';
import '../styles/Dashboard.css';

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
      // Load stats
      const statsResponse = await markerAPI.getStats();
      if (statsResponse.data.success) {
        const data = statsResponse.data.data;
        
        // Calculate average rating
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

      // Load recent markers
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
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
        <header className="content-header">
          <h1>Dashboard</h1>
        </header>

        <div className="content-section">
          {/* Stats Cards */}
          <div className="stats-grid">
            <StatCard 
              title="Total Analisis" 
              value={loading ? '...' : stats.total}
              color="#667eea"
            />
            <StatCard 
              title="Rata-rata Potensi" 
              value={loading ? '...' : stats.avgPotential}
              color="#10b981"
            />
            <StatCard 
              title="Status" 
              value="Aktif"
              color="#8b5cf6"
            />
          </div>

          {/* Recent Analysis */}
          <div className="content-card">
            <h2 className="card-title">Analisis Terbaru</h2>
            <div className="recent-list">
              {loading ? (
                <p className="empty-message">Loading...</p>
              ) : recentMarkers.length > 0 ? (
                recentMarkers.map((marker) => (
                  <div key={marker._id} className="recent-item">
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
      </main>
    </div>
  );
};

export default Dashboard;