import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requireAuth } from '../utils/auth';
import { spatialDataAPI } from '../services/api'; // Import API
import '../styles/GlobalPages.css';
import '../styles/AdminPage.css'; // Kita pinjam style tabel dari AdminPage agar konsisten

const HistoryPage = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!requireAuth(navigate)) return;
        fetchHistory();
    }, [navigate]);

    const fetchHistory = async () => {
        try {
            const response = await spatialDataAPI.getHistory();
            if (response.data.success) {
                setHistory(response.data.data);
            }
        } catch (error) {
            console.error('Gagal mengambil history:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    // Helper untuk warna badge skor
    const getScoreColor = (category) => {
        if (category.includes('Sangat Tinggi')) return '#10b981'; // Hijau
        if (category.includes('Tinggi')) return '#3b82f6'; // Biru
        if (category.includes('Sedang')) return '#f59e0b'; // Kuning
        return '#ef4444'; // Merah
    };

    return (
        <div className="page-wrapper">
            <div className="page-container">
                <header className="page-header">
                    <h1 className="page-title">Riwayat Analisis</h1>
                    <p className="page-subtitle">Daftar perhitungan potensi bisnis yang pernah Anda lakukan</p>
                </header>

                <div className="admin-table-card">
                    {loading ? (
                        <div style={{padding: '20px', textAlign: 'center'}}>Memuat data...</div>
                    ) : history.length === 0 ? (
                        <div style={{padding: '40px', textAlign: 'center', color: '#6b7280'}}>
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
                                        <th>Lokasi Target</th>
                                        <th>Bisnis</th>
                                        <th>Skor Potensi</th>
                                        <th>Kesimpulan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((item) => (
                                        <tr key={item._id}>
                                            <td>{formatDate(item.analyzedAt)}</td>
                                            <td>
                                                <strong>{item.markerId?.title || 'Lokasi Terhapus'}</strong>
                                                <br/>
                                                <small style={{color: '#6b7280'}}>{item.markerId?.address}</small>
                                            </td>
                                            <td>
                                                <span className="category-badge">{item.category}</span>
                                            </td>
                                            <td>
                                                <span style={{fontWeight: 'bold', fontSize: '1.1em'}}>
                                                    {item.finalScore}%
                                                </span>
                                            </td>
                                            <td>
                                                <span 
                                                    className="potential-badge"
                                                    style={{backgroundColor: getScoreColor(item.scoreCategory)}}
                                                >
                                                    {item.scoreCategory}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryPage;