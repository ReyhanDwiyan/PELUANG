const express = require('express');
const router = express.Router();
const { 
  createPopulationData, 
  createRoadAccessibilityData, 
  createSpatialData,        // Pastikan ini ada
  updateSpatialData,        // Pastikan ini ada
  getAllCombinedData,
  predictBusinessPotential,
  deleteSpatialData,
  getUserHistory,
  getUserHistory    // <--- TAMBAHKAN INI AGAR TIDAK ERROR
} = require('../controller/spatialDataController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Route Gabungan (Dipakai Frontend AdminPage)
// GET /api/spatial-data
router.get('/', protect, getAllCombinedData);

router.get('/history', protect, getUserHistory);
router.get('/stats', protect, getUserStats);     // API untuk Angka Dashboard

// POST /api/spatial-data (Simpan data baru)
router.post('/', protect, authorize('admin'), createSpatialData);

// PUT /api/spatial-data/:id (Update data existing)
router.put('/:id', protect, authorize('admin'), updateSpatialData);

// DELETE /api/spatial-data/:id (Hapus data)
router.delete('/:id', protect, authorize('admin'), deleteSpatialData);

// Route Terpisah (Legacy/Optional)
router.post('/population', protect, authorize('admin'), createPopulationData);
router.post('/road-accessibility', protect, authorize('admin'), createRoadAccessibilityData);

// Route Prediksi
router.post('/predict', protect, predictBusinessPotential);

router.post('/population', protect, authorize('admin'), createPopulationData);
router.post('/road-accessibility', protect, authorize('admin'), createRoadAccessibilityData);


module.exports = router;