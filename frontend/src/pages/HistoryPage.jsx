/* HistoryPage.jsx */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { requireAuth } from '../utils/auth';
import '../styles/Dashboard.css';

const HistoryPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        requireAuth(navigate);
    }, [navigate]);

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <header className="content-header">
                    <h1>Riwayat Analisis</h1>
                </header>
                <div className="content-section">
                    <div className="content-card">
                        <h2>Riwayat Analisis</h2>
                        <p>Belum ada riwayat analisis.</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HistoryPage;