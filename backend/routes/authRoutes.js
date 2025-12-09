const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
// const { protect } = require('../middleware/authMiddleware'); // Tidak diperlukan impor 'protect' jika tidak ada rute terproteksi di sini

// Rute Publik (Tidak memerlukan login/token)
router.post('/register', authController.register);  // POST /api/auth/register
router.post('/login', authController.login);        // POST /api/auth/login

// Rute Logout (Mengatur cookie menjadi 'none' atau kosong)
router.get('/logout', authController.logout);       // GET /api/auth/logout

module.exports = router;