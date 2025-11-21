import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { storage } from '../utils/auth';
import '../styles/Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = storage.getUser();

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/map', icon: '🗺️', label: 'Peta Interaktif' },
    { path: '/analysis', icon: '📈', label: 'Analisis Potensi' },
    { path: '/history', icon: '📋', label: 'Riwayat Analisis' },
    { path: '/admin', icon: '⚙️', label: 'Admin Panel' }
  ];

  const handleLogout = () => {
    storage.removeUser();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="brand">PELUANG</h2>
        <p className="brand-subtitle">Analisis Spasial Usaha</p>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <p className="welcome-text">Selamat datang,</p>
          <p className="user-name">{user?.username || 'user'}</p>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          Keluar
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;