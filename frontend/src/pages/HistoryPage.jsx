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
                    {loading ? <div style={{ padding: 20, textAlign: 'center' }}>Memuat...</div> :
                        history.length === 0 ? (
                            <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
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
                                                    <strong>{item.markerId?.title || 'Lokasi Hapus'}</strong><br />
                                                    <small style={{ color: '#888' }}>{item.markerId?.address}</small>
                                                </td>
                                                <td><span className="category-badge">{item.category}</span></td>
                                                <td>
                                                    <span style={{ fontWeight: 'bold', color: getScoreColor(item.finalScore) }}>
                                                        {item.finalScore}%
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-edit"
                                                        style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }}
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
                        <div className="popup-card" style={{ maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                            <div className="form-header">
                                <h3>Detail Analisis: {selectedItem.category.toUpperCase()}</h3>
                                <button className="btn-close" onClick={() => setSelectedItem(null)}>✕</button>
                            </div>

                            {/* SKOR FINAL */}
                            <div style={{ textAlign: 'center', margin: '20px 0' }}>
                                <div style={{ fontSize: '48px', fontWeight: '800', color: getScoreColor(selectedItem.finalScore) }}>
                                    {selectedItem.finalScore}%
                                </div>
                                <div className="potential-badge" style={{ backgroundColor: getScoreColor(selectedItem.finalScore) }}>
                                    {selectedItem.scoreCategory}
                                </div>
                            </div>

                            {/* 1. DATA MENTAH LOKASI */}
                            {selectedItem.breakdown?.rawData && (
                                <div style={{ marginBottom: 20, padding: 15, backgroundColor: '#1a1a2e', borderRadius: 8 }}>
                                    <h4 style={{ color: '#667eea', marginBottom: 10 }}>Data Lokasi</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '14px' }}>
                                        <div>
                                            <span style={{ color: '#888' }}>Kepadatan Penduduk:</span>
                                            <br /><strong>{selectedItem.breakdown.rawData.populationDensity?.toLocaleString() || '-'} jiwa/km²</strong>
                                        </div>
                                        <div>
                                            <span style={{ color: '#888' }}>Rata-rata Pendapatan:</span>
                                            <br /><strong>Rp {selectedItem.breakdown.rawData.averageIncome?.toLocaleString() || '-'}</strong>
                                        </div>
                                        <div>
                                            <span style={{ color: '#888' }}>Aksesibilitas Jalan:</span>
                                            <br /><strong>{selectedItem.breakdown.rawData.roadAccessibility || '-'}/5</strong>
                                        </div>
                                        <div>
                                            <span style={{ color: '#888' }}>Biaya Sewa Rata-rata:</span>
                                            <br /><strong>Rp {selectedItem.breakdown.rawData.averageRentalCost?.toLocaleString() || '-'}/bulan</strong>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 2. DEMOGRAFI PENDUDUK */}
                            {selectedItem.breakdown?.rawData && (
                                <div style={{ marginBottom: 20, padding: 15, backgroundColor: '#1a1a2e', borderRadius: 8 }}>
                                    <h4 style={{ color: '#f59e0b', marginBottom: 10 }}>Demografi Penduduk</h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                                                {selectedItem.breakdown.rawData.studentPercentage || 0}%
                                            </div>
                                            <div style={{ color: '#888', fontSize: '12px' }}>Mahasiswa</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                                                {selectedItem.breakdown.rawData.workerPercentage || 0}%
                                            </div>
                                            <div style={{ color: '#888', fontSize: '12px' }}>Pekerja</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
                                                {selectedItem.breakdown.rawData.familyPercentage || 0}%
                                            </div>
                                            <div style={{ color: '#888', fontSize: '12px' }}>Keluarga</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3. BREAKDOWN SKOR DASAR */}
                            <div style={{ marginBottom: 20 }}>
                                <h4 style={{ color: '#667eea', borderBottom: '1px solid #333', paddingBottom: 5 }}>
                                    Perhitungan Skor Dasar ({selectedItem.breakdown?.baseScore || 0} Poin)
                                </h4>
                                {selectedItem.breakdown?.baseDetails ? (
                                    <ul style={{ color: '#ccc', lineHeight: '1.8', fontSize: '14px' }}>
                                        <li>
                                            Skor Kepadatan: <strong>{selectedItem.breakdown.baseDetails.density} poin</strong>
                                            <br /><small style={{ color: '#888' }}>Bobot: 30% dari kepadatan penduduk</small>
                                        </li>
                                        <li>
                                            Skor Pendapatan: <strong>{selectedItem.breakdown.baseDetails.income} poin</strong>
                                            <br /><small style={{ color: '#888' }}>Bobot: 20% dari rata-rata pendapatan</small>
                                        </li>
                                        <li>
                                            Skor Aksesibilitas: <strong>{selectedItem.breakdown.baseDetails.road} poin</strong>
                                            <br /><small style={{ color: '#888' }}>Bobot: 10% dari aksesibilitas jalan</small>
                                        </li>
                                    </ul>
                                ) : (
                                    <p style={{ color: '#888' }}>Detail tidak tersedia</p>
                                )}
                            </div>

                            {/* 4. PENYESUAIAN KATEGORI BISNIS */}
                            {selectedItem.breakdown?.adjustments && selectedItem.breakdown.adjustments.length > 0 && (
                                <div style={{ marginBottom: 20 }}>
                                    <h4 style={{ color: '#10b981', borderBottom: '1px solid #333', paddingBottom: 5 }}>
                                        Penyesuaian Kategori Bisnis
                                    </h4>
                                    <ul style={{ color: '#ccc', lineHeight: '1.8', fontSize: '14px' }}>
                                        {selectedItem.breakdown.adjustments.map((adj, i) => (
                                            <li key={i} style={{ color: adj.val > 0 ? '#10b981' : '#ef4444' }}>
                                                {adj.val > 0 ? '' : ''} {adj.label}:
                                                <strong> {adj.val > 0 ? '+' : ''}{adj.val} poin</strong>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* 5. ANALISIS KOMPETITOR */}
                            <div style={{ marginBottom: 20 }}>
                                <h4 style={{ color: '#ef4444', borderBottom: '1px solid #333', paddingBottom: 5 }}>
                                    Analisis Kompetitor
                                </h4>
                                <ul style={{ color: '#ccc', lineHeight: '1.8', fontSize: '14px' }}>
                                    <li>
                                        Jumlah Kompetitor (radius 500m):
                                        <strong> {selectedItem.breakdown?.competitorDetails?.count || 0} lokasi</strong>
                                    </li>
                                    {selectedItem.breakdown?.competitorDetails?.count > 0 && (
                                        <li>
                                            Jarak Kompetitor Terdekat:
                                            <strong> {selectedItem.breakdown.competitorDetails.nearestDistance || 0}m</strong>
                                        </li>
                                    )}
                                    {selectedItem.breakdown?.competitorPenalty !== 0 && (
                                        <li style={{ color: '#ef4444' }}>
                                            Total Penalti Kompetitor:
                                            <strong> {selectedItem.breakdown.competitorPenalty} poin</strong>
                                        </li>
                                    )}
                                </ul>
                            </div>

                            {/* 6. PENYESUAIAN BIAYA SEWA */}
                            {selectedItem.breakdown?.rentAdjustment !== 0 && (
                                <div style={{ marginBottom: 20 }}>
                                    <h4 style={{ color: '#f59e0b', borderBottom: '1px solid #333', paddingBottom: 5 }}>
                                        Penyesuaian Biaya Sewa
                                    </h4>
                                    <p style={{ color: selectedItem.breakdown.rentAdjustment > 0 ? '#10b981' : '#ef4444' }}>
                                        {selectedItem.breakdown.rentAdjustment > 0 ? '' : ''}
                                        {' '}{selectedItem.breakdown.rentAdjustment > 0 ? '+' : ''}{selectedItem.breakdown.rentAdjustment} poin
                                        <br />
                                        <small style={{ color: '#888' }}>
                                            {selectedItem.breakdown.rentAdjustment > 0
                                                ? 'Biaya sewa terjangkau untuk potensi area ini'
                                                : 'Biaya sewa tinggi, margin keuntungan bisa tertekan'}
                                        </small>
                                    </p>
                                </div>
                            )}

                            {selectedItem.bestAlternative && (
                                <div style={{
                                    marginBottom: 20,
                                    padding: 20,
                                    backgroundColor: '#1a1a2e',
                                    borderRadius: 10,
                                    border: '2px solid #667eea',
                                    boxShadow: '0 4px 6px rgba(102, 126, 234, 0.3)'
                                }}>
                                    <h4 style={{ color: '#667eea', marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        Perbandingan: Bisnis Alternatif Terbaik
                                    </h4>

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: 15,
                                        marginBottom: 15
                                    }}>
                                        {/* Analisis User */}
                                        <div style={{
                                            padding: 15,
                                            backgroundColor: '#16213e',
                                            borderRadius: 8,
                                            borderLeft: `4px solid ${getScoreColor(selectedItem.finalScore)}`
                                        }}>
                                            <div style={{ fontSize: '12px', color: '#888', marginBottom: 5 }}>Pilihan Anda:</div>
                                            <div style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', color: '#fff', marginBottom: 8 }}>
                                                {selectedItem.category}
                                            </div>
                                            <div style={{ fontSize: '32px', fontWeight: '800', color: getScoreColor(selectedItem.finalScore) }}>
                                                {selectedItem.finalScore}%
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#888', marginTop: 5 }}>
                                                {selectedItem.scoreCategory}
                                            </div>
                                        </div>

                                        {/* Alternatif Terbaik */}
                                        <div style={{
                                            padding: 15,
                                            backgroundColor: '#16213e',
                                            borderRadius: 8,
                                            borderLeft: `4px solid ${getScoreColor(selectedItem.bestAlternative.finalScore)}`,
                                            position: 'relative'
                                        }}>
                                            {selectedItem.bestAlternative.finalScore > selectedItem.finalScore && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: -10,
                                                    right: 10,
                                                    backgroundColor: '#10b981',
                                                    color: '#fff',
                                                    padding: '4px 8px',
                                                    borderRadius: 4,
                                                    fontSize: '10px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    LEBIH POTENSIAL
                                                </div>
                                            )}
                                            <div style={{ fontSize: '12px', color: '#888', marginBottom: 5 }}>Alternatif Terbaik:</div>
                                            <div style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', color: '#fff', marginBottom: 8 }}>
                                                {selectedItem.bestAlternative.category}
                                            </div>
                                            <div style={{ fontSize: '32px', fontWeight: '800', color: getScoreColor(selectedItem.bestAlternative.finalScore) }}>
                                                {selectedItem.bestAlternative.finalScore}%
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#888', marginTop: 5 }}>
                                                {selectedItem.bestAlternative.scoreCategory}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Selisih Skor */}
                                    <div style={{
                                        padding: 12,
                                        backgroundColor: '#0f1729',
                                        borderRadius: 6,
                                        marginBottom: 15,
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '13px', color: '#888', marginBottom: 5 }}>Selisih Skor:</div>
                                        <div style={{
                                            fontSize: '24px',
                                            fontWeight: 'bold',
                                            color: selectedItem.bestAlternative.finalScore > selectedItem.finalScore ? '#10b981' :
                                                selectedItem.bestAlternative.finalScore < selectedItem.finalScore ? '#ef4444' : '#f59e0b'
                                        }}>
                                            {selectedItem.bestAlternative.finalScore > selectedItem.finalScore ? '+' : ''}
                                            {selectedItem.bestAlternative.finalScore - selectedItem.finalScore} poin
                                        </div>
                                    </div>

                                    {/* Asumsi yang Digunakan */}
                                    {selectedItem.bestAlternative.assumptions && selectedItem.bestAlternative.assumptions.length > 0 && (
                                        <div style={{
                                            padding: 12,
                                            backgroundColor: '#0f1729',
                                            borderRadius: 6,
                                            marginBottom: 10
                                        }}>
                                            <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 'bold', marginBottom: 8 }}>
                                                Asumsi Kondisi Optimal ({selectedItem.bestAlternative.category.toUpperCase()}):
                                            </div>
                                            <ul style={{
                                                margin: 0,
                                                paddingLeft: 20,
                                                fontSize: '12px',
                                                color: '#ccc',
                                                lineHeight: '1.6'
                                            }}>
                                                {selectedItem.bestAlternative.assumptions.map((assumption, idx) => (
                                                    <li key={idx}>{assumption}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Catatan */}
                                    <div style={{
                                        fontSize: '11px',
                                        color: '#888',
                                        fontStyle: 'italic',
                                        borderTop: '1px solid #2a2a3e',
                                        paddingTop: 10,
                                        marginTop: 10
                                    }}>
                                        <strong style={{ color: '#667eea' }}>Catatan:</strong> Skor alternatif dihitung menggunakan data lokasi yang sama dengan asumsi kondisi bisnis yang optimal. Hasil aktual dapat bervariasi tergantung implementasi riil.
                                    </div>
                                </div>
                            )}

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