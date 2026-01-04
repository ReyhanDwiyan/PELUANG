import React, { useState } from 'react';
import { spatialDataAPI } from '../services/api';

const AnalisisPotensiPage = () => {
  const [form, setForm] = useState({
    latitude: '',
    longitude: '',
    category: '',
    price: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await spatialDataAPI.predict({
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        category: form.category,
        price: parseFloat(form.price)
      });
      setResult(res.data);
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Gagal prediksi' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <h1>Analisis Potensi Bisnis</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Latitude</label>
            <input type="number" name="latitude" placeholder="Latitude" value={form.latitude} onChange={handleChange} required step="any" />
          </div>
          <div className="form-group">
            <label>Longitude</label>
            <input type="number" name="longitude" placeholder="Longitude" value={form.longitude} onChange={handleChange} required step="any" />
          </div>
          <div className="form-group">
            <label>Kategori Bisnis</label>
            <input type="text" name="category" placeholder="Kategori Bisnis" value={form.category} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Harga Produk</label>
            <input type="number" name="price" placeholder="Harga Produk" value={form.price} onChange={handleChange} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Menganalisis...' : 'Analisis'}
          </button>
        </form>
        {result && (
          <div style={{ marginTop: 24 }}>
            {result.success
              ? <div>
                  <h3>Skor Potensi: {result.score} ({result.category})</h3>
                  <pre>{JSON.stringify(result.detail, null, 2)}</pre>
                </div>
              : <div style={{ color: 'red' }}>{result.message}</div>
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalisisPotensiPage;