const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { handleError, sendResponse } = require('../utils/responseHandler'); // <-- Import Helper

// REGISTER
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validasi input
    if (!username || !email || !password) {
      return handleError(res, { message: 'Validation Error' }, 'Semua field harus diisi', 400);
    }

    // Cek user existing
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return handleError(res, { message: 'Duplicate Error' }, 'Username atau email sudah terdaftar', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'user'
    });

    // Format data user agar password tidak ikut terkirim
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };

    // Paka helper sendResponse (Lebih ringkas)
    sendResponse(res, userResponse, 201, { message: 'Registrasi berhasil' });

  } catch (error) {
    handleError(res, error, 'Register error');
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return handleError(res, { message: 'Validation Error' }, 'Email dan password harus diisi', 400);
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return handleError(res, { message: 'Auth Error' }, 'Email atau password salah', 401);
    }

    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return handleError(res, { message: 'Auth Error' }, 'Email atau password salah', 401);
    }

    const token = user.getSignedJwtToken();

    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };

    // Set Cookie manual (Helper kita tidak handle cookie secara default)
    res.cookie('token', token, {
      httpOnly: true,
      expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    // Kirim response pakai helper
    sendResponse(res, userResponse, 200, { 
      message: 'Login berhasil', 
      token 
    });

  } catch (error) {
    handleError(res, error, 'Login error');
  }
};

// LOGOUT
exports.logout = async (req, res) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    sendResponse(res, null, 200, { message: 'Logout berhasil' });

  } catch (error) {
    handleError(res, error, 'Logout error');
  }
};

// GET CURRENT USER
exports.getCurrentUser = async (req, res) => {
  try {
    // Sesuai request: Pakai header manual (walaupun tidak secure, tapi anti-ribet)
    const userId = req.headers['user-id'];

    if (!userId) {
      return handleError(res, { message: 'Auth Error' }, 'User ID tidak ditemukan', 401);
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return handleError(res, { message: 'Not Found' }, 'User tidak ditemukan', 404);
    }

    sendResponse(res, user);

  } catch (error) {
    handleError(res, error, 'Get current user error');
  }
};