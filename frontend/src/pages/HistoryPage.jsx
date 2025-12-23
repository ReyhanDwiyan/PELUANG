/* HistoryPage.jsx */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { requireAuth } from '../utils/auth';
import '../styles/GlobalPages.css';

const HistoryPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        requireAuth(navigate);
    }, [navigate]);

    return (
        <div className="page-wrapper">
            <div className="page-container">
                <header className="page-header">
                    <h1 className="page-title">Riwayat</h1>
                    <p className="page-subtitle">Riwayat aktivitas dan analisis</p>
                </header>

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Riwayat Aktivitas</h2>
                    </div>
                    <div className="card-body">
                        <p className="empty-message">Belum ada riwayat aktivitas.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HistoryPage;