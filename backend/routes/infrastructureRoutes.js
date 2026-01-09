const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const {
    createInfrastructureData,
    getAllInfrastructureData,
    getInfrastructureDataByMarkerId,
    updateInfrastructureData,
    deleteInfrastructureData
} = require('../controller/infrastructureController');

router.post('/', protect, isAdmin, createInfrastructureData);
router.get('/', protect, getAllInfrastructureData);
router.get('/marker/:markerId', protect, getInfrastructureDataByMarkerId);
router.put('/:id', protect, isAdmin, updateInfrastructureData);
router.delete('/:id', protect, isAdmin, deleteInfrastructureData);

module.exports = router;