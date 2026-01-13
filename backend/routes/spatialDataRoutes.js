const express = require('express');
const router = express.Router();
const { 
  createSpatialData,
  updateSpatialData,
  getAllCombinedData,
  predictBusinessPotential,
  deleteSpatialData,
  getUserHistory, // API History Table
  getUserStats    // API Dashboard Stats
} = require('../controller/spatialDataController');
const { protect, authorize } = require('../middleware/authMiddleware');

// =======================================================
// ROUTE DASHBOARD & HISTORY (User)
// =======================================================
// GET /api/spatial-data/stats (Angka Dashboard)
router.get('/stats', protect, getUserStats);

// GET /api/spatial-data/history (Tabel Riwayat)
router.get('/history', protect, getUserHistory);

// =======================================================
// ROUTE DATA SPASIAL (Admin)
// =======================================================
// GET /api/spatial-data (List Data Gabungan)
router.get('/', protect, getAllCombinedData);

// POST /api/spatial-data (Simpan Data Baru)
router.post('/', protect, authorize('admin'), createSpatialData);

// PUT /api/spatial-data/:id (Update Data)
router.put('/:id', protect, authorize('admin'), updateSpatialData);

// DELETE /api/spatial-data/:id (Hapus Data)
router.delete('/:id', protect, authorize('admin'), deleteSpatialData);

// =======================================================
// ROUTE PREDIKSI (User Logic Utama)
// =======================================================
// POST /api/spatial-data/predict
router.post('/predict', protect, predictBusinessPotential);

module.exports = router;