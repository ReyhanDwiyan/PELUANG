const PopulationData = require('../models/PopulationData');
const RoadAccessibilityData = require('../models/RoadAccessibilityData');
const EconomicData = require('../models/EconomicData');
const Marker = require('../models/Marker');
const RestoranData = require('../models/RestoranData');
const LaundryData = require('../models/LaundryData');
const WarungData = require('../models/WarungData');
const AnalysisHistory = require('../models/AnalysisHistory');
const { handleError, sendResponse } = require('../utils/responseHandler');

// --- KONSTANTA BISNIS ---
const UMR_BANDUNG = 4200000; // Rp 4.2 Juta
const COMPETITOR_RADIUS_METERS = 500;

// --- HELPER 1: HITUNG SKOR DASAR ---
const calculateBaseScore = (popData, ecoData, roadData) => {
  const densityScore = Math.min((popData?.populationDensity || 0) / 10000, 1) * 30; 
  const incomeScore = Math.min((ecoData?.averageIncome || 0) / (UMR_BANDUNG * 3), 1) * 20; 
  const roadScore = ((roadData?.roadAccessibility || 0) / 5) * 10; 
  return Math.round(densityScore + incomeScore + roadScore);
};

// --- HELPER 2: HITUNG KOMPETITOR ---
const countCompetitors = async (latitude, longitude, category) => {
  const markers = await Marker.find({ category: category, isActive: true }).lean();
  let count = 0;
  markers.forEach(m => {
    const dist = Math.sqrt(
      Math.pow(m.latitude - latitude, 2) + 
      Math.pow(m.longitude - longitude, 2)
    ) * 111000; 
    if (dist <= COMPETITOR_RADIUS_METERS) count++;
  });
  return count;
};

// --- HELPER 3: GENERATE REKOMENDASI BISNIS (BARU) ---
const generateRecommendations = (category, score, popData, ecoData) => {
  const recs = [];
  const pctStudent = popData?.studentPercentage || 0;
  const pctWorker = popData?.workerPercentage || 0;
  const pctFamily = popData?.familyPercentage || 0;
  const income = ecoData?.averageIncome || 0;

  // Logika Rekomendasi Spesifik
  if (category === 'restoran') {
    if (pctStudent > 40) recs.push("Pasar Mahasiswa: Buat menu paket hemat (Rp 15-25rb), porsi kenyang, dan WiFi kencang.");
    if (pctWorker > 40) recs.push("Pasar Karyawan: Fokus kecepatan penyajian (Quick Service) untuk jam makan siang.");
    if (pctFamily > 40) recs.push("Pasar Keluarga: Sediakan menu sharing (tengah) dan kursi bayi (High Chair).");
    if (income > 8000000) recs.push("Daya Beli Tinggi: Anda bisa menjual menu premium/estetik dengan margin lebih besar.");
  } 
  else if (category === 'laundry') {
    if (pctStudent > 50) recs.push("Sangat potensial untuk Laundry Kiloan + Setrika (Mahasiswa malas nyuci).");
    if (pctWorker > 40) recs.push("Tawarkan layanan Antar-Jemput atau Paket Express (Selesai 4 Jam).");
    if (income > 8000000) recs.push("Potensi Laundry Sepatu & Tas Branded (Cuci Premium).");
  }
  else if (category === 'warung') {
    if (pctStudent > 50) recs.push("Wajib stok: Mie instan, Kopi sachet, Rokok eceran, dan Minuman dingin.");
    if (pctFamily > 50) recs.push("Fokus Sembako: Beras, Telur, Minyak Goreng, dan Gas LPG.");
    if (score < 50) recs.push("Lokasi agak sepi: Pasang spanduk warna mencolok atau lampu terang agar terlihat.");
  }

  // Rekomendasi Umum
  if (score < 50) {
    recs.push("⚠️ Hati-hati: Persaingan ketat atau pasar sepi. Siapkan budget promosi ekstra.");
  } else if (score > 80) {
    recs.push("🔥 Lokasi Emas: Segera amankan lokasi sebelum diambil kompetitor.");
  }

  if (recs.length === 0) recs.push("Bisnis standar bisa berjalan, pastikan pelayanan ramah.");

  return recs;
};

