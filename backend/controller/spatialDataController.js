const PopulationData = require('../models/PopulationData');
const RoadAccessibilityData = require('../models/RoadAccessibilityData');
const EconomicData = require('../models/EconomicData');
const Marker = require('../models/Marker');
const RestoranData = require('../models/RestoranData');
const LaundryData = require('../models/LaundryData');
const WarungData = require('../models/WarungData'); // Pastikan file model ini ada
const { handleError, sendResponse } = require('../utils/responseHandler');

// --- HELPER SCORING ---
const calculatePotentialScore = (age = 0, income = 0, density = 0, access = 0) => {
  const safeAge = age || 0;
  const safeIncome = income || 0;
  const safeDensity = density || 0;
  const safeAccess = access || 0;

  const ageScore = safeAge > 0 ? ((100 - safeAge) / 100) * 25 : 0;
  const incomeScore = Math.min(safeIncome / 10000000, 1) * 25;
  const densityScore = Math.min(safeDensity / 10000, 1) * 25;
  const accessScore = (safeAccess / 5) * 25;
  
  return Math.round(ageScore + incomeScore + densityScore + accessScore);
};

// --- 1. CREATE SPATIAL DATA (GABUNGAN) ---
exports.createSpatialData = async (req, res) => {
  try {
    const { markerId, averageAge, averageIncome, populationDensity, roadAccessibility } = req.body;
    if (!markerId) return handleError(res, { message: 'Validation Error' }, 'Marker ID wajib diisi', 400);

    const operations = [
      PopulationData.findOneAndUpdate({ markerId }, { markerId, averageAge, populationDensity, createdBy: req.user?._id }, { upsert: true, new: true }),
      RoadAccessibilityData.findOneAndUpdate({ markerId }, { markerId, roadAccessibility, createdBy: req.user?._id }, { upsert: true, new: true }),
      EconomicData.findOneAndUpdate({ markerId }, { markerId, averageIncome, createdBy: req.user?._id }, { upsert: true, new: true })
    ];

    await Promise.all(operations);
    sendResponse(res, { success: true }, 201, { message: 'Data spasial berhasil disimpan' });
  } catch (error) { handleError(res, error, 'Gagal menyimpan data spasial'); }
};

// --- 2. UPDATE SPATIAL DATA ---
exports.updateSpatialData = async (req, res) => {
  try {
    const markerId = req.params.id;
    const { averageAge, averageIncome, populationDensity, roadAccessibility } = req.body;
    const operations = [
      PopulationData.findOneAndUpdate({ markerId }, { averageAge, populationDensity }, { new: true }),
      RoadAccessibilityData.findOneAndUpdate({ markerId }, { roadAccessibility }, { new: true }),
      EconomicData.findOneAndUpdate({ markerId }, { averageIncome }, { new: true })
    ];
    await Promise.all(operations);
    sendResponse(res, { success: true }, 200, { message: 'Data spasial berhasil diupdate' });
  } catch (error) { handleError(res, error, 'Gagal mengupdate data spasial'); }
};

// --- 3. CREATE DATA TERPISAH ---
exports.createPopulationData = async (req, res) => {
  try {
    const newData = await PopulationData.create({ ...req.body, createdBy: req.user?._id });
    sendResponse(res, newData, 201);
  } catch (error) { handleError(res, error, 'Gagal input populasi'); }
};

exports.createRoadAccessibilityData = async (req, res) => {
  try {
    const newData = await RoadAccessibilityData.create({ ...req.body, createdBy: req.user?._id });
    sendResponse(res, newData, 201);
  } catch (error) { handleError(res, error, 'Gagal input akses jalan'); }
};

// --- 4. GET COMBINED DATA ---
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
        combinedMap.set(key, { _id: item.markerId._id, markerId: item.markerId, averageAge: 0, populationDensity: 0, roadAccessibility: 0, averageIncome: 0, lastUpdated: item.updatedAt });
      }
      const entry = combinedMap.get(key);
      if (type === 'population') { entry.averageAge = item.averageAge; entry.populationDensity = item.populationDensity; }
      else if (type === 'road') { entry.roadAccessibility = item.roadAccessibility; }
      else if (type === 'economic') { entry.averageIncome = item.averageIncome; }
    };
    populations.forEach(p => mergeData(p, 'population'));
    roads.forEach(r => mergeData(r, 'road'));
    economics.forEach(e => mergeData(e, 'economic'));

    const finalData = Array.from(combinedMap.values()).map(item => ({
      ...item,
      potentialScore: calculatePotentialScore(item.averageAge, item.averageIncome, item.populationDensity, item.roadAccessibility)
    }));
    sendResponse(res, finalData);
  } catch (error) { handleError(res, error, 'Gagal mengambil data'); }
};

