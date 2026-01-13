const mongoose = require('mongoose');

const RoadAccessibilityDataSchema = new mongoose.Schema({
  markerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Marker',
    required: true
  },
  roadAccessibility: {
    type: Number,
    required: [true, 'Aksesibilitas jalan wajib diisi'],
    min: 1,
    max: 5 // Asumsi skala 1-5 seperti sebelumnya
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

RoadAccessibilityDataSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('RoadAccessibilityData', RoadAccessibilityDataSchema);