// ==========================================
// 1. PREDIKSI POTENSI BISNIS (INTI SISTEM)
// ==========================================
exports.predictBusinessPotential = async (req, res) => {
  try {
    const { 
      latitude, longitude, category, 
      signatureMenu, menuPrice, menuCategory, parkingAreaSize, isNearCampus, isNearOffice, isNearTouristSpot,
      waterCostIndex, housingTypology, sunlightExposure,
      locationPosition, socialHubProximity, visibilityScore 
    } = req.body;

    if (!category) return handleError(res, { message: 'Validation Error' }, 'Kategori wajib dipilih', 400);

    let savedDetail = null;
    let detailModelName = '';

    // A. SIMPAN DATA DETAIL
    if (category === 'restoran') {
      savedDetail = await RestoranData.create({
        latitude, longitude, userId: req.user?._id,
        signatureMenu: signatureMenu || '-',
        menuPrice: parseFloat(menuPrice) || 0,
        menuCategory: menuCategory || 'Lainnya',
        parkingAreaSize: parseFloat(parkingAreaSize) || 0,
        isNearCampus: Boolean(isNearCampus), isNearOffice: Boolean(isNearOffice), isNearTouristSpot: Boolean(isNearTouristSpot)
      });
      detailModelName = 'RestoranData';
    } 
    else if (category === 'laundry') {
      savedDetail = await LaundryData.create({
        latitude, longitude, userId: req.user?._id,
        waterCostIndex: parseInt(waterCostIndex) || 1,
        housingTypology: housingTypology || 'Student_Cluster',
        sunlightExposure: parseInt(sunlightExposure) || 1
      });
      detailModelName = 'LaundryData';
    } 
    else if (category === 'warung') {
      savedDetail = await WarungData.create({
        latitude, longitude, userId: req.user?._id,
        locationPosition: locationPosition || 'Middle', 
        socialHubProximity: parseFloat(socialHubProximity) || 0,
        visibilityScore: parseInt(visibilityScore) || 0
      });
      detailModelName = 'WarungData';
    }

    // B. AMBIL DATA MACRO
    const markers = await Marker.find({ isActive: true }).lean();
    if (!markers.length) return handleError(res, { message: 'Not Found' }, 'Data area belum tersedia', 404);

    let nearestMarker = null;
    let minDist = Infinity;
    markers.forEach(m => {
      const dist = Math.sqrt(Math.pow(m.latitude - latitude, 2) + Math.pow(m.longitude - longitude, 2));
      if (dist < minDist) { minDist = dist; nearestMarker = m; }
    });

    const [popData, roadData, ecoData] = await Promise.all([
      PopulationData.findOne({ markerId: nearestMarker._id }).lean(),
      RoadAccessibilityData.findOne({ markerId: nearestMarker._id }).lean(),
      EconomicData.findOne({ markerId: nearestMarker._id }).lean()
    ]);

    // C. HITUNG SKOR
    let score = calculateBaseScore(popData, ecoData, roadData);
    const avgIncome = ecoData?.averageIncome || 0;
    const rentCost = ecoData?.averageRentalCost || 0;
    const pctStudent = popData?.studentPercentage || 0;
    const pctWorker = popData?.workerPercentage || 0;

    // --- LOGIKA RESTORAN ---
    if (category === 'restoran') {
      const price = parseFloat(menuPrice) || 0;
      if (price < 25000 && avgIncome < UMR_BANDUNG) score += 15;
      else if (price > 50000 && avgIncome > (2.5 * UMR_BANDUNG)) score += 15;
      else if (price >= 25000 && price <= 50000 && avgIncome >= UMR_BANDUNG) score += 15;
      else score -= 10;

      if (menuCategory === 'makanan_berat' && pctWorker > 30) score += 15;
      else if ((menuCategory === 'minuman' || menuCategory === 'snack') && pctStudent > 30) score += 15;
      else score += 5;

      if (price > 40000) { if (parseFloat(parkingAreaSize) > 50) score += 10; else score -= 15; } 
      else { score += 5; }
    }
    // --- LOGIKA LAUNDRY ---
    else if (category === 'laundry') {
      if (housingTypology === 'Student_Cluster' && pctStudent > 40) score += 20;
      else if (housingTypology === 'Apartment' && pctWorker > 40) score += 20;
      else if (housingTypology === 'Family_Cluster') {
         if (avgIncome > (2 * UMR_BANDUNG)) score += 25; else score -= 10;
      } else { score += 5; }
      if (parseInt(waterCostIndex) >= 4) score += 10;
      if (parseInt(sunlightExposure) >= 4) score += 10;
    }
    // --- LOGIKA WARUNG ---
    else if (category === 'warung') {
      if (locationPosition === 'Hook') score += 20;
      else if (locationPosition === 'T_Junction') score += 15;
      else if (locationPosition === 'Middle') score += 5;
      else if (locationPosition === 'Dead_End') score -= 20;

      const vis = parseInt(visibilityScore) || 0;
      if (vis < 30) score = score * 0.5;
      else if (vis > 80) score += 10;
      if (parseFloat(socialHubProximity) < 50) score += 10;
    }

    // D. PENALTI & FINALISASI
    const competitorCount = await countCompetitors(latitude, longitude, category);
    if (competitorCount > 5) score -= 20; else if (competitorCount > 2) score -= 10;

    if (score > 70 && rentCost > (avgIncome * 12)) score -= 5;
    if (score > 60 && rentCost < (avgIncome * 5)) score += 5;

    score = Math.round(Math.max(0, Math.min(score, 100)));
    
    let categoryLabel = 'Rendah';
    if (score >= 80) categoryLabel = 'Sangat Tinggi (Prime Location)';
    else if (score >= 60) categoryLabel = 'Tinggi';
    else if (score >= 40) categoryLabel = 'Sedang';

    // --- FITUR BARU: GENERATE REKOMENDASI ---
    const recommendations = generateRecommendations(category, score, popData, ecoData);
    
    const breakdown = {
        baseScore: Math.round(calculateBaseScore(popData, ecoData, roadData)),
        competitorPenalty: competitorCount > 5 ? -20 : competitorCount > 2 ? -10 : 0,
        demographicFit: (score > 60) ? "Cocok" : "Kurang Cocok",
        locationQuality: (category === 'warung' && locationPosition === 'Hook') ? "Sangat Strategis" : "Standar"
    };

    // E. SIMPAN HISTORY (DENGAN REKOMENDASI)
    await AnalysisHistory.create({
      userId: req.user?._id,
      markerId: nearestMarker?._id,
      category,
      detailId: savedDetail._id,
      detailModel: detailModelName,
      finalScore: score,
      scoreCategory: categoryLabel,
      recommendations: recommendations, 
      breakdown: breakdown
    });

    sendResponse(res, {
      score,
      category: categoryLabel,
      nearestLocation: nearestMarker?.title,
      competitorsFound: competitorCount,
      recommendations, // Kirim ke frontend agar langsung muncul
      detail: {
        avgIncome,
        populationDensity: popData?.populationDensity
      }
    });

  } catch (error) {
    handleError(res, error, 'Gagal melakukan prediksi');
  }
};

