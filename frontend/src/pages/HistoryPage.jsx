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
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#3b82f6';
        if (score >= 40) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className="page-wrapper">
            <div className="page-container">
                <header className="page-header">
                    <h1 className="page-title">Riwayat Analisis</h1>
                    <p className="page-subtitle">Daftar perhitungan potensi bisnis Anda</p>
                </header>

                <div className="admin-table-card">
                    {loading ? <div style={{padding: 20, textAlign: 'center'}}>Memuat...</div> : 
                     history.length === 0 ? (
                        <div style={{padding: 40, textAlign: 'center', color: '#888'}}>
                            <p>Belum ada riwayat.</p>
                            <button className="btn btn-primary" onClick={() => navigate('/map')}>Mulai Analisis</button>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Tanggal</th>
                                        <th>Lokasi</th>
                                        <th>Bisnis</th>
                                        <th>Skor</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((item) => (
                                        <tr key={item._id}>
                                            <td>{formatDate(item.analyzedAt)}</td>
                                            <td>
                                                <strong>{item.markerId?.title || 'Lokasi Hapus'}</strong><br/>
                                                <small style={{color:'#888'}}>{item.markerId?.address}</small>
                                            </td>
                                            <td><span className="category-badge">{item.category}</span></td>
                                            <td>
                                                <span style={{fontWeight:'bold', color: getScoreColor(item.finalScore)}}>
                                                    {item.finalScore}%
                                                </span>
                                            </td>
                                            <td>
                                                <button 
                                                    className="btn btn-edit"
                                                    style={{width: 'auto', padding: '6px 12px', fontSize: '12px'}}
                                                    onClick={() => setSelectedItem(item)}
                                                >
                                                    🔍 Detail
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* POPUP DETAIL */}
                {selectedItem && (
                    <div className="popup-overlay" onClick={() => setSelectedItem(null)}>
                        <div className="popup-card" onClick={e => e.stopPropagation()}>
                            <div className="form-header">
                                <h3>Detail: {selectedItem.category.toUpperCase()}</h3>
                                <button className="btn-close" onClick={() => setSelectedItem(null)}>✕</button>
                            </div>
                            
                            <div style={{textAlign: 'center', margin: '20px 0'}}>
                                <div style={{fontSize: '48px', fontWeight: '800', color: getScoreColor(selectedItem.finalScore)}}>
                                    {selectedItem.finalScore}%
                                </div>
                                <div className="potential-badge" style={{backgroundColor: getScoreColor(selectedItem.finalScore)}}>
                                    {selectedItem.scoreCategory}
                                </div>
                            </div>

                            <div style={{marginBottom: 20}}>
                                <h4 style={{color: '#667eea', borderBottom: '1px solid #333', paddingBottom: 5}}>📊 Breakdown Nilai</h4>
                                <ul style={{color: '#ccc', lineHeight: '1.6'}}>
                                    <li>Skor Dasar Wilayah: <strong>{selectedItem.breakdown?.baseScore || '-'} Poin</strong></li>
                                    <li>Kecocokan Demografi: <strong>{selectedItem.breakdown?.demographicFit || '-'}</strong></li>
                                    {selectedItem.breakdown?.competitorPenalty < 0 && (
                                        <li style={{color: '#ef4444'}}>Penalti Kompetitor: <strong>{selectedItem.breakdown?.competitorPenalty} Poin</strong></li>
                                    )}
                                </ul>
                            </div>

                            <div>
                                <h4 style={{color: '#10b981', borderBottom: '1px solid #333', paddingBottom: 5}}>💡 Rekomendasi Bisnis</h4>
                                {selectedItem.recommendations && selectedItem.recommendations.length > 0 ? (
                                    <ul style={{color: '#ccc', lineHeight: '1.6'}}>
                                        {selectedItem.recommendations.map((rec, i) => (
                                            <li key={i} style={{marginBottom: 8}}>✅ {rec}</li>
                                        ))}
                                    </ul>
                                ) : <p style={{color:'#888'}}>Tidak ada rekomendasi khusus.</p>}
                            </div>

                            <div className="form-actions">
                                <button className="btn btn-secondary" onClick={() => setSelectedItem(null)}>Tutup</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryPage;