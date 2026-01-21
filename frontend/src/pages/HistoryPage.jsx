import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requireAuth } from '../utils/auth';
import { spatialDataAPI } from '../services/api';
import '../styles/GlobalPages.css';
import '../styles/AdminPage.css'; 

const HistoryPage = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        if (!requireAuth(navigate)) return;
        fetchHistory();
    }, [navigate]);

    const fetchHistory = async () => {
        try {
            const response = await spatialDataAPI.getHistory();
            if (response.data.success) setHistory(response.data.data);
        } catch (error) { console.error('Error:', error); }
        finally { setLoading(false); }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'var(--success)';
        if (score >= 60) return '#3b82f6'; 
        if (score >= 40) return 'var(--warning)';
        return 'var(--danger)';
    };

    return (
        <div className="page-wrapper">
            <div className="page-container">
                <header className="page-header">
                    <h1 className="page-title">Riwayat Analisis</h1>
                    <p className="page-subtitle">Daftar perhitungan potensi bisnis Anda</p>
                </header>

                <div className="admin-table-card">
                    {loading ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Memuat data...</div> :
                        history.length === 0 ? (
                            <div className="empty-state">
                                <p>Belum ada riwayat analisis.</p>
                                <button className="btn btn-primary" onClick={() => navigate('/map')}>
                                    Mulai Analisis Baru
                                </button>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Tanggal</th>
                                            <th>Lokasi</th>
                                            <th>Kategori Bisnis</th>
                                            <th>Skor Potensi</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((item) => (
                                            <tr key={item._id}>
                                                <td>{formatDate(item.analyzedAt)}</td>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{item.markerId?.title || 'Lokasi Terhapus'}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.markerId?.address}</div>
                                                </td>
                                                <td>
                                                    <span className="marker-category">{item.category}</span>
                                                </td>
                                                <td>
                                                    <span style={{ 
                                                        fontWeight: 800, 
                                                        color: getScoreColor(item.finalScore),
                                                        fontSize: '15px'
                                                    }}>
                                                        {item.finalScore}%
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn-edit"
                                                        title="Lihat Detail"
                                                        onClick={() => setSelectedItem(item)}
                                                        style={{ width: 'auto', padding: '6px 12px', gap: '6px' }}
                                                    >
                                                        <span>🔍</span> Detail
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                </div>

                {selectedItem && (
                    <div className="popup-overlay" onClick={() => setSelectedItem(null)}>
                        <div className="popup-card detail-modal" onClick={e => e.stopPropagation()}>
                            
                            <div className="detail-header">
                                <div>
                                    <h3 className="detail-title">{selectedItem.category.toUpperCase()}</h3>
                                    <p className="detail-subtitle">{selectedItem.markerId?.title} - {formatDate(selectedItem.analyzedAt)}</p>
                                </div>
                                <button className="btn-close" onClick={() => setSelectedItem(null)}>✕</button>
                            </div>

                            <div className="detail-content">
                                <div className="score-hero-section">
                                    <div className="score-circle" style={{ 
                                        borderColor: getScoreColor(selectedItem.finalScore),
                                        color: getScoreColor(selectedItem.finalScore)
                                    }}>
                                        <span className="score-number">{selectedItem.finalScore}</span>
                                        <span className="score-unit">%</span>
                                    </div>
                                    <div className="score-info">
                                        <h4 style={{ color: getScoreColor(selectedItem.finalScore) }}>
                                            {selectedItem.scoreCategory}
                                        </h4>
                                        <p>Skor potensi keberhasilan berdasarkan data lokasi.</p>
                                    </div>
                                </div>

                                {selectedItem.breakdown?.rawData && (
                                    <div className="detail-section">
                                        <h4 className="section-label">📊 Data Wilayah</h4>
                                        <div className="info-grid">
                                            <div className="info-card">
                                                <label>Kepadatan</label>
                                                <strong>{selectedItem.breakdown.rawData.populationDensity?.toLocaleString() || '-'}</strong>
                                                <small>jiwa/km²</small>
                                            </div>
                                            <div className="info-card">
                                                <label>Pendapatan Rata-rata</label>
                                                <strong style={{color: 'var(--success)'}}>Rp {selectedItem.breakdown.rawData.averageIncome?.toLocaleString() || '-'}</strong>
                                            </div>
                                            <div className="info-card">
                                                <label>Akses Jalan</label>
                                                <strong>{selectedItem.breakdown.rawData.roadAccessibility || '-'}/5</strong>
                                            </div>
                                            <div className="info-card">
                                                <label>Biaya Sewa</label>
                                                <strong>Rp {selectedItem.breakdown.rawData.averageRentalCost?.toLocaleString() || '-'}</strong>
                                                <small>/tahun</small>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedItem.breakdown?.rawData && (
                                    <div className="detail-section">
                                        <h4 className="section-label">👥 Target Demografi</h4>
                                        <div className="demographic-bar">
                                            <div className="demo-item">
                                                <div className="demo-value" style={{color: '#3b82f6'}}>{selectedItem.breakdown.rawData.studentPercentage}%</div>
                                                <div className="demo-label">Mahasiswa</div>
                                            </div>
                                            <div className="demo-divider"></div>
                                            <div className="demo-item">
                                                <div className="demo-value" style={{color: 'var(--success)'}}>{selectedItem.breakdown.rawData.workerPercentage}%</div>
                                                <div className="demo-label">Pekerja</div>
                                            </div>
                                            <div className="demo-divider"></div>
                                            <div className="demo-item">
                                                <div className="demo-value" style={{color: 'var(--danger)'}}>{selectedItem.breakdown.rawData.familyPercentage}%</div>
                                                <div className="demo-label">Keluarga</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {selectedItem.bestAlternative && (
                                    <div className="detail-section">
                                        <h4 className="section-label">💡 Analisis Perbandingan</h4>
                                        <div className="comparison-container">
                                            
                                            <div className="compare-card user-choice">
                                                <div className="compare-badge">Pilihan Anda</div>
                                                <h5>{selectedItem.category}</h5>
                                                <div className="compare-score" style={{color: getScoreColor(selectedItem.finalScore)}}>
                                                    {selectedItem.finalScore}%
                                                </div>
                                            </div>

                                            <div className="compare-vs">VS</div>

                                            <div className={`compare-card best-alt ${selectedItem.bestAlternative.finalScore > selectedItem.finalScore ? 'winner' : ''}`}>
                                                {selectedItem.bestAlternative.finalScore > selectedItem.finalScore && (
                                                    <div className="winner-badge">REKOMENDASI</div>
                                                )}
                                                <div className="compare-badge alt">Alternatif</div>
                                                <h5>{selectedItem.bestAlternative.category}</h5>
                                                <div className="compare-score" style={{color: getScoreColor(selectedItem.bestAlternative.finalScore)}}>
                                                    {selectedItem.bestAlternative.finalScore}%
                                                </div>
                                                <div className="compare-diff">
                                                    {selectedItem.bestAlternative.finalScore - selectedItem.finalScore > 0 ? '+' : ''}
                                                    {selectedItem.bestAlternative.finalScore - selectedItem.finalScore} poin
                                                </div>
                                            </div>
                                        </div>

                                        {selectedItem.bestAlternative.assumptions?.length > 0 && (
                                            <div className="assumption-box">
                                                <strong>ℹ️ Kenapa {selectedItem.bestAlternative.category} lebih baik?</strong>
                                                <ul>
                                                    {selectedItem.bestAlternative.assumptions.map((item, i) => (
                                                        <li key={i}>{item}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="detail-section">
                                    <h4 className="section-label">📝 Rincian Penilaian</h4>
                                    <div className="breakdown-list">
                                        <div className="breakdown-item">
                                            <span>Skor Dasar Wilayah</span>
                                            <strong>{selectedItem.breakdown?.baseScore}</strong>
                                        </div>
                                        {selectedItem.breakdown?.adjustments?.map((adj, i) => (
                                            <div className="breakdown-item" key={i}>
                                                <span>{adj.label}</span>
                                                <span className={adj.val > 0 ? 'text-success' : 'text-danger'}>
                                                    {adj.val > 0 ? '+' : ''}{adj.val}
                                                </span>
                                            </div>
                                        ))}
                                        {selectedItem.breakdown?.competitorPenalty !== 0 && (
                                            <div className="breakdown-item">
                                                <span>Kompetitor ({selectedItem.breakdown?.competitorDetails?.count || 0})</span>
                                                <span className="text-danger">{selectedItem.breakdown.competitorPenalty}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div> {/* End Detail Content */}

                            <div className="form-actions">
                                <button className="btn btn-secondary" onClick={() => setSelectedItem(null)} style={{width: '100%'}}>
                                    Tutup Detail
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryPage;