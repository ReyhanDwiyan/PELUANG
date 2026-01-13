const mongoose = require('mongoose');

const laundryDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },

  // 1. Index Kualitas & Biaya Air (1-5)
  waterCostIndex: { type: Number, required: true, min: 1, max: 5 },
  
  // 2. Tipe Hunian Dominan
  housingTypology: { 
    type: String, 
    required: true,
    enum: ['Student_Cluster', 'Family_Cluster', 'Apartment'] 
  },

  // 3. Ketersediaan Area Jemur (1-5)
  sunlightExposure: { type: Number, required: true, min: 1, max: 5 },

  createdAt: { type: Date, default: Date.now }
}, { collection: 'dataanalisislaundry' }); // Nama collection baru

module.exports = mongoose.model('LaundryData', laundryDataSchema);