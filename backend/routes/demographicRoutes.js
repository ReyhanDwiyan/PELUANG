const express = require('express');
const router = express.Router();
// PERBAIKAN: Import 'authorize'
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    createDemographicData,
    getAllDemographicData,
    getDemographicDataByMarkerId,
    updateDemographicData,
    deleteDemographicData
} = require('../controller/demographicController');

// PERBAIKAN: Ganti isAdmin dengan authorize('admin')
router.post('/', protect, authorize('admin'), createDemographicData);
router.get('/', protect, getAllDemographicData);
router.get('/marker/:markerId', protect, getDemographicDataByMarkerId);
router.put('/:id', protect, authorize('admin'), updateDemographicData);
router.delete('/:id', protect, authorize('admin'), deleteDemographicData);

module.exports = router;