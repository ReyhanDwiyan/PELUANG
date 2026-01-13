const express = require('express');
const router = express.Router();
const markerController = require('../controller/markerController');
// PERUBAHAN 1: Import 'authorize' bukan 'isAdmin'
const { protect, authorize } = require('../middleware/authMiddleware'); 

// Special routes (harus di atas :id routes)
router.get('/stats', protect, markerController.getMarkerStats);
router.get('/nearby', protect, markerController.getNearbyMarkers);

// CRUD routes
router.route('/')
  .get(protect, markerController.getAllMarkers)
  // PERUBAHAN 2: Ganti 'isAdmin' dengan "authorize('admin')"
  .post(protect, authorize('admin'), markerController.createMarker); 

router.route('/:id')
  .get(protect, markerController.getMarkerById)
  // PERUBAHAN 3: Ganti 'isAdmin' dengan "authorize('admin')"
  .put(protect, authorize('admin'), markerController.updateMarker)
  .delete(protect, authorize('admin'), markerController.deleteMarker);

module.exports = router;