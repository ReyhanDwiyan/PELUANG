const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTER
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validasi input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Semua field harus diisi'
      });
    }

    // Cek apakah user sudah ada
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username atau email sudah terdaftar'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user baru
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: 'user' // Default role
    });

    await user.save();

    // Response tanpa password
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: userResponse
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt:', { email });

    // Validasi input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password harus diisi'
      });
    }

    // Cari user berdasarkan email
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    // Verifikasi password
    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    // Generate JWT token
    const token = user.getSignedJwtToken();

    // Response dengan user data DAN token
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };

    // PENTING: Set cookie DAN kirim di response body
    res
      .cookie('token', token, {
        httpOnly: true,
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'lax'
      })
      .json({
        success: true,
        message: 'Login berhasil',
        data: userResponse,
        token // ← Kirim token di body juga untuk frontend
      });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// LOGOUT
exports.logout = async (req, res) => {
  try {
    // Clear cookie jika menggunakan cookie-based auth
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000), // Expire dalam 10 detik
      httpOnly: true
    });

    res.json({
      success: true,
      message: 'Logout berhasil'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// GET CURRENT USER
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.headers['user-id'];

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID tidak ditemukan'
      });
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};