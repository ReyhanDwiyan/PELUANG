const express = require('express');
const router = express.Router();
const markerController = require('../controller/markerController');

// Special routes (harus di atas :id routes)
router.get('/stats', markerController.getMarkerStats);
router.get('/nearby', markerController.getNearbyMarkers);

// CRUD routes
router.route('/')
  .get(markerController.getAllMarkers)      // GET /api/markers
  .post(markerController.createMarker);     // POST /api/markers

router.route('/:id')
  .get(markerController.getMarkerById)      // GET /api/markers/:id
  .put(markerController.updateMarker)       // PUT /api/markers/:id
  .delete(markerController.deleteMarker);   // DELETE /api/markers/:id

module.exports = router;