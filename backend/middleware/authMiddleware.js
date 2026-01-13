const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. PROTECT: Cek apakah user login
const protect = async (req, res, next) => {
  let token;

  // Cek Header Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Cek Cookie
  else if (req.cookies.token) {
    token = req.cookies.token;
  }
  // Cek Header User-ID (Fallback untuk dev)
  else if (req.headers['user-id']) {
    try {
      const user = await User.findById(req.headers['user-id']).select('-password');
      if (user) {
        req.user = user;
        return next();
      }
    } catch (err) {}
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

// 2. AUTHORIZE: Cek Role User (Admin, User, dll)
// Fungsi ini menerima daftar role, misal: authorize('admin', 'manager')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };