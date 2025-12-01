const express = require('express');
const router = express.Router();
const spatialDataController = require('../controller/spatialDataController');
const { isAdmin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', spatialDataController.getAllSpatialData);
router.get('/marker/:markerId', spatialDataController.getSpatialDataByMarker);
router.get('/statistics', spatialDataController.getStatistics);

// Admin only routes
router.post('/', isAdmin, spatialDataController.createSpatialData);
router.put('/:id', isAdmin, spatialDataController.updateSpatialData);
router.delete('/:id', isAdmin, spatialDataController.deleteSpatialData);

module.exports = router;