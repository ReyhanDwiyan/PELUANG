const mongoose = require('mongoose');

const warungDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },

  // --- REVISI: POSISI BANGUNAN (Objektif) ---
  locationPosition: { 
    type: String, 
    required: true,
    enum: ['Hook', 'Middle', 'Dead_End', 'T_Junction'] 
    // Hook = Pojok (Strategis)
    // Middle = Tengah (Standar)
    // Dead_End = Jalan Buntu (Buruk)
    // T_Junction = Tusuk Sate (Visibilitas Tinggi)
  },
  
  socialHubProximity: { type: Number, required: true }, // Jarak ke keramaian (meter)
  visibilityScore: { type: Number, required: true, min: 0, max: 100 }, // Persen terlihat dari jalan

  createdAt: { type: Date, default: Date.now }
}, { collection: 'dataanalisiswarung' });

module.exports = mongoose.model('WarungData', warungDataSchema);