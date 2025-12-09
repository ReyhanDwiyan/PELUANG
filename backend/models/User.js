const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // <-- 1. Impor bcrypt
const jwt = require('jsonwebtoken'); // <-- 2. Impor jsonwebtoken

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6, // <-- Opsional: Tambahkan validasi minlength
    select: false // <-- PENTING: Agar password tidak ikut terbawa saat query default
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// --- HOOKS (Mongoose Middleware) ---
// Enkripsi password sebelum disimpan (dijalankan sebelum 'save')
userSchema.pre('save', async function(next) {
  // Hanya enkripsi jika password dimodifikasi (misalnya saat user update profile)
  if (!this.isModified('password')) {
    next();
  }
  
  // Hashing
  const salt = await bcrypt.genSalt(10); // Membuat salt
  this.password = await bcrypt.hash(this.password, salt); // Hash password
  next();
});

// --- METHODS (Custom methods pada instance User) ---

// 1. Method untuk membuat dan mengembalikan Token JWT
userSchema.methods.getSignedJwtToken = function() {
  // Membuat token yang ditandatangani dengan ID pengguna dan peran (role)
  return jwt.sign(
    { id: this._id, role: this.role }, // Payload token
    process.env.JWT_SECRET, // Secret key dari .env
    {
      expiresIn: process.env.JWT_EXPIRE // Masa berlaku dari .env
    }
  );
};

// 2. Method untuk membandingkan password saat Login
userSchema.methods.matchPassword = async function(enteredPassword) {
  // Membandingkan password plain-text dengan password yang sudah di-hash
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);