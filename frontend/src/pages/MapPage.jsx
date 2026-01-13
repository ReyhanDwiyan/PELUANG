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
    setLoading(true);
    try {
      // PERBAIKAN: Mengirimkan popup lat/lng DAN seluruh field dari formData
      const res = await spatialDataAPI.predict({
        latitude: popup.lat,
        longitude: popup.lng,
        ...formData 
      });
      setResult(res.data);
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Gagal prediksi' });
    } finally {
      setLoading(false);
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

                    {/* 1. Traffic Flow Side */}
                    <div className="form-group">
                      <label>Sisi Arus Jalan</label>
                      <select name="trafficFlowSide" onChange={handleInputChange} required className="custom-select">
                        <option value="">-- Pilih Sisi --</option>
                        <option value="Home_Bound_Side">Home Bound (Arah Pulang Rumah)</option>
                        <option value="Work_Bound_Side">Work Bound (Arah Berangkat Kerja)</option>
                      </select>
                    </div>

                    {/* 2. Social Hub Proximity */}
                    <div className="form-group">
                      <label>Jarak ke Titik Kumpul (Meter)</label>
                      <input
                        type="number"
                        name="socialHubProximity"
                        placeholder="Contoh: 50"
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    {/* 3. Visibility Score */}
                    <div className="form-group">
                      <label>Visibilitas / Blind Spot (0-100%)</label>
                      <input
                        type="range"
                        name="visibilityScore"
                        min="0"
                        max="100"
                        step="1"
                        defaultValue="50"
                        onChange={handleInputChange}
                        style={{ width: '100%' }}
                      />
                      <span style={{ fontSize: '12px', color: '#eaf0ff' }}>
                        {formData.visibilityScore || 50}% Terlihat
                      </span>
                    </div>
                  </div>
                )}

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Menganalisis...' : 'Analisis & Simpan'}
                </button>
              </form>
              {result && (
                <div style={{ marginTop: 16 }}>
                  {result.success
                    ? <div>
                      <h4>Skor Potensi: {result.score} ({result.category})</h4>
                      <pre>{JSON.stringify(result.detail, null, 2)}</pre>
                    </div>
                    : <div style={{ color: 'red' }}>{result.message}</div>
                  }
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