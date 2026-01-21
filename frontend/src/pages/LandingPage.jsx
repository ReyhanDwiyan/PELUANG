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
                    </div>
                </div>
            </section>
        </main>
    );
};

export default LandingPage;
