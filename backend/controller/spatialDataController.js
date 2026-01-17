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
const UMR_BANDUNG = 4200000;
const COMPETITOR_RADIUS_METERS = 500;

// --- HELPER 1: HITUNG JARAK (METER) ---
const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Radius bumi dalam meter
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Hasil dalam meter
};

// --- HELPER 2: ANALISIS KOMPETITOR (JUMLAH & JARAK TERDEKAT) ---
// Update: Sekarang mengembalikan object { count, nearestDist }
const analyzeCompetitors = async (latitude, longitude, category) => {
  const markers = await Marker.find({ category: category, isActive: true }).lean();
  
  let count = 0;
  let nearestDist = Infinity;

  markers.forEach(m => {
    const dist = calculateDistanceMeters(latitude, longitude, m.latitude, m.longitude);
    
    if (dist <= COMPETITOR_RADIUS_METERS) {
      count++;
      // Cari yang paling dekat
      if (dist < nearestDist) {
        nearestDist = dist;
      }
    }
  });

  return { count, nearestDist: nearestDist === Infinity ? 0 : nearestDist };
};

// --- HELPER 3: HITUNG SKOR DASAR ---
const calculateBaseScore = (popData, ecoData, roadData) => {
  const densityScore = Math.min((popData?.populationDensity || 0) / 10000, 1) * 30; 
  const incomeScore = Math.min((ecoData?.averageIncome || 0) / (UMR_BANDUNG * 3), 1) * 20; 
  const roadScore = ((roadData?.roadAccessibility || 0) / 5) * 10; 
  
  return {
    total: Math.round(densityScore + incomeScore + roadScore),
    details: {
      density: Math.round(densityScore),
      income: Math.round(incomeScore),
      road: Math.round(roadScore)
    }
  };
};

// --- HELPER 4: GENERATE REKOMENDASI ---
const generateRecommendations = (category, score, popData, ecoData, competitorData) => {
  const recs = [];
  const { nearestDist, count } = competitorData; // Ambil data kompetitor
  
  const pctStudent = popData?.studentPercentage || 0;
  const pctWorker = popData?.workerPercentage || 0;
  const pctFamily = popData?.familyPercentage || 0;
  const income = ecoData?.averageIncome || 0;

  // 1. Rekomendasi Berbasis Kompetitor (BARU)
  if (count > 0) {
    if (nearestDist < 50) {
      recs.push(`⚠️ BAHAYA: Ada kompetitor sangat dekat (${Math.round(nearestDist)}m). Anda harus punya diferensiasi kuat (Harga/Promo).`);
    } else if (nearestDist < 150) {
      recs.push(`⚠️ Kompetitor dalam jarak pandang (${Math.round(nearestDist)}m). Pastikan signage/plang toko Anda lebih terlihat.`);
    }
  } else {
    recs.push("✅ Area ini masih bersih dari kompetitor langsung dalam radius 500m.");
  }

  // 2. Rekomendasi Kategori
  if (category === 'restoran') {
    if (pctStudent > 40) recs.push("Pasar Mahasiswa: Buat menu paket hemat (Rp 15-25rb), porsi kenyang, dan WiFi kencang.");
    if (pctWorker > 40) recs.push("Pasar Karyawan: Fokus kecepatan penyajian (Quick Service) untuk jam makan siang.");
    if (pctFamily > 40) recs.push("Pasar Keluarga: Sediakan menu sharing (tengah) dan kursi bayi (High Chair).");
  } 
  else if (category === 'laundry') {
    if (pctStudent > 50) recs.push("Sangat potensial untuk Laundry Kiloan + Setrika (Mahasiswa malas nyuci).");
    if (pctWorker > 40) recs.push("Tawarkan layanan Antar-Jemput atau Paket Express (Selesai 4 Jam).");
    if (income > 8000000) recs.push("Potensi Laundry Sepatu & Tas Branded (Cuci Premium).");
  }
  else if (category === 'warung') {
    if (pctStudent > 50) recs.push("Wajib stok: Mie instan, Kopi sachet, Rokok eceran, dan Minuman dingin.");
    if (pctFamily > 50) recs.push("Fokus Sembako: Beras, Telur, Minyak Goreng, dan Gas LPG.");
  }

  if (score < 50) recs.push("⚠️ Hati-hati: Persaingan ketat atau pasar sepi. Siapkan budget promosi ekstra.");
  else if (score > 80) recs.push("🔥 Lokasi Emas: Segera amankan lokasi sebelum diambil kompetitor.");

  return recs;
};

