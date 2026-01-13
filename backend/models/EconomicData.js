const mongoose = require('mongoose');

const economicDataSchema = new mongoose.Schema({
  markerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Marker',
    required: true,
    unique: true
  },
  averageIncome: {
    type: Number,
    required: true,
    min: 0
  },
  // --- DATA BARU: BIAYA SEWA ---
  averageRentalCost: {
    type: Number,
    required: [true, 'Biaya sewa rata-rata wajib diisi'], // Input Admin: Rupiah per tahun
    min: 0,
    default: 0
  },
  // -----------------------------
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EconomicData', economicDataSchema);