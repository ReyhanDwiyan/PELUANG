import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-wrapper">
            <section className="landing-hero">
                <div className="hero-container">
                    <div className="hero-card">
                        <p className="hero-kicker">Platform Peluang & Produktivitas</p>
                        <h1 className="hero-title">Kerja Lebih Rapi. Cari Peluang Lebih Cepat.</h1>
                        <p className="hero-subtitle">
                            Atur marker, simpan data spasial, dan kolaborasi dalam satu dashboard modern.
                        </p>

                        <div className="hero-ctas">
                            <button className="btn-hero btn-primary" onClick={() => navigate('/register')}>
                                Mulai Sekarang
                            </button>
                            <button className="btn-hero btn-ghost" onClick={() => navigate('/login')}>
                                Lihat Demo
                            </button>
                        </div>

                        <div className="hero-meta">
                            <span>Rapi & konsisten</span>
                            <span>•</span>
                            <span>Responsif</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;