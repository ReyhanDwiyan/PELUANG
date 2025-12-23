import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { markerAPI } from '../services/api';
import { requireAuth } from '../utils/auth';
// PASTIKAN TIDAK ADA: import Sidebar from '../components/Sidebar';
import 'leaflet/dist/leaflet.css';
import '../styles/MapPage.css';

// Fix Leaflet default icon issue
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

// Batas Wilayah sekitar ULBI (radius ~3-4 km)
const BANDUNG_BOUNDS = [
  [-6.9050, 107.5470], // Southwest (Barat Daya)
  [-6.8460, 107.6070]  // Northeast (Timur Laut)
];

// Component to add marker on click
function LocationMarker({ onAddMarker }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;

      // Cek apakah lokasi dalam batas area
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

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Lokasi baru dipilih</Popup>
    </Marker>
  );
}

const MapPage = () => {
  const navigate = useNavigate();
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'restaurant',
    address: '',
    rating: 0
  });

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

  const handleMapClick = (latlng) => {
    setSelectedLocation(latlng);
    setShowAddForm(true);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
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
        setFormData({
          title: '',
          description: '',
          category: 'restaurant',
          address: '',
          rating: 0
        });
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

  const getCategoryIcon = (category) => {
    const icons = {
      restaurant: '🍽️',
      cafe: '☕',
      shop: '🏪',
      park: '🌳',
      office: '🏢',
      other: '📍'
    };
    return icons[category] || '📍';
  };

  const getCategoryColor = (category) => {
    const colors = {
      restaurant: '#ef4444',
      cafe: '#f59e0b',
      shop: '#10b981',
      park: '#3b82f6',
      office: '#8b5cf6',
      other: '#6b7280'
    };
    return colors[category] || '#6b7280';
  };

  // Center: Kampus ULBI Bandung
  const ulbiCenter = [-6.8755, 107.5772];

  return (
    <div className="map-container">

      <main className="map-content">
        <header className="content-header">
          <h1>Peta Interaktif - Area ULBI Bandung</h1>
          <p className="subtitle">Klik pada peta untuk menambahkan marker baru (area sekitar kampus ULBI)</p>
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
                        <h3>{getCategoryIcon(marker.category)} {marker.title}</h3>
                        <p className="marker-category">{marker.category}</p>
                        {marker.description && <p>{marker.description}</p>}
                        {marker.address && <p className="marker-address">📍 {marker.address}</p>}
                        {marker.rating > 0 && <p className="marker-rating">⭐ {marker.rating}</p>}
                        <button
                          className="btn-delete-marker"
                          onClick={() => handleDeleteMarker(marker._id)}
                        >
                          🗑️ Hapus
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Click to add new marker */}
                <LocationMarker onAddMarker={handleMapClick} />
              </MapContainer>
            )}
          </div>

          {/* Add Marker Form */}
          {showAddForm && (
            <div className="add-marker-form">
              <div className="form-header">
                <h3>Tambah Marker Baru</h3>
                <button
                  className="btn-close"
                  onClick={() => {
                    setShowAddForm(false);
                    setSelectedLocation(null);
                  }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit}>
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
                  >
                    <option value="restaurant">Restaurant</option>
                    <option value="cafe">Cafe</option>
                    <option value="shop">Shop</option>
                    <option value="park">Park</option>
                    <option value="office">Office</option>
                    <option value="other">Other</option>
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
                    }}
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Markers List */}
          <div className="markers-list">
            <h3>Daftar Marker ({markers.length})</h3>
            <div className="markers-grid">
              {markers.map((marker) => (
                <div
                  key={marker._id}
                  className="marker-card"
                  style={{ borderLeftColor: getCategoryColor(marker.category) }}
                >
                  <div className="marker-card-header">
                    <span className="marker-icon">{getCategoryIcon(marker.category)}</span>
                    <h4>{marker.title}</h4>
                  </div>
                  <p className="marker-category-badge" style={{ backgroundColor: getCategoryColor(marker.category) }}>
                    {marker.category}
                  </p>
                  {marker.description && <p className="marker-desc">{marker.description}</p>}
                  {marker.rating > 0 && <p className="marker-rating">⭐ {marker.rating}</p>}
                  <button
                    className="btn-delete-small"
                    onClick={() => handleDeleteMarker(marker._id)}
                  >
                    🗑️ Hapus
                  </button>
                </div>
              ))}

              {markers.length === 0 && (
                <p className="empty-message">Belum ada marker. Klik pada peta untuk menambahkan!</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MapPage;