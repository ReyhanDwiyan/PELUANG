const mongoose = require('mongoose');

const analysisHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  markerId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Marker',
    required: false
  },
  category: {
    type: String,
    required: true,
    enum: ['restoran', 'laundry', 'warung']
  },
  detailId: { 
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'detailModel' 
  },
  detailModel: {
    type: String,
    required: true,
    enum: ['RestoranData', 'LaundryData', 'WarungData']
  },
  finalScore: {
    type: Number,
    required: true
  },
  scoreCategory: { 
    type: String,
    required: true
  },
  
  recommendations: { 
    type: [String], 
    default: [] 
  },
  breakdown: { 
    type: Object, 
    default: {} 
  },

  bestAlternative: {
    category: { type: String, enum: ['restoran', 'laundry', 'warung'] },
    finalScore: { type: Number },
    scoreCategory: { type: String },
    breakdown: { type: Object, default: {} },
    assumptions: { type: [String], default: [] } // Asumsi yang digunakan
  },

  analyzedAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'analysishistories' });

module.exports = mongoose.model('AnalysisHistory', analysisHistorySchema);