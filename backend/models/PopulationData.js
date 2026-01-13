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
  // Saya tambahkan averageAge disini karena erat kaitannya dengan populasi
  averageAge: {
    type: Number,
    required: [true, 'Rata-rata umur wajib diisi']
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

// Middleware untuk update waktu
PopulationDataSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PopulationData', PopulationDataSchema);