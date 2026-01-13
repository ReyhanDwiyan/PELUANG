const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
// PERBAIKAN 1: Import 'authorize' (bukan isAdmin)
const { protect, authorize } = require('../middleware/authMiddleware'); 

router.route('/')
  // PERBAIKAN 2: Ganti isAdmin dengan authorize('admin')
  .get(protect, authorize('admin'), userController.getAllUsers); 

router.route('/:id')
  .get(protect, authorize('admin'), userController.getUserById)
  .put(protect, authorize('admin'), userController.updateUser)
  .delete(protect, authorize('admin'), userController.deleteUser);

module.exports = router;