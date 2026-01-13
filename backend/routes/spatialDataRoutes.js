const express = require('express');
const router = express.Router();
const { 
  createPopulationData, 
  createRoadAccessibilityData, 
  createSpatialData,        // Pastikan ini ada
  updateSpatialData,        // Pastikan ini ada
  getAllCombinedData,
  predictBusinessPotential,
  deleteSpatialData         // <--- TAMBAHKAN INI AGAR TIDAK ERROR
} = require('../controller/spatialDataController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Route Gabungan (Dipakai Frontend AdminPage)
// GET /api/spatial-data
router.get('/', protect, getAllCombinedData);

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

module.exports = router;