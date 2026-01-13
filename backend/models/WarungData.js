const mongoose = require('mongoose');

const warungDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },

  // 1. Sisi Jalan (Traffic Flow Side)
  trafficFlowSide: { 
    type: String, 
    required: true,
    enum: ['Home_Bound_Side', 'Work_Bound_Side'] 
  },
  
  // 2. Jarak ke Titik Kumpul Sosial (Meter)
  socialHubProximity: { type: Number, required: true },

  // 3. Blind Spot Analysis (Visibilitas 0-100%)
  visibilityScore: { type: Number, required: true, min: 0, max: 100 },

  createdAt: { type: Date, default: Date.now }
}, { collection: 'dataanalisiswarung' }); // Nama collection baru sesuai permintaan

module.exports = mongoose.model('WarungData', warungDataSchema);