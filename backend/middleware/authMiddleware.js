const jwt = require('jsonwebtoken'); 
const User = require('../models/User');

// Middleware untuk melindungi rute (Memeriksa JWT dari Cookie)
const protect = async (req, res, next) => {
  let token;

  // Cek token dari Cookie yang dikirim oleh browser
  if (req.cookies.token) {
    token = req.cookies.token;
  }
  
  // Jika tidak ada token (belum login), tolak akses
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route - No token'
    });
  }

  try {
    // 1. Verifikasi Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 2. Cari Pengguna berdasarkan ID di Token (tanpa password)
    const user = await User.findById(decoded.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    // 3. Masukkan Objek Pengguna ke Request
    req.user = user;
    
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route - Token failed or expired'
    });
  }
};


// Middleware untuk cek apakah user adalah admin
// Middleware ini harus dijalankan SETELAH 'protect'
const isAdmin = (req, res, next) => {
  // Memeriksa objek req.user yang sudah diisi oleh middleware 'protect'
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden - Hanya admin yang dapat mengakses'
    });
  }

  next();
};

module.exports = { protect, isAdmin };