// ... (Biarkan kode bagian atas Helper & PredictBusinessPotential apa adanya) ...

// ==========================================
// 2. FUNGSI LAIN (DASHBOARD & ADMIN)
// ==========================================

// --- A. DASHBOARD STATS (USER) ---
exports.getUserStats = async (req, res) => {
  try {
    const history = await AnalysisHistory.find({ userId: req.user._id });
    const total = history.length;
    let avgScore = 0;
    if (total > 0) {
      const sum = history.reduce((acc, curr) => acc + curr.finalScore, 0);
      avgScore = sum / total;
    }
    sendResponse(res, { totalAnalysis: total, averagePotential: parseFloat(avgScore.toFixed(1)) });
  } catch (error) {
    handleError(res, error, 'Gagal mengambil statistik');
  }
};

// --- B. RIWAYAT (USER) ---
exports.getUserHistory = async (req, res) => {
  try {
    const history = await AnalysisHistory.find({ userId: req.user._id })
      .populate('markerId', 'title address')
      .sort({ analyzedAt: -1 });
    sendResponse(res, history);
  } catch (error) {
    handleError(res, error, 'Gagal mengambil riwayat');
  }
};

// --- C. ADMIN: GET ALL DATA ---
exports.getAllCombinedData = async (req, res) => {
  try {
    const [populations, roads, economics] = await Promise.all([
      PopulationData.find().populate('markerId').lean(),
      RoadAccessibilityData.find().populate('markerId').lean(),
      EconomicData.find().populate('markerId').lean()
    ]);

    const combinedMap = new Map();
    const mergeData = (item, type) => {
      if (!item.markerId) return;
      const key = item.markerId._id.toString();
      if (!combinedMap.has(key)) {
        combinedMap.set(key, {
          _id: item.markerId._id,
          markerId: item.markerId,
          averageAge: 0, populationDensity: 0, 
          studentPercentage: 0, workerPercentage: 0, familyPercentage: 0,
          roadAccessibility: 0, averageIncome: 0, averageRentalCost: 0,
          lastUpdated: item.updatedAt
        });
      }
      const entry = combinedMap.get(key);
      if (type === 'population') {
        entry.averageAge = item.averageAge;
        entry.populationDensity = item.populationDensity;
        entry.studentPercentage = item.studentPercentage || 0;
        entry.workerPercentage = item.workerPercentage || 0;
        entry.familyPercentage = item.familyPercentage || 0;
      } else if (type === 'road') {
        entry.roadAccessibility = item.roadAccessibility;
      } else if (type === 'economic') {
        entry.averageIncome = item.averageIncome;
        entry.averageRentalCost = item.averageRentalCost || 0;
      }
    };

    populations.forEach(p => mergeData(p, 'population'));
    roads.forEach(r => mergeData(r, 'road'));
    economics.forEach(e => mergeData(e, 'economic'));

    sendResponse(res, Array.from(combinedMap.values()));
  } catch (error) {
    handleError(res, error, 'Gagal mengambil data gabungan');
  }
};