// --- 5. PREDICT BUSINESS POTENTIAL ---
// --- 5. PREDICT BUSINESS POTENTIAL ---
exports.predictBusinessPotential = async (req, res) => {
  try {
    const { 
      latitude, longitude, category, 
      // Input Restoran
      signatureMenu, menuPrice, menuCategory, parkingAreaSize, isNearCampus, isNearOffice, isNearTouristSpot,
      // Input Laundry
      waterCostIndex, housingTypology, sunlightExposure,
      // Input Warung
      trafficFlowSide, socialHubProximity, visibilityScore 
    } = req.body;

    if (!category) {
      return handleError(res, { message: 'Validation Error' }, 'Kategori bisnis wajib dipilih', 400);
    }

    // --- LOGIKA PENYIMPANAN DATA (FIX VALIDATION ERROR) ---
    if (category === 'restoran') {
      await RestoranData.create({
        latitude, longitude, userId: req.user?._id,
        signatureMenu: signatureMenu || 'Menu Belum Diisi',
        menuPrice: parseFloat(menuPrice) || 0,
        menuCategory: menuCategory || 'Lainnya',
        parkingAreaSize: parseFloat(parkingAreaSize) || 0,
        isNearCampus: Boolean(isNearCampus),
        isNearOffice: Boolean(isNearOffice),
        isNearTouristSpot: Boolean(isNearTouristSpot)
      });
    } 
    else if (category === 'laundry') {
      await LaundryData.create({
        latitude, longitude, userId: req.user?._id,
        waterCostIndex: parseInt(waterCostIndex) || 1,
        housingTypology: housingTypology || 'Student_Cluster',
        sunlightExposure: parseInt(sunlightExposure) || 1
      });
    } 
    else if (category === 'warung') {
      await WarungData.create({
        latitude, longitude, userId: req.user?._id,
        trafficFlowSide: trafficFlowSide || 'Home_Bound_Side',
        socialHubProximity: parseFloat(socialHubProximity) || 0,
        visibilityScore: parseInt(visibilityScore) || 0
      });
    }

    // --- LANJUT KE LOGIKA PREDIKSI & SCORING ---
    const markers = await Marker.find({ isActive: true }).lean();
    if (!markers.length) return handleError(res, { message: 'Not Found' }, 'Marker tidak tersedia', 404);

    let nearestMarker = null;
    let minDist = Infinity;
    markers.forEach(m => {
      const dist = Math.sqrt(Math.pow(m.latitude - latitude, 2) + Math.pow(m.longitude - longitude, 2));
      if (dist < minDist) { minDist = dist; nearestMarker = m; }
    });

    if (!nearestMarker) return handleError(res, { message: 'Not Found' }, 'Lokasi terlalu jauh', 404);

    const [popData, roadData, ecoData] = await Promise.all([
      PopulationData.findOne({ markerId: nearestMarker._id }).lean(),
      RoadAccessibilityData.findOne({ markerId: nearestMarker._id }).lean(),
      EconomicData.findOne({ markerId: nearestMarker._id }).lean()
    ]);

    const data = {
      averageAge: popData?.averageAge || 0,
      populationDensity: popData?.populationDensity || 0,
      roadAccessibility: roadData?.roadAccessibility || 0,
      averageIncome: ecoData?.averageIncome || 0
    };

    let score = calculatePotentialScore(data.averageAge, data.averageIncome, data.populationDensity, data.roadAccessibility);

    // --- BONUS SKOR DINAMIS ---
    if (category === 'restoran') {
      if (isNearCampus) score += 5;
      if (isNearOffice) score += 5;
      if (isNearTouristSpot) score += 5;
    } else if (category === 'laundry') {
      if (parseInt(waterCostIndex) >= 4) score += 5;
      if (parseInt(sunlightExposure) >= 4) score += 5;
    } else if (category === 'warung') {
      if (trafficFlowSide === 'Home_Bound_Side') score += 5;
      if (parseFloat(socialHubProximity) < 100) score += 5;
    }

    score = Math.min(score, 100);
    const label = score >= 75 ? 'Sangat Tinggi' : score >= 60 ? 'Tinggi' : score >= 40 ? 'Sedang' : 'Rendah';

    sendResponse(res, { score, category: label, nearestLocation: nearestMarker.title, detail: data });

  } catch (error) {
    handleError(res, error, 'Gagal melakukan prediksi');
  }
};

// --- 6. DELETE SPATIAL DATA ---
exports.deleteSpatialData = async (req, res) => {
  try {
    const markerId = req.params.id;
    await Promise.all([
      PopulationData.findOneAndDelete({ markerId }),
      RoadAccessibilityData.findOneAndDelete({ markerId }),
      EconomicData.findOneAndDelete({ markerId })
    ]);
    sendResponse(res, { success: true }, 200, { message: 'Data dihapus' });
  } catch (error) { handleError(res, error, 'Gagal menghapus'); }
};