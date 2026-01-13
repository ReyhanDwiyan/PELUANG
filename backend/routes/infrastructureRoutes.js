const express = require('express');
const router = express.Router();
// PERBAIKAN: Import 'authorize'
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    createInfrastructureData,
    getAllInfrastructureData,
    getInfrastructureDataByMarkerId,
    updateInfrastructureData,
    deleteInfrastructureData
} = require('../controller/infrastructureController');

// PERBAIKAN: Ganti isAdmin dengan authorize('admin')
router.post('/', protect, authorize('admin'), createInfrastructureData);
router.get('/', protect, getAllInfrastructureData);
router.get('/marker/:markerId', protect, getInfrastructureDataByMarkerId);
router.put('/:id', protect, authorize('admin'), updateInfrastructureData);
router.delete('/:id', protect, authorize('admin'), deleteInfrastructureData);

module.exports = router;