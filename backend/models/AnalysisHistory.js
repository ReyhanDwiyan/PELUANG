const mongoose = require('mongoose');

const analysisHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Menyimpan lokasi mana yang dianalisis (mengambil dari lat/long marker terdekat)
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
  // Referensi ke detail data input user (agar bisa lihat detailnya nanti)
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
  // Hasil Skor yang sudah dihitung
  finalScore: {
    type: Number,
    required: true
  },
  scoreCategory: { // Contoh: 'Sangat Tinggi', 'Rendah'
    type: String,
    required: true
  },
  analyzedAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'analysishistories' });

module.exports = mongoose.model('AnalysisHistory', analysisHistorySchema);