const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');

router.post('/register', authController.register);  // POST /api/auth/register
router.post('/login', authController.login);        // POST /api/auth/login

module.exports = router;