const express = require('express');
const router = express.Router();
const spatialDataController = require('../controller/spatialDataController');
const { protect, isAdmin } = require('../middleware/authMiddleware'); // <-- Impor protect

// Public routes (Sekarang Terproteksi)
router.get('/', protect, spatialDataController.getAllSpatialData);           // <-- PROTECT
router.get('/marker/:markerId', protect, spatialDataController.getSpatialDataByMarker); // <-- PROTECT
router.get('/statistics', protect, spatialDataController.getStatistics);   // <-- PROTECT

// Admin only routes
// Catatan: Middleware 'protect' harus selalu mendahului 'isAdmin'
router.post('/', protect, isAdmin, spatialDataController.createSpatialData);        // <-- PROTECT & ISADMIN
router.put('/:id', protect, isAdmin, spatialDataController.updateSpatialData);      // <-- PROTECT & ISADMIN
router.delete('/:id', protect, isAdmin, spatialDataController.deleteSpatialData);    // <-- PROTECT & ISADMIN

module.exports = router;