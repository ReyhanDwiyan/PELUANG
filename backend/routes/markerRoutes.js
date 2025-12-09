const express = require('express');
const router = express.Router();
const markerController = require('../controller/markerController');
const { protect, isAdmin } = require('../middleware/authMiddleware'); // <-- Impor middleware

// Special routes (harus di atas :id routes)
router.get('/stats', protect, markerController.getMarkerStats);       // <-- PROTECT
router.get('/nearby', protect, markerController.getNearbyMarkers);     // <-- PROTECT

// CRUD routes
router.route('/')
  .get(protect, markerController.getAllMarkers)     // GET /api/markers <-- PROTECT
  .post(protect, isAdmin, markerController.createMarker); // POST /api/markers <-- PROTECT & ISADMIN

router.route('/:id')
  .get(protect, markerController.getMarkerById)      // GET /api/markers/:id <-- PROTECT
  .put(protect, isAdmin, markerController.updateMarker)   // PUT /api/markers/:id <-- PROTECT & ISADMIN
  .delete(protect, isAdmin, markerController.deleteMarker); // DELETE /api/markers/:id <-- PROTECT & ISADMIN

module.exports = router;