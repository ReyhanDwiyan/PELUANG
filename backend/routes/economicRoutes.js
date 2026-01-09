const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const {
    createEconomicData,
    getAllEconomicData,
    getEconomicDataByMarkerId,
    updateEconomicData,
    deleteEconomicData
} = require('../controller/economicController');

router.post('/', protect, isAdmin, createEconomicData);
router.get('/', protect, getAllEconomicData);
router.get('/marker/:markerId', protect, getEconomicDataByMarkerId);
router.put('/:id', protect, isAdmin, updateEconomicData);
router.delete('/:id', protect, isAdmin, deleteEconomicData);

module.exports = router;