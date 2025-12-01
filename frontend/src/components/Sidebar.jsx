import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { storage } from '../utils/auth';
import '../styles/Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = storage.getUser();
  const isAdmin = storage.isAdmin();

  const handleLogout = () => {
    if (window.confirm('Yakin ingin logout?')) {
      storage.removeUser();
      navigate('/login');
    }
  };

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/map', icon: '🗺️', label: 'Peta Interaktif' },
    { path: '/analysis', icon: '📈', label: 'Analisis Potensi' },
    { path: '/history', icon: '📜', label: 'Riwayat' }
  ];

  // Tambahkan menu Admin jika user adalah admin
  if (isAdmin) {
    menuItems.push({ path: '/admin', icon: '🔐', label: 'Admin Panel' });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="brand">PELUANG</h1>
        <p className="brand-subtitle">Analisis Potensi Usaha</p>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <p className="welcome-text">Welcome,</p>
          <p className="user-name">{user?.username || 'User'}</p>
          {isAdmin && <span className="admin-badge">👑 Admin</span>}
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;