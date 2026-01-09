const express = require('express');
const router = express.Router();
const spatialDataController = require('../controller/spatialDataController');
const { protect, isAdmin } = require('../middleware/authMiddleware'); // <-- Impor protect

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Public routes (Sekarang Terproteksi)
router.get('/combined', protect, spatialDataController.getAllCombinedData);
router.get('/combined/marker/:markerId', protect, spatialDataController.getCombinedDataByMarkerId);
router.get('/', protect, spatialDataController.getAllSpatialData);           // <-- PROTECT
router.get('/marker/:markerId', protect, spatialDataController.getSpatialDataByMarker); // <-- PROTECT
router.get('/statistics', protect, spatialDataController.getStatistics);   // <-- PROTECT


// Admin only routes
// Catatan: Middleware 'protect' harus selalu mendahului 'isAdmin'
router.post('/', protect, isAdmin, spatialDataController.createSpatialData);
router.put('/:id', spatialDataController.updateSpatialData);
router.delete('/:id', spatialDataController.deleteSpatialData);
// router.post(
//     '/upload',
//     protect, // jika perlu autentikasi
//     isAdmin, // jika hanya admin
//     upload.single('file'),
//     spatialDataController.uploadSpatialData
// ); // Endpoint upload CSV/XLSX (admin only)
router.post('/predict', spatialDataController.predictBusinessPotential);

module.exports = router;