const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const {
    createDemographicData,
    getAllDemographicData,
    getDemographicDataByMarkerId,
    updateDemographicData,
    deleteDemographicData
} = require('../controller/demographicController');

router.post('/', protect, isAdmin, createDemographicData);
router.get('/', protect, getAllDemographicData);
router.get('/marker/:markerId', protect, getDemographicDataByMarkerId);
router.put('/:id', protect, isAdmin, updateDemographicData);
router.delete('/:id', protect, isAdmin, deleteDemographicData);

module.exports = router;