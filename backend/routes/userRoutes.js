const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');

router.route('/')
  .get(userController.getAllUsers);        // GET /api/users

router.route('/:id')
  .get(userController.getUserById)         // GET /api/users/:id
  .put(userController.updateUser)          // PUT /api/users/:id
  .delete(userController.deleteUser);      // DELETE /api/users/:id

module.exports = router;