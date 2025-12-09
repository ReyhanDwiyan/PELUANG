const mongoose = require('mongoose');

const spatialDataSchema = new mongoose.Schema({
  markerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Marker',
    required: true,
    unique: true
  },
  averageAge: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  averageIncome: {
    type: Number,
    required: true,
    min: 0
  },
  populationDensity: {
    type: Number,
    required: true,
    min: 0
  },
  roadAccessibility: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    enum: [1, 2, 3, 4, 5]
  },
  potentialScore: {
    type: Number,
    default: 0
  },
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

// Calculate potential score before saving
spatialDataSchema.pre('save', function(next) {
  // Formula sederhana untuk menghitung potensi
  // Semakin muda umur rata-rata = lebih potensial
  // Semakin tinggi penghasilan = lebih potensial
  // Semakin padat penduduk = lebih potensial
  // Semakin mudah akses jalan = lebih potensial

  const ageScore = (100 - this.averageAge) / 100 * 25; // Max 25 points
  const incomeScore = Math.min(this.averageIncome / 10000000, 1) * 25; // Max 25 points
  const densityScore = Math.min(this.populationDensity / 10000, 1) * 25; // Max 25 points
  const accessScore = (this.roadAccessibility / 5) * 25; // Max 25 points

  this.potentialScore = Math.round(ageScore + incomeScore + densityScore + accessScore);
  next();
});

module.exports = mongoose.model('SpatialData', spatialDataSchema);