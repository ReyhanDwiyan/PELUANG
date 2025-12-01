const User = require('../models/User');

// Middleware untuk cek apakah user adalah admin
const isAdmin = async (req, res, next) => {
  try {
    // Asumsikan user ID sudah ada di request (dari token/session)
    const userId = req.body.userId || req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - User ID tidak ditemukan'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Hanya admin yang dapat mengakses'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = { isAdmin };