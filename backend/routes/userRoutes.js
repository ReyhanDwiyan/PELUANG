const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const { protect, isAdmin } = require('../middleware/authMiddleware'); // <-- Impor middleware

router.route('/')
  .get(protect, isAdmin, userController.getAllUsers); // GET /api/users <-- PROTECT & ISADMIN

router.route('/:id')
  .get(protect, isAdmin, userController.getUserById)    // GET /api/users/:id <-- PROTECT & ISADMIN
  .put(protect, isAdmin, userController.updateUser)     // PUT /api/users/:id <-- PROTECT & ISADMIN
  .delete(protect, isAdmin, userController.deleteUser);  // DELETE /api/users/:id <-- PROTECT & ISADMIN

module.exports = router;