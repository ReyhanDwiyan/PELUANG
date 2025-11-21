/* MapPage.jsx */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { requireAuth } from '../utils/auth';
import '../styles/Dashboard.css';

const MapPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        requireAuth(navigate);
    }, [navigate]);

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <header className="content-header">
                    <h1>Peta Interaktif</h1>
                </header>
                <div className="content-section">
                    <div className="content-card">
                        <h2>Peta dengan Leaflet</h2>
                        <p>Fitur peta interaktif akan segera hadir...</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MapPage;