// --- D. ADMIN: CREATE DATA (PERBAIKAN: TAMBAH KURUNG TUTUP) ---
exports.createSpatialData = async (req, res) => {
  try {
    const { 
      markerId, averageAge, populationDensity, 
      studentPercentage, workerPercentage, familyPercentage,
      averageIncome, averageRentalCost, roadAccessibility 
    } = req.body;

    if (!markerId) return handleError(res, { message: 'Validation Error' }, 'Marker ID wajib diisi', 400);

    // FIX: Tambahkan ')' sebelum titik koma di akhir blok Promise.all
    await Promise.all([
      PopulationData.findOneAndUpdate(
        { markerId },
        { markerId, averageAge, populationDensity, studentPercentage, workerPercentage, familyPercentage, createdBy: req.user?._id },
        { upsert: true, new: true }
      ),
      EconomicData.findOneAndUpdate(
        { markerId },
        { markerId, averageIncome, averageRentalCost, createdBy: req.user?._id },
        { upsert: true, new: true }
      ),
      RoadAccessibilityData.findOneAndUpdate(
        { markerId },
        { markerId, roadAccessibility, createdBy: req.user?._id },
        { upsert: true, new: true }
      )
    ]); // <--- SEBELUMNYA SALAH DISINI (];), SEKARANG SUDAH BENAR (]);)

    sendResponse(res, { success: true }, 201, { message: 'Data berhasil disimpan' });
  } catch (error) {
    handleError(res, error, 'Gagal menyimpan data');
  }
};

// --- E. ADMIN: UPDATE DATA (PERBAIKAN) ---
exports.updateSpatialData = async (req, res) => {
  // Logic sama dengan create karena pakai findOneAndUpdate/Upsert
  exports.createSpatialData(req, res);
};

// --- F. ADMIN: DELETE DATA (PERBAIKAN) ---
exports.deleteSpatialData = async (req, res) => {
  try {
    const id = req.params.id;
    await Promise.all([
        PopulationData.deleteMany({ $or: [{ _id: id }, { markerId: id }] }),
        RoadAccessibilityData.deleteMany({ $or: [{ _id: id }, { markerId: id }] }),
        EconomicData.deleteMany({ $or: [{ _id: id }, { markerId: id }] })
    ]);
    sendResponse(res, { success: true }, 200, { message: 'Data berhasil dihapus' });
  } catch (error) {
    handleError(res, error, 'Gagal menghapus data');
  }
};