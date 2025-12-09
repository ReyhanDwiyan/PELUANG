const User = require('../models/User');

// @desc      Register new user
// @route     POST /api/auth/register
// @access    Public
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }
    
    // Create user. Hashing password terjadi secara OTOMATIS oleh pre-save hook di Model.
    const user = await User.create({
      username,
      email,
      password
    });
    
    // Kirim respons dengan JWT di HTTP-only Cookie
    sendTokenResponse(user, 201, res); 

  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// @desc      Login user
// @route     POST /api/auth/login
// @access    Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    // Find user by email, dan secara eksplisit TAMBAHKAN field password (+select)
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Membandingkan password plain-text dengan yang sudah di-hash
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Jika match, kirim respons dengan JWT di HTTP-only Cookie
    sendTokenResponse(user, 200, res);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// @desc      Logout user
// @route     GET /api/auth/logout
// @access    Private
exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // Kedaluwarsa dalam 10 detik
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
};


// Fungsi Helper untuk mengirim token dalam cookie
const sendTokenResponse = (user, statusCode, res) => {
  // Dapatkan token dari method di Model
  const token = user.getSignedJwtToken();

  // Opsi untuk Cookie
  const options = {
    // Menghitung masa berlaku cookie dalam milidetik
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000 
    ),
    httpOnly: true, // PENTING: Mencegah akses oleh JavaScript client-side (XSS protection)
    // Secure: Hanya kirim melalui HTTPS. Set `process.env.NODE_ENV === 'production'` 
    // jika Anda ingin memastikan ini. Untuk development, bisa diatur berdasarkan env.
    secure: process.env.NODE_ENV === 'production' 
  };

  // Kirim respons dengan Cookie
  res
    .status(statusCode)
    .cookie('token', token, options) // Set cookie bernama 'token'
    .json({
      success: true,
      token, // Masih kirim di body untuk kemudahan testing
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
};