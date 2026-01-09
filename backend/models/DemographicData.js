const mongoose = require('mongoose');

const demographicDataSchema = new mongoose.Schema({
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
  populationDensity: {
    type: Number,
    required: true,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DemographicData', demographicDataSchema);