const mongoose = require('mongoose');

const PopulationDataSchema = new mongoose.Schema({
  markerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Marker',
    required: true
  },
  populationDensity: {
    type: Number,
    required: [true, 'Kepadatan penduduk wajib diisi']
  },
  averageAge: {
    type: Number,
    required: [true, 'Rata-rata umur wajib diisi']
  },
  // --- DATA BARU: TARGET PASAR (Persentase 0-100) ---
  studentPercentage: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 100 
  },
  workerPercentage: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 100 
  },
  familyPercentage: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 100 
  },
  // --------------------------------------------------
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware untuk update waktu
PopulationDataSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PopulationData', PopulationDataSchema);