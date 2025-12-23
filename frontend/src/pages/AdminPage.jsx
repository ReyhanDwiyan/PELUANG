/* AdminPage.jsx */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requireAdmin } from '../utils/auth';
import { markerAPI, spatialDataAPI } from '../services/api';
import '../styles/GlobalPages.css';
import '../styles/AdminPage.css';

const AdminPage = () => {
    const navigate = useNavigate();
    const [markers, setMarkers] = useState([]);
    const [spatialData, setSpatialData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingData, setEditingData] = useState(null);
    const [formData, setFormData] = useState({
        markerId: '',
        averageAge: '',
        averageIncome: '',
        populationDensity: '',
        roadAccessibility: '3'
    });

    useEffect(() => {
        if (!requireAdmin(navigate)) return;
        loadData();
    }, [navigate]);

    const loadData = async () => {
        try {
            const [markersRes, spatialRes] = await Promise.all([
                markerAPI.getAll(),
                spatialDataAPI.getAll()
            ]);

            if (markersRes.data.success) {
                setMarkers(markersRes.data.data);
            }

            if (spatialRes.data.success) {
                setSpatialData(spatialRes.data.data);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Gagal memuat data');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const data = {
                markerId: formData.markerId,
                averageAge: parseFloat(formData.averageAge),
                averageIncome: parseFloat(formData.averageIncome),
                populationDensity: parseFloat(formData.populationDensity),
                roadAccessibility: parseInt(formData.roadAccessibility)
            };

            let response;
            if (editingData) {
                response = await spatialDataAPI.update(editingData._id, data);
            } else {
                response = await spatialDataAPI.create(data);
            }

            if (response.data.success) {
                alert(editingData ? 'Data berhasil diupdate!' : 'Data berhasil ditambahkan!');
                setShowAddForm(false);
                setEditingData(null);
                setFormData({
                    markerId: '',
                    averageAge: '',
                    averageIncome: '',
                    populationDensity: '',
                    roadAccessibility: '3'
                });
                loadData();
            }
        } catch (error) {
            console.error('Error saving data:', error);
            alert(error.response?.data?.message || 'Gagal menyimpan data');
        }
    };

    const handleEdit = (data) => {
        setEditingData(data);
        setFormData({
            markerId: data.markerId._id,
            averageAge: data.averageAge.toString(),
            averageIncome: data.averageIncome.toString(),
            populationDensity: data.populationDensity.toString(),
            roadAccessibility: data.roadAccessibility.toString()
        });
        setShowAddForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus data spasial ini?')) return;

        try {
            const response = await spatialDataAPI.delete(id);
            if (response.data.success) {
                alert('Data berhasil dihapus!');
                loadData();
            }
        } catch (error) {
            console.error('Error deleting data:', error);
            alert('Gagal menghapus data');
        }
    };

    const handleCancel = () => {
        setShowAddForm(false);
        setEditingData(null);
        setFormData({
            markerId: '',
            averageAge: '',
            averageIncome: '',
            populationDensity: '',
            roadAccessibility: '3'
        });
    };

    const getAvailableMarkers = () => {
        const usedMarkerIds = spatialData.map(sd => sd.markerId._id);
        return markers.filter(m => !usedMarkerIds.includes(m._id) || (editingData && m._id === formData.markerId));
    };

    const getPotentialCategory = (score) => {
        if (score >= 75) return { label: 'Sangat Tinggi', color: '#10b981' };
        if (score >= 60) return { label: 'Tinggi', color: '#3b82f6' };
        if (score >= 40) return { label: 'Sedang', color: '#f59e0b' };
        return { label: 'Rendah', color: '#ef4444' };
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading">Loading...</div>
            </div>
        );
    }

    return (
        <div className="page-wrapper">
            <div className="page-container">
                <header className="page-header">
                    <h1 className="page-title">Admin Panel</h1>
                    <p className="page-subtitle">Kelola data marker dan spatial</p>
                </header>

                <div className="admin-actions">
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowAddForm(true)}
                        disabled={showAddForm}
                    >
                        ➕ Tambah Data Spasial
                    </button>
                </div>

                {/* Form Add/Edit */}
                {showAddForm && (
                    <div className="admin-form-card">
                        <div className="form-header">
                            <h3>{editingData ? '✏️ Edit Data Spasial' : '➕ Tambah Data Spasial Baru'}</h3>
                            <button className="btn-close" onClick={handleCancel}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Pilih Lokasi/Marker *</label>
                                    <select
                                        name="markerId"
                                        value={formData.markerId}
                                        onChange={handleInputChange}
                                        required
                                        disabled={editingData !== null}
                                    >
                                        <option value="">-- Pilih Marker --</option>
                                        {getAvailableMarkers().map(marker => (
                                            <option key={marker._id} value={marker._id}>
                                                {marker.title} ({marker.category})
                                            </option>
                                        ))}
                                    </select>
                                    {editingData && (
                                        <small className="form-hint">Marker tidak dapat diubah saat edit</small>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Rata-rata Umur Penduduk *</label>
                                    <input
                                        type="number"
                                        name="averageAge"
                                        value={formData.averageAge}
                                        onChange={handleInputChange}
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        placeholder="Contoh: 35.5"
                                        required
                                    />
                                    <small className="form-hint">Dalam tahun (0-100)</small>
                                </div>

                                <div className="form-group">
                                    <label>Rata-rata Penghasilan *</label>
                                    <input
                                        type="number"
                                        name="averageIncome"
                                        value={formData.averageIncome}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="100000"
                                        placeholder="Contoh: 5000000"
                                        required
                                    />
                                    <small className="form-hint">Dalam Rupiah per bulan</small>
                                </div>

                                <div className="form-group">
                                    <label>Kepadatan Penduduk *</label>
                                    <input
                                        type="number"
                                        name="populationDensity"
                                        value={formData.populationDensity}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="100"
                                        placeholder="Contoh: 5000"
                                        required
                                    />
                                    <small className="form-hint">Jiwa per km²</small>
                                </div>

                                <div className="form-group">
                                    <label>Aksesibilitas Jalan Raya *</label>
                                    <select
                                        name="roadAccessibility"
                                        value={formData.roadAccessibility}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="1">1 - Sangat Sulit</option>
                                        <option value="2">2 - Sulit</option>
                                        <option value="3">3 - Sedang</option>
                                        <option value="4">4 - Mudah</option>
                                        <option value="5">5 - Sangat Mudah</option>
                                    </select>
                                    <small className="form-hint">Tingkat kemudahan akses ke jalan utama</small>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">
                                    {editingData ? '💾 Update Data' : '➕ Simpan Data'}
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                                    ❌ Batal
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Data Table */}
                <div className="admin-table-card">
                    <h3>📊 Data Spasial & Skor Potensi ({spatialData.length})</h3>

                    {spatialData.length === 0 ? (
                        <p className="empty-message">Belum ada data spasial. Tambahkan data pertama!</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Lokasi</th>
                                        <th>Kategori</th>
                                        <th>Rata-rata Umur</th>
                                        <th>Rata-rata Penghasilan</th>
                                        <th>Kepadatan Penduduk</th>
                                        <th>Akses Jalan</th>
                                        <th>Skor Potensi</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {spatialData.map((data) => {
                                        const potential = getPotentialCategory(data.potentialScore);
                                        return (
                                            <tr key={data._id}>
                                                <td>
                                                    <strong>{data.markerId.title}</strong>
                                                    <br />
                                                    <small>{data.markerId.address || 'No address'}</small>
                                                </td>
                                                <td>
                                                    <span className="category-badge">
                                                        {data.markerId.category}
                                                    </span>
                                                </td>
                                                <td>{data.averageAge} tahun</td>
                                                <td>{formatCurrency(data.averageIncome)}</td>
                                                <td>{data.populationDensity.toLocaleString()} jiwa/km²</td>
                                                <td>
                                                    <div className="access-rating">
                                                        {'⭐'.repeat(data.roadAccessibility)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span
                                                        className="potential-badge"
                                                        style={{ backgroundColor: potential.color }}
                                                    >
                                                        {data.potentialScore} - {potential.label}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="btn-edit"
                                                            onClick={() => handleEdit(data)}
                                                            title="Edit"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            className="btn-delete"
                                                            onClick={() => handleDelete(data._id)}
                                                            title="Hapus"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Info Panel */}
                <div className="info-panel">
                    <div className="info-card">
                        <h4>ℹ️ Cara Kerja Perhitungan Skor Potensi</h4>
                        <ul>
                            <li><strong>Umur Rata-rata (25%)</strong>: Semakin muda, semakin potensial</li>
                            <li><strong>Penghasilan Rata-rata (25%)</strong>: Semakin tinggi, semakin potensial</li>
                            <li><strong>Kepadatan Penduduk (25%)</strong>: Semakin padat, semakin potensial</li>
                            <li><strong>Aksesibilitas Jalan (25%)</strong>: Semakin mudah diakses, semakin potensial</li>
                        </ul>
                        <p><strong>Total Skor: 0-100</strong></p>
                        <ul>
                            <li>🟢 75-100: Sangat Tinggi</li>
                            <li>🔵 60-74: Tinggi</li>
                            <li>🟡 40-59: Sedang</li>
                            <li>🔴 0-39: Rendah</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;