const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- HELPER FUNCTIONS (Untuk mengurangi repetisi) ---

// 1. Format respon user agar bersih (tanpa password)
const sanitizeUser = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt
});

// 2. Standard error handler untuk server error
const handleError = (res, error, context) => {
  console.error(`${context} error:`, error);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: error.message
  });
};

// 3. Helper untuk mengirim Token & Cookie (Khusus Login)
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  
  const options = {
    httpOnly: true,
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      message: 'Login berhasil',
      data: sanitizeUser(user),
      token
    });
};

// --- MAIN CONTROLLERS ---

// REGISTER
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Semua field harus diisi' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username atau email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'user'
    });

    // Response 201 Created (Tanpa cookie/token sesuai kode asli)
    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: sanitizeUser(user)
    });

  } catch (error) {
    handleError(res, error, 'Register');
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email });

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password harus diisi' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    // Gunakan helper untuk handle token & cookie
    sendTokenResponse(user, 200, res);

  } catch (error) {
    handleError(res, error, 'Login');
  }
};

// LOGOUT
exports.logout = async (req, res) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.json({ success: true, message: 'Logout berhasil' });

  } catch (error) {
    handleError(res, error, 'Logout');
  }
};

// GET CURRENT USER
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.headers['user-id']; // Logic asli dipertahankan

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID tidak ditemukan' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    res.json({ success: true, data: user });

  } catch (error) {
    handleError(res, error, 'Get current user');
  }
};