/* AnalysisPage.jsx */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { requireAuth } from '../utils/auth';
import '../styles/GlobalPages.css';

const AnalysisPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        requireAuth(navigate);
    }, [navigate]);

    return (
        <div className="page-wrapper">
            <div className="page-container">
                <header className="page-header">
                    <h1 className="page-title">Analisis Potensi</h1>
                    <p className="page-subtitle">Analisis data spasial dan potensi usaha</p>
                </header>

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Analisis Potensi Usaha</h2>
                    </div>
                    <div className="card-body">
                        <p>Fitur analisis akan tersedia segera.</p>
                        <button className="btn btn-primary" style={{ marginTop: '16px' }}>
                            Mulai Analisis Baru
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisPage;