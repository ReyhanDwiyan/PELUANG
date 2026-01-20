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
    
    // STATE FORM DATA (Disesuaikan dengan Backend Baru)
    const [formData, setFormData] = useState({
        markerId: '',
        averageAge: '',
        populationDensity: '',
        studentPercentage: '0',
        workerPercentage: '0',
        familyPercentage: '0',
        averageIncome: '',
        averageRentalCost: '',
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

            if (markersRes.data.success) setMarkers(markersRes.data.data);
            if (spatialRes.data.success) setSpatialData(spatialRes.data.data);
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Gagal memuat data');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Validasi Total Persentase (Optional tapi bagus)
            const totalPct = parseFloat(formData.studentPercentage) + parseFloat(formData.workerPercentage) + parseFloat(formData.familyPercentage);
            if (totalPct > 100) {
                alert("Total persentase demografi tidak boleh lebih dari 100%");
                return;
            }

            const data = {
                markerId: formData.markerId,
                averageAge: parseFloat(formData.averageAge),
                populationDensity: parseFloat(formData.populationDensity),
                studentPercentage: parseFloat(formData.studentPercentage),
                workerPercentage: parseFloat(formData.workerPercentage),
                familyPercentage: parseFloat(formData.familyPercentage),
                averageIncome: parseFloat(formData.averageIncome),
                averageRentalCost: parseFloat(formData.averageRentalCost),
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
                handleCancel(); // Reset form
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
            markerId: data.markerId?._id || '',
            averageAge: data.averageAge.toString(),
            populationDensity: data.populationDensity.toString(),
            studentPercentage: (data.studentPercentage || 0).toString(),
            workerPercentage: (data.workerPercentage || 0).toString(),
            familyPercentage: (data.familyPercentage || 0).toString(),
            averageIncome: data.averageIncome.toString(),
            averageRentalCost: (data.averageRentalCost || 0).toString(),
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
            populationDensity: '',
            studentPercentage: '0',
            workerPercentage: '0',
            familyPercentage: '0',
            averageIncome: '',
            averageRentalCost: '',
            roadAccessibility: '3'
        });
    };

    const getAvailableMarkers = () => {
        const usedMarkerIds = spatialData
            .map(sd => sd.markerId && sd.markerId._id)
            .filter(Boolean);
        return markers
            .filter(m => m && (!usedMarkerIds.includes(m._id) || (editingData && m._id === formData.markerId)));
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    if (loading) return <div className="dashboard-container"><div className="loading">Loading...</div></div>;

    return (
        <div className="page-wrapper">
            <div className="page-container">
                <header className="page-header">
                    <h1 className="page-title">Admin Panel</h1>
                    <p className="page-subtitle">Kelola Data Spasial & Demografi Wilayah</p>
                </header>

                <div className="admin-actions">
                    <button className="btn btn-primary" onClick={() => setShowAddForm(true)} disabled={showAddForm}>
                        Tambah Data Wilayah
                    </button>
                </div>

                {showAddForm && (
                    <div className="admin-form-card">
                        <div className="form-header">
                            <h3>{editingData ? '✏️ Edit Data' : '➕ Tambah Data Wilayah'}</h3>
                            <button className="btn-close" onClick={handleCancel}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                {/* PILIH MARKER */}
                                <div className="form-group full-width">
                                    <label>Pilih Lokasi Marker *</label>
                                    <select name="markerId" value={formData.markerId} onChange={handleInputChange} required disabled={editingData !== null}>
                                        <option value="">-- Pilih Marker --</option>
                                        {getAvailableMarkers().map(marker => (
                                            <option key={marker._id} value={marker._id}>{marker.title}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* SECTION 1: DEMOGRAFI DASAR */}
                                <div className="form-section-label">1. Demografi Dasar</div>
                                <div className="form-group">
                                    <label>Kepadatan (Jiwa/km²)</label>
                                    <input type="number" name="populationDensity" value={formData.populationDensity} onChange={handleInputChange} required placeholder="Contoh: 5000" />
                                </div>
                                <div className="form-group">
                                    <label>Rata-rata Umur</label>
                                    <input type="number" name="averageAge" value={formData.averageAge} onChange={handleInputChange} required placeholder="Contoh: 30" step="0.1" />
                                </div>

                                {/* SECTION 2: TARGET PASAR (BARU) */}
                                <div className="form-section-label">2. Target Pasar (Total Max 100%)</div>
                                <div className="form-group">
                                    <label>% Mahasiswa</label>
                                    <input type="number" name="studentPercentage" value={formData.studentPercentage} onChange={handleInputChange} min="0" max="100" />
                                </div>
                                <div className="form-group">
                                    <label>% Karyawan</label>
                                    <input type="number" name="workerPercentage" value={formData.workerPercentage} onChange={handleInputChange} min="0" max="100" />
                                </div>
                                <div className="form-group">
                                    <label>% Keluarga</label>
                                    <input type="number" name="familyPercentage" value={formData.familyPercentage} onChange={handleInputChange} min="0" max="100" />
                                </div>

                                {/* SECTION 3: EKONOMI & AKSES */}
                                <div className="form-section-label">3. Ekonomi & Infrastruktur</div>
                                <div className="form-group">
                                    <label>Pendapatan Rata-rata (Bulan)</label>
                                    <input type="number" name="averageIncome" value={formData.averageIncome} onChange={handleInputChange} required placeholder="Rp 4.500.000" step="50000" />
                                </div>
                                <div className="form-group">
                                    <label>Biaya Sewa Lahan (Tahun)</label>
                                    <input type="number" name="averageRentalCost" value={formData.averageRentalCost} onChange={handleInputChange} required placeholder="Rp 25.000.000" step="100000" />
                                </div>
                                <div className="form-group">
                                    <label>Akses Jalan (1-5)</label>
                                    <select name="roadAccessibility" value={formData.roadAccessibility} onChange={handleInputChange} required>
                                        <option value="1">1 - Sangat Sulit (Gang)</option>
                                        <option value="2">2 - Sulit</option>
                                        <option value="3">3 - Sedang</option>
                                        <option value="4">4 - Mudah</option>
                                        <option value="5">5 - Sangat Mudah (Jalan Raya)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">{editingData ? 'Simpan Perubahan' : 'Simpan Data Baru'}</button>
                                <button type="button" className="btn btn-secondary" onClick={handleCancel}>Batal</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* TABLE DATA */}
                <div className="admin-table-card">
                    <h3>📊 Data Wilayah Terdaftar ({spatialData.length})</h3>
                    {spatialData.length === 0 ? <p className="empty-message">Belum ada data.</p> : (
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Lokasi</th>
                                        <th>Kepadatan</th>
                                        <th>Target Pasar</th>
                                        <th>Ekonomi (Income/Sewa)</th>
                                        <th>Akses</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {spatialData.map((data) => (
                                        <tr key={data._id}>
                                            <td>
                                                <strong>{data.markerId?.title || 'Unknown'}</strong><br/>
                                                <small>{data.markerId?.category}</small>
                                            </td>
                                            <td>{data.populationDensity.toLocaleString()} jiwa/km²<br/><small>Umur: {data.averageAge} thn</small></td>
                                            <td>
                                                <small>
                                                    🎓 Mhs: {data.studentPercentage}%<br/>
                                                    💼 Krj: {data.workerPercentage}%<br/>
                                                    🏠 Kel: {data.familyPercentage}%
                                                </small>
                                            </td>
                                            <td>
                                                <span style={{color: 'green'}}>{formatCurrency(data.averageIncome)}</span><br/>
                                                <small style={{color: 'red'}}>Sewa: {formatCurrency(data.averageRentalCost)}/thn</small>
                                            </td>
                                            <td>{'⭐'.repeat(data.roadAccessibility)}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="btn-edit" onClick={() => handleEdit(data)}>✏️</button>
                                                    <button className="btn-delete" onClick={() => handleDelete(data._id)}>🗑️</button>
                                                </div>
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

export default AdminPage;