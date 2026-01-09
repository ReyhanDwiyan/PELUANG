const mongoose = require('mongoose');

const infrastructureDataSchema = new mongoose.Schema({
  markerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Marker',
    required: true,
    unique: true
  },
  roadAccessibility: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('InfrastructureData', infrastructureDataSchema);