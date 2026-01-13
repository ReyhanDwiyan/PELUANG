const mongoose = require('mongoose');

const restoranDataSchema = new mongoose.Schema({
  // Relasi opsional ke user jika perlu track siapa yang input
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  
  // 1. Menu + Harga (3 Field)
  signatureMenu: { type: String, required: true }, // Nama Menu Andalan
  menuPrice: { type: Number, required: true },     // Harga
  menuCategory: { type: String, required: true },  // Kategori (e.g., Makanan Berat/Minuman)

  // 2. Ketersediaan Parkir (Meter)
  parkingAreaSize: { type: Number, required: true }, 

  // 3. Checkbox Kedekatan
  isNearCampus: { type: Boolean, default: false },
  isNearOffice: { type: Boolean, default: false },
  isNearTouristSpot: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now }
}, { collection: 'dataanalisisrestoran' }); // Nama collection spesifik

module.exports = mongoose.model('RestoranData', restoranDataSchema);