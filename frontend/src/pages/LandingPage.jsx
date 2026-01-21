import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <main className="lp-root">
            <section className="lp-hero">
                <div className="lp-hero-bg" />

                <div className="lp-container">
                    <span className="lp-badge">
                        Platform Analisis Bisnis Modern
                    </span>

                    <h1 className="lp-title">
                        Kerja Lebih Rapi. <br />
                        <span className="lp-gradient-text">
                            Cari Peluang Lebih Cepat.
                        </span>
                    </h1>

                    <p className="lp-subtitle">
                        Atur marker, simpan data spasial, dan kolaborasi
                        dalam satu dashboard modern untuk analisis peluang usaha.
                    </p>

                    <div className="lp-actions">
                        <button
                            className="lp-btn lp-btn-primary"
                            onClick={() => navigate('/register')}
                        >
                            Mulai Gratis →
                        </button>

                        <button
                            className="lp-btn lp-btn-secondary"
                            onClick={() => navigate('/login')}
                        >
                            Lihat Demo
                        </button>
                    </div>

                    <div className="lp-meta">
                        <span>✓ Rapi & Konsisten</span>
                        <span>✓ Responsif</span>
                        <span>✓ Aman</span>
                    </div>
                </div>
            </section>

            <section className="lp-section">
                <div className="lp-container grid-3">
                    <div className="lp-card">
                        <h3>Pemetaan Spasial</h3>
                        <p>Visualisasi data lokasi dengan presisi tinggi dan UI intuitif.</p>
                    </div>
                    <div className="lp-card">
                        <h3>Analitik Real-time</h3>
                        <p>Pantau potensi wilayah dan performa usaha secara langsung.</p>
                    </div>
                    <div className="lp-card">
                        <h3>Keamanan Data</h3>
                        <p>Dirancang dengan standar keamanan modern dan terukur.</p>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default LandingPage;