// ==========================================
// 1. PREDIKSI POTENSI BISNIS
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

    // A. SIMPAN DATA DETAIL (Sama seperti sebelumnya)
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

    // B. AMBIL DATA MACRO (Cari marker terdekat untuk data demografi)
    const markers = await Marker.find({ isActive: true }).lean();
    if (!markers.length) return handleError(res, { message: 'Not Found' }, 'Data area belum tersedia', 404);

    let nearestMarker = null;
    let minMarkerDist = Infinity;
    
    // Cari marker referensi terdekat (untuk data base)
    markers.forEach(m => {
      const dist = calculateDistanceMeters(latitude, longitude, m.latitude, m.longitude);
      if (dist < minMarkerDist) { minMarkerDist = dist; nearestMarker = m; }
    });

    const [popData, roadData, ecoData] = await Promise.all([
      PopulationData.findOne({ markerId: nearestMarker._id }).lean(),
      RoadAccessibilityData.findOne({ markerId: nearestMarker._id }).lean(),
      EconomicData.findOne({ markerId: nearestMarker._id }).lean()
    ]);

    // C. HITUNG SKOR
    const baseCalc = calculateBaseScore(popData, ecoData, roadData);
    let score = baseCalc.total;
    
    // Inisialisasi Object Breakdown
    const breakdown = {
      baseScore: baseCalc.total,
      adjustments: [],      // Menampung penyesuaian kategori
      competitorPenalty: 0, // Menampung penalti kompetitor
      rentAdjustment: 0     // Menampung penalti/bonus sewa
    };

    const avgIncome = ecoData?.averageIncome || 0;
    const rentCost = ecoData?.averageRentalCost || 0;
    const pctStudent = popData?.studentPercentage || 0;
    const pctWorker = popData?.workerPercentage || 0;
    const pctFamily = popData?.familyPercentage || 0;

    // --- LOGIKA KATEGORI (Sama seperti sebelumnya) ---
   if (category === 'restoran') {
      const price = parseFloat(menuPrice) || 0;
      
      // Cek Kesesuaian Harga vs Income Area
      if (price < 25000 && avgIncome < UMR_BANDUNG) {
        score += 15;
        breakdown.adjustments.push({ label: "Harga Ekonomis di Area Terjangkau", val: 15 });
      } else if (price > 50000 && avgIncome > (2.5 * UMR_BANDUNG)) {
        score += 15;
        breakdown.adjustments.push({ label: "Harga Premium di Area Elite", val: 15 });
      } else if (price >= 25000 && price <= 50000 && avgIncome >= UMR_BANDUNG) {
        score += 15;
        breakdown.adjustments.push({ label: "Harga Standar Sesuai UMR", val: 15 });
      } else {
        score -= 10;
        breakdown.adjustments.push({ label: "Ketidakcocokan Harga vs Daya Beli", val: -10 });
      }

      // Cek Target Pasar
      if (menuCategory === 'makanan_berat' && pctWorker > 30) {
        score += 15;
        breakdown.adjustments.push({ label: "Cocok untuk Karyawan (Makan Berat)", val: 15 });
      } else if ((menuCategory === 'minuman' || menuCategory === 'snack') && pctStudent > 30) {
        score += 15;
        breakdown.adjustments.push({ label: "Cocok untuk Mahasiswa (Snack/Minum)", val: 15 });
      } else {
        score += 5;
        breakdown.adjustments.push({ label: "Kategori Umum", val: 5 });
      }
    }
    else if (category === 'laundry') {
      if (housingTypology === 'Student_Cluster' && pctStudent > 40) {
        score += 20;
        breakdown.adjustments.push({ label: "Lokasi Kos Mahasiswa (High Demand)", val: 20 });
      } else if (housingTypology === 'Apartment' && pctWorker > 40) {
        score += 20;
        breakdown.adjustments.push({ label: "Lokasi Apartemen Pekerja", val: 20 });
      } else if (housingTypology === 'Family_Cluster') {
         if (avgIncome > (2 * UMR_BANDUNG)) {
            score += 25;
            breakdown.adjustments.push({ label: "Perumahan Menengah Atas", val: 25 });
         } else {
            score -= 10;
            breakdown.adjustments.push({ label: "Perumahan Biasa (Suka Cuci Sendiri)", val: -10 });
         }
      } else {
        score += 5;
        breakdown.adjustments.push({ label: "Tipe Hunian Standar", val: 5 });
      }

      // Bonus Fasilitas
      if (parseInt(waterCostIndex) >= 4) {
        score += 10;
        breakdown.adjustments.push({ label: "Kualitas Air Bagus", val: 10 });
      }
      if (parseInt(sunlightExposure) >= 4) {
        score += 10;
        breakdown.adjustments.push({ label: "Area Jemur Memadai", val: 10 });
      }
    }
    else if (category === 'warung') {
      // Posisi Bangunan
      if (locationPosition === 'Hook') { score += 20; breakdown.adjustments.push({ label: "Posisi Hook (Sangat Strategis)", val: 20 }); }
      else if (locationPosition === 'T_Junction') { score += 15; breakdown.adjustments.push({ label: "Posisi Tusuk Sate", val: 15 }); }
      else if (locationPosition === 'Middle') { score += 5; breakdown.adjustments.push({ label: "Posisi Tengah Blok", val: 5 }); }
      else if (locationPosition === 'Dead_End') { score -= 20; breakdown.adjustments.push({ label: "Jalan Buntu", val: -20 }); }

      // Visibilitas
      const vis = parseInt(visibilityScore) || 0;
      if (vis < 30) { 
        let penalty = Math.round(score * 0.5); // Penalti 50%
        score -= penalty; 
        breakdown.adjustments.push({ label: "Visibilitas Buruk (<30%)", val: -penalty });
      } else if (vis > 80) {
        score += 10;
        breakdown.adjustments.push({ label: "Visibilitas Sangat Baik", val: 10 });
      }
    }

    // D. PENALTI & FINALISASI (UPDATED: LOGIKA SENSITIF JARAK)
    const competitorData = await analyzeCompetitors(latitude, longitude, category);
    const { count: competitorCount, nearestDist } = competitorData;

    // 1. Penalti Jumlah
    let qtyPenalty = 0;
    if (competitorCount > 5) qtyPenalty = -20;
    else if (competitorCount > 2) qtyPenalty = -10;
    
    if(qtyPenalty !== 0) {
        score += qtyPenalty;
        breakdown.competitorPenalty += qtyPenalty;
    }

    // 2. Penalti Jarak (Proximity)
    let distPenalty = 0;
    if (competitorCount > 0) {
        if (nearestDist < 50) distPenalty = -25;
        else if (nearestDist < 150) distPenalty = -15;
        else if (nearestDist < 300) distPenalty = -5;
    }

    if(distPenalty !== 0) {
        score += distPenalty;
        breakdown.competitorPenalty += distPenalty;
    }

    // 3. Penalti/Bonus Biaya Sewa
    if (score > 70 && rentCost > (avgIncome * 12)) {
        score -= 5;
        breakdown.rentAdjustment = -5;
    }
    if (score > 60 && rentCost < (avgIncome * 5)) {
        score += 5;
        breakdown.rentAdjustment = 5;
    }

    // Limit skor 0-100
    score = Math.round(Math.max(0, Math.min(score, 100)));
    
    let categoryLabel = 'Rendah';
    if (score >= 80) categoryLabel = 'Sangat Tinggi (Prime Location)';
    else if (score >= 60) categoryLabel = 'Tinggi';
    else if (score >= 40) categoryLabel = 'Sedang';

    // --- GENERATE REKOMENDASI (UPDATED) ---
    const recommendations = generateRecommendations(category, score, popData, ecoData, competitorData);

    // E. SIMPAN HISTORY
    await AnalysisHistory.create({
      userId: req.user?._id,
      markerId: nearestMarker?._id,
      category,
      detailId: savedDetail._id,
      detailModel: detailModelName,
      finalScore: score,
      scoreCategory: categoryLabel,
      recommendations: recommendations,
      breakdown: breakdown // Simpan struktur breakdown lengkap
    });

    sendResponse(res, {
      score,
      category: categoryLabel,
      breakdown, // <--- KIRIM OBJECT INI
      nearestLocation: nearestMarker?.title,
      competitorsFound: competitorCount,
      nearestCompetitorDistance: Math.round(nearestDist),
      recommendations, 
      detail: {
        avgIncome,
        populationDensity: popData?.populationDensity
      }
    });

  } catch (error) {
    handleError(res, error, 'Gagal melakukan prediksi');
  }
};

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

// --- D. ADMIN: CREATE DATA ---
exports.createSpatialData = async (req, res) => {
  try {
    const { 
      markerId, averageAge, populationDensity, 
      studentPercentage, workerPercentage, familyPercentage,
      averageIncome, averageRentalCost, roadAccessibility 
    } = req.body;

    if (!markerId) return handleError(res, { message: 'Validation Error' }, 'Marker ID wajib diisi', 400);

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
    ]); 

    sendResponse(res, { success: true }, 201, { message: 'Data berhasil disimpan' });
  } catch (error) {
    handleError(res, error, 'Gagal menyimpan data');
  }
};

// --- E. ADMIN: UPDATE DATA ---
exports.updateSpatialData = async (req, res) => {
  exports.createSpatialData(req, res);
};

// --- F. ADMIN: DELETE DATA ---
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