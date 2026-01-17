import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { markerAPI, spatialDataAPI } from '../services/api';
import { requireAuth, storage } from '../utils/auth';
import 'leaflet/dist/leaflet.css';
import '../styles/MapPage.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const BANDUNG_BOUNDS = [
  [-6.9050, 107.5470],
  [-6.8460, 107.6070]
];

function LocationMarker({ onAddMarker, showMarker }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      const [southwest, northeast] = BANDUNG_BOUNDS;
      const isInBounds =
        lat >= southwest[0] &&
        lat <= northeast[0] &&
        lng >= southwest[1] &&
        lng <= northeast[1];

      if (!isInBounds) {
        alert('Lokasi harus berada di dalam area yang ditentukan!');
        return;
      }

      setPosition(e.latlng);
      onAddMarker(e.latlng);
    }
  });

  return showMarker && position ? (
    <Marker position={position}>
      <Popup>Lokasi baru dipilih</Popup>
    </Marker>
  ) : null;
}

const MapPage = () => {
  const navigate = useNavigate();
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // STATE UTAMA
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '', // Default kosong
    address: '',
    rating: 0
  });

  const [popup, setPopup] = useState({ show: false, lat: null, lng: null });
  const [result, setResult] = useState(null);

  // Ambil role user dari storage
  const user = storage.getUser();
  const isAdmin = user && user.role === 'admin';

  useEffect(() => {
    if (!requireAuth(navigate)) return;
    loadMarkers();
  }, [navigate]);

  const loadMarkers = async () => {
    try {
      const response = await markerAPI.getAll();
      if (response.data.success) {
        setMarkers(response.data.data);
      }
    } catch (error) {
      console.error('Error loading markers:', error);
    } finally {
      setLoading(false);
    }
  };

  // FUNGSI RESET FORM (Dipanggil saat Buka/Tutup/Simpan)
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      address: '',
      rating: 0
    });
  };

  const handleMapClick = (latlng) => {
    resetForm(); // Reset saat klik peta
    setSelectedLocation(latlng);

    if (isAdmin) setShowAddForm(true);
    // Untuk user biasa, hanya tampilkan popup analisis potensi
    if (!isAdmin) setPopup({ show: true, lat: latlng.lat, lng: latlng.lng });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedLocation) {
      alert('Pilih lokasi di peta terlebih dahulu!');
      return;
    }

    try {
      const markerData = {
        ...formData,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        rating: parseFloat(formData.rating) || 0
      };

      const response = await markerAPI.create(markerData);

      if (response.data.success) {
        alert('Marker berhasil ditambahkan!');
        setShowAddForm(false);
        resetForm(); // Reset setelah simpan
        setSelectedLocation(null);
        loadMarkers();
      }
    } catch (error) {
      console.error('Error creating marker:', error);
      alert('Gagal menambahkan marker');
    }
  };

  const handleDeleteMarker = async (id) => {
    if (!window.confirm('Hapus marker ini?')) return;

    try {
      const response = await markerAPI.delete(id);
      if (response.data.success) {
        alert('Marker berhasil dihapus!');
        loadMarkers();
      }
    } catch (error) {
      console.error('Error deleting marker:', error);
      alert('Gagal menghapus marker');
    }
  };

  const handleClose = () => {
    setPopup({ show: false, lat: null, lng: null });
    setResult(null);
    resetForm(); // Reset saat user biasa menutup popup
  };

  const handleAnalyzeSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    try {
      const res = await spatialDataAPI.predict({
        latitude: popup.lat,
        longitude: popup.lng,
        ...formData
      });
      setResult(res.data);

      // --- TAMBAHKAN BAGIAN INI ---
      if (res.data.success) {
        setPopup({ show: false, lat: null, lng: null });
      }
      // ----------------------------

    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Gagal prediksi' });
    }
  };
  // Center: Kampus ULBI Bandung
  const ulbiCenter = [-6.8755, 107.5772];

  return (
    <div className="map-container">
      <main className="map-content">
        <header className="content-header">
          <h1>Peta Interaktif - Area ULBI Bandung</h1>
          <p className="subtitle">Klik pada peta untuk {isAdmin ? 'menambahkan marker baru' : 'analisis potensi usaha'} (area sekitar kampus ULBI)</p>
        </header>

        <div className="map-section">
          <div className="map-container">
            {loading ? (
              <div className="loading">Loading map...</div>
            ) : (
              <MapContainer
                center={ulbiCenter}
                zoom={14}
                minZoom={13}
                maxZoom={18}
                maxBounds={BANDUNG_BOUNDS}
                maxBoundsViscosity={1.0}
                style={{ height: '600px', width: '100%', borderRadius: '12px' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Existing Markers */}
                {markers.map((marker) => (
                  <Marker
                    key={marker._id}
                    position={[marker.latitude, marker.longitude]}
                  >
                    <Popup>
                      <div className="marker-popup">
                        <h3>{marker.title}</h3>
                        <p className="marker-category">{marker.category}</p>
                        {marker.description && <p>{marker.description}</p>}
                        {marker.address && <p className="marker-address">📍 {marker.address}</p>}
                        {marker.rating > 0 && <p className="marker-rating">⭐ {marker.rating}</p>}
                        {isAdmin && (
                          <button
                            className="btn-delete-marker"
                            onClick={() => handleDeleteMarker(marker._id)}
                          >
                            🗑️ Hapus
                          </button>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Marker biru saat klik map */}
                <LocationMarker onAddMarker={handleMapClick} showMarker={true} />
              </MapContainer>
            )}
          </div>

          {/* Add Marker Form - hanya untuk admin */}
          {isAdmin && showAddForm && (
            <div className="add-marker-form">
              <div className="form-header">
                <h3>Tambah Marker Baru</h3>
                <button
                  className="btn-close"
                  onClick={() => {
                    setShowAddForm(false);
                    setSelectedLocation(null);
                    resetForm(); // RESET DITAMBAHKAN DI SINI
                  }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} autoComplete="off">
                <div className="form-group">
                  <label>Lokasi</label>
                  <input
                    type="text"
                    value={selectedLocation ? `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}` : ''}
                    readOnly
                    className="location-input"
                  />
                </div>

                <div className="form-group">
                  <label>Nama Lokasi *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Contoh: Warung Makan Sederhana"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Kategori *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="custom-select"
                  >
                    <option value="" disabled>-- Pilih Kategori Bisnis --</option>
                    <option value="restoran">Restoran</option>
                    <option value="warung">Warung</option>
                    <option value="laundry">Laundry</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Deskripsi</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Deskripsi singkat tentang lokasi ini..."
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Alamat</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Alamat lengkap"
                  />
                </div>

                <div className="form-group">
                  <label>Rating (0-5)</label>
                  <input
                    type="number"
                    name="rating"
                    value={formData.rating}
                    onChange={handleInputChange}
                    min="0"
                    max="5"
                    step="0.1"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Simpan Marker
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAddForm(false);
                      setSelectedLocation(null);
                      resetForm(); // RESET DITAMBAHKAN DI SINI
                    }}
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Popup Analisis Potensi - hanya untuk user biasa */}
          {!isAdmin && popup.show && (
            <div className="popup-card">
              <button className="btn-close" onClick={handleClose}>✕</button>
              <h3>Analisis Potensi Bisnis</h3>
              {/* Tambahkan autoComplete="off" */}
              <form onSubmit={handleAnalyzeSubmit} autoComplete="off">
                <div className="form-group">
                  <label>Latitude</label>
                  <input type="number" value={popup.lat} disabled />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input type="number" value={popup.lng} disabled />
                </div>

                <div className="form-group">
                  <label>Kategori Bisnis</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="custom-select"
                  >
                    <option value="" disabled>-- Pilih Kategori Bisnis --</option>
                    <option value="restoran">Restoran</option>
                    <option value="warung">Warung</option>
                    <option value="laundry">Laundry</option>
                  </select>
                </div>

                {formData.category === 'restoran' && (
                  <div className="extra-fields-section">
                    <h4 style={{ fontSize: '14px', margin: '0 0 10px 0', color: '#36d6ff' }}>Detail Restoran</h4>
                    <div className="form-group">
                      <label>Menu Andalan</label>
                      <input
                        type="text"
                        name="signatureMenu"
                        placeholder="Contoh: Nasi Goreng Spesial"
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Harga Menu (Rp)</label>
                      <input
                        type="number"
                        name="menuPrice"
                        placeholder="Contoh: 25000"
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Jenis Menu</label>
                      <select name="menuCategory" onChange={handleInputChange} required className="custom-select">
                        <option value="">-- Pilih Jenis --</option>
                        <option value="makanan_berat">Makanan Berat</option>
                        <option value="minuman">Minuman</option>
                        <option value="snack">Cemilan</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Luas Parkir (m²)</label>
                      <input
                        type="number"
                        name="parkingAreaSize"
                        placeholder="Contoh: 50"
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ marginBottom: '8px', display: 'block' }}>Lokasi Strategis:</label>
                      <div className="checkbox-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', fontWeight: 'normal' }}>
                          <input
                            type="checkbox"
                            name="isNearCampus"
                            checked={formData.isNearCampus || false}
                            onChange={handleInputChange}
                            style={{ marginRight: '8px' }}
                          /> Dekat Kampus
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', fontWeight: 'normal' }}>
                          <input
                            type="checkbox"
                            name="isNearOffice"
                            checked={formData.isNearOffice || false}
                            onChange={handleInputChange}
                            style={{ marginRight: '8px' }}
                          /> Dekat Kantor
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', fontWeight: 'normal' }}>
                          <input
                            type="checkbox"
                            name="isNearTouristSpot"
                            checked={formData.isNearTouristSpot || false}
                            onChange={handleInputChange}
                            style={{ marginRight: '8px' }}
                          /> Dekat Wisata
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {formData.category === 'laundry' && (
                  <div className="extra-fields-section">
                    <h4 style={{ fontSize: '14px', margin: '0 0 10px 0', color: '#36d6ff' }}>Detail Laundry</h4>
                    <div className="form-group">
                      <label>Kualitas & Biaya Air (1-5)</label>
                      <select name="waterCostIndex" onChange={handleInputChange} required className="custom-select">
                        <option value="">-- Pilih Skala --</option>
                        <option value="1">1 - Air Kuning / Beli Tangki (Mahal)</option>
                        <option value="2">2 - Kurang Bagus</option>
                        <option value="3">3 - Standar</option>
                        <option value="4">4 - Bagus</option>
                        <option value="5">5 - Air Tanah Bagus & Gratis</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Tipe Hunian Dominan</label>
                      <select name="housingTypology" onChange={handleInputChange} required className="custom-select">
                        <option value="">-- Pilih Tipe --</option>
                        <option value="Student_Cluster">Student Cluster (Kos-kosan)</option>
                        <option value="Family_Cluster">Family Cluster (Perumahan)</option>
                        <option value="Apartment">Apartment</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Ketersediaan Area Jemur (1-5)</label>
                      <select name="sunlightExposure" onChange={handleInputChange} required className="custom-select">
                        <option value="">-- Pilih Skala --</option>
                        <option value="1">1 - Terhalang / Indoor Sempit</option>
                        <option value="2">2 - Minim Cahaya</option>
                        <option value="3">3 - Cukup</option>
                        <option value="4">4 - Terbuka Sebagian</option>
                        <option value="5">5 - Terbuka Penuh (Outdoor Luas)</option>
                      </select>
                    </div>
                  </div>
                )}

                {formData.category === 'warung' && (
                  <div className="extra-fields-section">
                    <h4 style={{ fontSize: '14px', margin: '0 0 10px 0', color: '#36d6ff' }}>Detail Warung</h4>
                    <div className="form-group">
                      <label>Posisi Bangunan *</label>
                      <select name="locationPosition" onChange={handleInputChange} required className="custom-select">
                        <option value="">-- Pilih Posisi --</option>
                        <option value="Hook">Hook / Pojok Jalan (Strategis)</option>
                        <option value="T_Junction">Tusuk Sate (Terlihat Jelas)</option>
                        <option value="Middle">Tengah Blok (Standar)</option>
                        <option value="Dead_End">Jalan Buntu (Kurang Strategis)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Jarak ke Keramaian (Meter)</label>
                      <input type="number" name="socialHubProximity" placeholder="Contoh: 50" onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Visibilitas (0-100%)</label>
                      <input type="range" name="visibilityScore" min="0" max="100" defaultValue="50" onChange={handleInputChange} style={{ width: '100%' }} />
                      <span style={{ fontSize: '12px', color: '#eaf0ff' }}>{formData.visibilityScore || 50}% Terlihat</span>
                    </div>
                  </div>
                )}

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Menganalisis...' : 'Analisis & Simpan'}
                </button>
              </form>
              {result && result.success && !popup.show && (
                <div className="popup-card" style={{ zIndex: 2000, maxWidth: '400px' }}>
                  <div className="form-header">
                    <h3>Hasil Analisis</h3>
                    <button className="btn-close" onClick={() => setResult(null)}>✕</button>
                  </div>

                  {/* Skor Utama */}
                  <div style={{ textAlign: 'center', marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 15 }}>
                    <div style={{ fontSize: '42px', fontWeight: '800', color: result.score >= 60 ? '#10b981' : result.score >= 40 ? '#f59e0b' : '#ef4444' }}>
                      {result.score}%
                    </div>
                    <div className="potential-badge" style={{ backgroundColor: result.score >= 60 ? '#10b981' : result.score >= 40 ? '#f59e0b' : '#ef4444' }}>
                      {result.category}
                    </div>
                  </div>

                  {/* --- NEW: DETAIL PERHITUNGAN (BREAKDOWN) --- */}
                  {result.breakdown && (
                    <div style={{ marginBottom: 20, fontSize: '13px', color: '#d1d5db' }}>
                      <h4 style={{ color: '#e5e7eb', marginBottom: 10, fontSize: '14px' }}>Rincian Nilai:</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>Skor Dasar Wilayah</span>
                        <span style={{ fontWeight: 'bold' }}>{result.breakdown.baseScore}</span>
                      </div>

                      {/* Loop Adjustments (Kategori) */}
                      {result.breakdown.adjustments.map((adj, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span>{adj.label}</span>
                          <span style={{ color: adj.val > 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                            {adj.val > 0 ? `+${adj.val}` : adj.val}
                          </span>
                        </div>
                      ))}

                      {/* Penalti Kompetitor */}
                      {result.breakdown.competitorPenalty !== 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span>Faktor Kompetisi</span>
                          <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                            {result.breakdown.competitorPenalty}
                          </span>
                        </div>
                      )}

                      {/* Penyesuaian Sewa */}
                      {result.breakdown.rentAdjustment !== 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span>Efisiensi Biaya Sewa</span>
                          <span style={{ color: result.breakdown.rentAdjustment > 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                            {result.breakdown.rentAdjustment > 0 ? `+${result.breakdown.rentAdjustment}` : result.breakdown.rentAdjustment}
                          </span>
                        </div>
                      )}

                      <div style={{ borderTop: '1px solid #4b5563', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#fff' }}>
                        <span>TOTAL SKOR</span>
                        <span>{result.score}</span>
                      </div>
                    </div>
                  )}
                  {/* ------------------------------------------- */}

                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#36d6ff', fontSize: '14px' }}>Rekomendasi Cerdas:</h4>
                    {result.recommendations && result.recommendations.length > 0 ? (
                      <ul style={{ paddingLeft: '20px', margin: 0, color: '#d1d5db', fontSize: '13px', lineHeight: '1.5' }}>
                        {result.recommendations.map((rec, i) => (
                          <li key={i} style={{ marginBottom: '6px' }}>{rec}</li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ fontSize: '13px', color: '#9ca3af' }}>Tidak ada rekomendasi khusus.</p>
                    )}
                  </div>

                  {/* Info Tambahan */}
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '20px' }}>
                    {result.competitorsFound !== undefined && (
                      <p>🏢 Kompetitor: {result.competitorsFound} (Jarak terdekat: {result.nearestCompetitorDistance}m)</p>
                    )}
                  </div>

                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setResult(null)}>
                    Tutup
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MapPage;