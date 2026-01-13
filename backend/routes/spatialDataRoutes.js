const express = require('express');
const router = express.Router();
const { 
  createPopulationData, 
  createRoadAccessibilityData, 
  getAllCombinedData,
  predictBusinessPotential 
} = require('../controller/spatialDataController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Route untuk input data terpisah
// POST /api/spatial-data/population
router.post('/population', protect, authorize('admin'), createPopulationData);

// POST /api/spatial-data/road-accessibility
router.post('/road-accessibility', protect, authorize('admin'), createRoadAccessibilityData);

// Route Gabungan (untuk Map/Dashboard)
// GET /api/spatial-data
router.get('/', protect, getAllCombinedData);

// Route Prediksi
// POST /api/spatial-data/predict
router.post('/predict', protect, predictBusinessPotential);

module.exports = router;