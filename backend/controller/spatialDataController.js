const PopulationData = require('../models/PopulationData');
const RoadAccessibilityData = require('../models/RoadAccessibilityData');
const EconomicData = require('../models/EconomicData'); // Kita asumsikan ini masih ada/dipakai
const Marker = require('../models/Marker');
const { handleError, sendResponse } = require('../utils/responseHandler');

// --- HELPER SCORING (Tetap sama) ---
const calculatePotentialScore = (age = 0, income = 0, density = 0, access = 0) => {
  // Cegah nilai null/undefined merusak kalkulasi
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

// --- 1. CREATE POPULATION DATA ---
exports.createPopulationData = async (req, res) => {
  try {
    const { markerId, populationDensity, averageAge } = req.body;

    if (!markerId || populationDensity === undefined || averageAge === undefined) {
      return handleError(res, { message: 'Validation Error' }, 'Marker ID, Density, dan Age wajib diisi', 400);
    }

    // Cek duplikat
    const existing = await PopulationData.findOne({ markerId });
    if (existing) {
      return handleError(res, { message: 'Duplicate' }, 'Data populasi untuk marker ini sudah ada', 400);
    }

    const newData = await PopulationData.create({
      markerId,
      populationDensity,
      averageAge,
      createdBy: req.user._id
    });

    sendResponse(res, newData, 201, { message: 'Data populasi berhasil ditambahkan' });
  } catch (error) {
    handleError(res, error, 'Gagal menambahkan data populasi');
  }
};

// --- 2. CREATE ROAD ACCESSIBILITY DATA ---
exports.createRoadAccessibilityData = async (req, res) => {
  try {
    const { markerId, roadAccessibility } = req.body;

    if (!markerId || roadAccessibility === undefined) {
      return handleError(res, { message: 'Validation Error' }, 'Marker ID dan Road Accessibility wajib diisi', 400);
    }

    const existing = await RoadAccessibilityData.findOne({ markerId });
    if (existing) {
      return handleError(res, { message: 'Duplicate' }, 'Data jalan untuk marker ini sudah ada', 400);
    }

    const newData = await RoadAccessibilityData.create({
      markerId,
      roadAccessibility,
      createdBy: req.user._id
    });

    sendResponse(res, newData, 201, { message: 'Data akses jalan berhasil ditambahkan' });
  } catch (error) {
    handleError(res, error, 'Gagal menambahkan data jalan');
  }
};

// --- 3. GET COMBINED DATA (Untuk Peta & Dashboard) ---
// Menggabungkan Population + Road + Economic (jika ada)
exports.getAllCombinedData = async (req, res) => {
  try {
    // Ambil semua data secara paralel agar cepat
    const [populations, roads, economics] = await Promise.all([
      PopulationData.find().populate('markerId').lean(),
      RoadAccessibilityData.find().populate('markerId').lean(),
      EconomicData.find().populate('markerId').lean()
    ]);

    const combinedMap = new Map();

    // Helper untuk merge data
    const mergeData = (item, type) => {
      if (!item.markerId) return;
      const key = item.markerId._id.toString();
      
      if (!combinedMap.has(key)) {
        combinedMap.set(key, {
          markerId: item.markerId,
          averageAge: 0,
          populationDensity: 0,
          roadAccessibility: 0,
          averageIncome: 0,
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
      }
      
      // Update timestamp ke yang paling baru
      if (new Date(item.updatedAt) > new Date(entry.lastUpdated)) {
        entry.lastUpdated = item.updatedAt;
      }
    };

    // Proses merging
    populations.forEach(p => mergeData(p, 'population'));
    roads.forEach(r => mergeData(r, 'road'));
    economics.forEach(e => mergeData(e, 'economic'));

    // Hitung Skor Potensi Final
    const finalData = Array.from(combinedMap.values()).map(item => ({
      ...item,
      potentialScore: calculatePotentialScore(
        item.averageAge,
        item.averageIncome,
        item.populationDensity,
        item.roadAccessibility
      )
    }));

    sendResponse(res, finalData);

  } catch (error) {
    handleError(res, error, 'Gagal mengambil data gabungan');
  }
};

// --- 4. PREDICT BUSINESS POTENTIAL (Logic Baru) ---
exports.predictBusinessPotential = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    // 1. Cari Marker Terdekat
    const markers = await Marker.find({ isActive: true }).lean();
    if (!markers.length) return handleError(res, { message: 'Not Found' }, 'Belum ada marker tersedia', 404);

    // Hitung jarak manual (Haversine simple) atau cari yang terdekat
    let nearestMarker = null;
    let minDist = Infinity;

    markers.forEach(m => {
      const dist = Math.sqrt(
        Math.pow(m.latitude - latitude, 2) + 
        Math.pow(m.longitude - longitude, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        nearestMarker = m;
      }
    });

    if (!nearestMarker) return handleError(res, { message: 'Not Found' }, 'Lokasi terlalu jauh dari data yang ada', 404);

    // 2. Ambil Data Detail dari Koleksi Terpisah
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

    // 3. Hitung Skor
    const score = calculatePotentialScore(
      data.averageAge, 
      data.averageIncome, 
      data.populationDensity, 
      data.roadAccessibility
    );

    let categoryLabel = score >= 75 ? 'Sangat Tinggi' : score >= 60 ? 'Tinggi' : score >= 40 ? 'Sedang' : 'Rendah';

    sendResponse(res, {
      score,
      category: categoryLabel,
      nearestLocation: nearestMarker.title,
      detail: data
    });

  } catch (error) {
    handleError(res, error, 'Gagal melakukan prediksi');
  }
};