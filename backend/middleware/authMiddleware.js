const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware untuk melindungi rute (Support Cookie DAN Authorization Header)
const protect = async (req, res, next) => {
  let token;

  // 1. Cek dari Authorization Header (Bearer Token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Cek dari Cookie
  else if (req.cookies.token) {
    token = req.cookies.token;
  }
  // 3. Fallback: Cek user-id di header (untuk backward compatibility)
  else if (req.headers['user-id']) {
    try {
      const userId = req.headers['user-id'];
      const user = await User.findById(userId).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
  }

  // Jika tidak ada token sama sekali
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized - No token provided'
    });
  }

  try {
    // Verifikasi Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Cari user berdasarkan ID di token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Attach user ke request
    req.user = user;

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized - Invalid or expired token'
    });
  }
};

// Middleware untuk cek admin (harus setelah protect)
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden - Admin access only'
    });
  }
  next();
};

module.exports = {
  protect,
  isAdmin,
  // ...middleware lain jika ada
};