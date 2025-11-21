/* AdminPage.jsx */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { requireAuth } from '../utils/auth';
import '../styles/Dashboard.css';

const AdminPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        requireAuth(navigate);
    }, [navigate]);

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <header className="content-header">
                    <h1>Admin Panel</h1>
                </header>
                <div className="content-section">
                    <div className="content-card">
                        <h2>Admin Panel</h2>
                        <p>Panel administrasi untuk mengelola data.</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminPage;