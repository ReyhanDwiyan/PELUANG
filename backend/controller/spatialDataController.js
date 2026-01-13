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

// --- HELPER: HITUNG SKOR DASAR ---
const calculateBaseScore = (popData, ecoData, roadData) => {
  const densityScore = Math.min((popData?.populationDensity || 0) / 10000, 1) * 30; // Max 30 Poin
  const incomeScore = Math.min((ecoData?.averageIncome || 0) / (UMR_BANDUNG * 3), 1) * 20; // Max 20 Poin
  const roadScore = ((roadData?.roadAccessibility || 0) / 5) * 10; // Max 10 Poin
  return Math.round(densityScore + incomeScore + roadScore);
};

// --- HELPER: HITUNG KOMPETITOR ---
const countCompetitors = async (latitude, longitude, category) => {
  const markers = await Marker.find({ category: category, isActive: true }).lean();
  let count = 0;
  markers.forEach(m => {
    const dist = Math.sqrt(
      Math.pow(m.latitude - latitude, 2) + 
      Math.pow(m.longitude - longitude, 2)
    ) * 111000; // Konversi derajat ke meter (estimasi kasar)
    if (dist <= COMPETITOR_RADIUS_METERS) count++;
  });
  return count;
};

// ==========================================
// 1. GET ALL DATA (Untuk Admin Dashboard)
// ==========================================
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
          averageAge: 0, 
          populationDensity: 0, 
          roadAccessibility: 0, 
          averageIncome: 0,
          averageRentalCost: 0, // Tambahan baru
          lastUpdated: item.updatedAt
        });
      }
      
      const entry = combinedMap.get(key);
      if (type === 'population') {
        entry.averageAge = item.averageAge;
        entry.populationDensity = item.populationDensity;
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

    const finalData = Array.from(combinedMap.values());
    sendResponse(res, finalData);
  } catch (error) {
    handleError(res, error, 'Gagal mengambil data gabungan');
  }
};

// ==========================================
// 2. CREATE SPATIAL DATA (Input Admin)
// ==========================================
exports.createSpatialData = async (req, res) => {
  try {
    const { 
      markerId, 
      averageAge, populationDensity, 
      studentPercentage, workerPercentage, familyPercentage,
      averageIncome, averageRentalCost, 
      roadAccessibility 
    } = req.body;

    if (!markerId) return handleError(res, { message: 'Validation Error' }, 'Marker ID wajib diisi', 400);

    const operations = [
      PopulationData.findOneAndUpdate(
        { markerId },
        { 
          markerId, averageAge, populationDensity, 
          studentPercentage, workerPercentage, familyPercentage, // New Fields
          createdBy: req.user?._id 
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ),
      EconomicData.findOneAndUpdate(
        { markerId },
        { 
          markerId, averageIncome, averageRentalCost, // New Fields
          createdBy: req.user?._id 
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ),
      RoadAccessibilityData.findOneAndUpdate(
        { markerId },
        { markerId, roadAccessibility, createdBy: req.user?._id },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    ];

    await Promise.all(operations);
    sendResponse(res, { success: true }, 201, { message: 'Data spasial berhasil disimpan' });
  } catch (error) {
    handleError(res, error, 'Gagal menyimpan data spasial');
  }
};

// ==========================================
// 3. UPDATE SPATIAL DATA (Edit Admin)
// ==========================================
exports.updateSpatialData = async (req, res) => {
  try {
    const markerId = req.params.id;
    const { 
      averageAge, populationDensity, 
      studentPercentage, workerPercentage, familyPercentage,
      averageIncome, averageRentalCost,
      roadAccessibility 
    } = req.body;

    const operations = [
      PopulationData.findOneAndUpdate(
        { markerId }, 
        { averageAge, populationDensity, studentPercentage, workerPercentage, familyPercentage }, 
        { new: true }
      ),
      EconomicData.findOneAndUpdate(
        { markerId }, 
        { averageIncome, averageRentalCost }, 
        { new: true }
      ),
      RoadAccessibilityData.findOneAndUpdate(
        { markerId }, 
        { roadAccessibility }, 
        { new: true }
      )
    ];

    await Promise.all(operations);
    sendResponse(res, { success: true }, 200, { message: 'Data spasial berhasil diupdate' });
  } catch (error) {
    handleError(res, error, 'Gagal mengupdate data spasial');
  }
};

// ==========================================
// 4. DELETE SPATIAL DATA (Hapus Admin)
// ==========================================
exports.deleteSpatialData = async (req, res) => {
  try {
    const markerId = req.params.id;
    if (!markerId) return handleError(res, { message: 'Validation Error' }, 'ID tidak valid', 400);

    await Promise.all([
      PopulationData.findOneAndDelete({ markerId }),
      RoadAccessibilityData.findOneAndDelete({ markerId }),
      EconomicData.findOneAndDelete({ markerId })
    ]);

    sendResponse(res, { success: true }, 200, { message: 'Data spasial berhasil dihapus' });
  } catch (error) {
    handleError(res, error, 'Gagal menghapus data spasial');
  }
};

// ==========================================
// 5. PREDICT BUSINESS POTENTIAL (User)
// ==========================================
exports.predictBusinessPotential = async (req, res) => {
  try {
    const { 
      latitude, longitude, category, 
      // Input Restoran
      signatureMenu, menuPrice, menuCategory, parkingAreaSize, isNearCampus, isNearOffice, isNearTouristSpot,
      // Input Laundry
      waterCostIndex, housingTypology, sunlightExposure,
      // Input Warung
      locationPosition, socialHubProximity, visibilityScore 
    } = req.body;

    if (!category) return handleError(res, { message: 'Validation Error' }, 'Kategori wajib dipilih', 400);

    let savedDetail = null;
    let detailModelName = '';

    // A. SIMPAN DATA DETAIL (USER INPUT)
    if (category === 'restoran') {
      savedDetail = await RestoranData.create({
        latitude, longitude, userId: req.user?._id,
        signatureMenu: signatureMenu || '-',
        menuPrice: parseFloat(menuPrice) || 0,
        menuCategory: menuCategory || 'Lainnya',
        parkingAreaSize: parseFloat(parkingAreaSize) || 0,
        isNearCampus: Boolean(isNearCampus),
        isNearOffice: Boolean(isNearOffice),
        isNearTouristSpot: Boolean(isNearTouristSpot)
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

    // B. AMBIL DATA MACRO DARI MARKER TERDEKAT
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
    const pctFamily = popData?.familyPercentage || 0;

    // --- LOGIKA RESTORAN ---
    if (category === 'restoran') {
      const price = parseFloat(menuPrice) || 0;
      // Harga vs Daya Beli
      if (price < 25000 && avgIncome < UMR_BANDUNG) score += 15;
      else if (price > 50000 && avgIncome > (2.5 * UMR_BANDUNG)) score += 15;
      else if (price >= 25000 && price <= 50000 && avgIncome >= UMR_BANDUNG) score += 15;
      else score -= 10;

      // Menu vs Segmen
      if (menuCategory === 'makanan_berat' && pctWorker > 30) score += 15;
      else if ((menuCategory === 'minuman' || menuCategory === 'snack') && pctStudent > 30) score += 15;
      else score += 5;

      // Parkir
      if (price > 40000) { 
         if (parseFloat(parkingAreaSize) > 50) score += 10; else score -= 15;
      } else { score += 5; }
    }

    // --- LOGIKA LAUNDRY ---
    else if (category === 'laundry') {
      // Hunian vs Segmen
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
      // Posisi
      if (locationPosition === 'Hook') score += 20;
      else if (locationPosition === 'T_Junction') score += 15;
      else if (locationPosition === 'Middle') score += 5;
      else if (locationPosition === 'Dead_End') score -= 20;

      // Visibilitas
      const vis = parseInt(visibilityScore) || 0;
      if (vis < 30) score = score * 0.5;
      else if (vis > 80) score += 10;

      // Jarak Keramaian
      if (parseFloat(socialHubProximity) < 50) score += 10;
    }

    // D. PENALTI & EFISIENSI
    const competitorCount = await countCompetitors(latitude, longitude, category);
    if (competitorCount > 5) score -= 20;
    else if (competitorCount > 2) score -= 10;

    if (score > 70 && rentCost > (avgIncome * 12)) score -= 5;
    if (score > 60 && rentCost < (avgIncome * 5)) score += 5;

    score = Math.round(Math.max(0, Math.min(score, 100)));
    
    let categoryLabel = 'Rendah';
    if (score >= 80) categoryLabel = 'Sangat Tinggi (Prime Location)';
    else if (score >= 60) categoryLabel = 'Tinggi';
    else if (score >= 40) categoryLabel = 'Sedang';

    // E. SIMPAN HISTORY
    await AnalysisHistory.create({
      userId: req.user?._id,
      markerId: nearestMarker?._id,
      category,
      detailId: savedDetail._id,
      detailModel: detailModelName,
      finalScore: score,
      scoreCategory: categoryLabel
    });

    sendResponse(res, {
      score,
      category: categoryLabel,
      nearestLocation: nearestMarker?.title,
      competitorsFound: competitorCount,
      detail: {
        avgIncome,
        populationDensity: popData?.populationDensity,
        segmentasi: { mahasiswa: pctStudent, karyawan: pctWorker, keluarga: pctFamily }
      }
    });

  } catch (error) {
    handleError(res, error, 'Gagal melakukan prediksi');
  }
};

// ==========================================
// 6. LEGACY ROUTES (Agar tidak error 404)
// ==========================================
exports.createPopulationData = async (req, res) => {
  // Fungsi dummy/wrapper agar route tidak error
  exports.createSpatialData(req, res);
};

exports.createRoadAccessibilityData = async (req, res) => {
  // Fungsi dummy/wrapper agar route tidak error
  exports.createSpatialData(req, res);
};