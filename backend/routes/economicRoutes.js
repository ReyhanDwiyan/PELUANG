const express = require('express');
const router = express.Router();
// PERBAIKAN: Import 'authorize'
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    createEconomicData,
    getAllEconomicData,
    getEconomicDataByMarkerId,
    updateEconomicData,
    deleteEconomicData
} = require('../controller/economicController');

// PERBAIKAN: Ganti isAdmin dengan authorize('admin')
router.post('/', protect, authorize('admin'), createEconomicData);
router.get('/', protect, getAllEconomicData);
router.get('/marker/:markerId', protect, getEconomicDataByMarkerId);
router.put('/:id', protect, authorize('admin'), updateEconomicData);
router.delete('/:id', protect, authorize('admin'), deleteEconomicData);

module.exports = router;