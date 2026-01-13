const fs = require('fs');
const { parse } = require('csv-parse');
const XLSX = require('xlsx');
const SpatialData = require('../models/SpatialData');
const Marker = require('../models/Marker');
const DemographicData = require('../models/DemographicData');
const EconomicData = require('../models/EconomicData');
const InfrastructureData = require('../models/InfrastructureData');

// --- HELPER FUNCTIONS ---

const handleError = (res, error, message, status = 500) => {
  console.error(message, error);
  res.status(status).json({ success: false, message, error: error.message });
};

const sendResponse = (res, data, status = 200, extras = {}) => {
  res.status(status).json({ success: true, ...extras, data });
};

// Rumus Scoring Terpusat (Biar konsisten di semua endpoint)
const calculatePotentialScore = (age = 0, income = 0, density = 0, access = 0) => {
  const ageScore = ((100 - age) / 100) * 25;
  const incomeScore = Math.min(income / 10000000, 1) * 25;
  const densityScore = Math.min(density / 10000, 1) * 25;
  const accessScore = (access / 5) * 25;
  return Math.round(ageScore + incomeScore + densityScore + accessScore);
};

// --- CONTROLLERS ---

// CREATE
exports.createSpatialData = async (req, res) => {
  try {
    const { markerId, averageAge, averageIncome, populationDensity, roadAccessibility } = req.body;

    // Validasi dasar
    if (!markerId || [averageAge, averageIncome, populationDensity, roadAccessibility].includes(undefined)) {
      return handleError(res, { message: 'Missing fields' }, 'Semua field wajib diisi', 400);
    }
    
    if (!req.user?._id) return handleError(res, { message: 'Unauthorized' }, 'User tidak valid', 401);

    const newSpatial = await SpatialData.create({
      markerId,
      averageAge,
      averageIncome,
      populationDensity,
      roadAccessibility,
      createdBy: req.user._id
    });

    sendResponse(res, newSpatial);

  } catch (err) {
    handleError(res, err, 'Gagal membuat data spasial');
  }
};

// READ ALL
exports.getAllSpatialData = async (req, res) => {
  try {
    const spatialData = await SpatialData.find()
      .populate('markerId', 'title latitude longitude category')
      .populate('createdBy', 'username email')
      .sort({ potentialScore: -1 });

    sendResponse(res, spatialData, 200, { count: spatialData.length });

  } catch (error) {
    handleError(res, error, 'Error fetching spatial data');
  }
};

// READ ONE
exports.getSpatialDataByMarker = async (req, res) => {
  try {
    const spatialData = await SpatialData.findOne({ markerId: req.params.markerId })
      .populate('markerId')
      .populate('createdBy', 'username email');

    if (!spatialData) return handleError(res, { message: 'Not Found' }, 'Data spasial tidak ditemukan', 404);

    sendResponse(res, spatialData);

  } catch (error) {
    handleError(res, error, 'Error fetching spatial data');
  }
};

// UPDATE
exports.updateSpatialData = async (req, res) => {
  try {
    const spatialData = await SpatialData.findById(req.params.id);
    if (!spatialData) return handleError(res, { message: 'Not Found' }, 'Data spasial tidak ditemukan', 404);

    const fields = ['averageAge', 'averageIncome', 'populationDensity', 'roadAccessibility'];
    fields.forEach(field => {
      if (req.body[field] !== undefined) spatialData[field] = req.body[field];
    });

    spatialData.updatedAt = Date.now();
    await spatialData.save(); // Trigger pre-save hook for score calculation

    sendResponse(res, spatialData, 200, { message: 'Data spasial berhasil diupdate' });

  } catch (error) {
    handleError(res, error, 'Error updating spatial data');
  }
};

// DELETE
exports.deleteSpatialData = async (req, res) => {
  try {
    const spatialData = await SpatialData.findByIdAndDelete(req.params.id);
    if (!spatialData) return handleError(res, { message: 'Not Found' }, 'Data spasial tidak ditemukan', 404);

    sendResponse(res, null, 200, { message: 'Data spasial berhasil dihapus' });

  } catch (error) {
    handleError(res, error, 'Error deleting spatial data');
  }
};

// STATISTICS
exports.getStatistics = async (req, res) => {
  try {
    const [stats, topLocations] = await Promise.all([
      SpatialData.aggregate([
        {
          $group: {
            _id: null,
            avgPotentialScore: { $avg: '$potentialScore' },
            maxPotentialScore: { $max: '$potentialScore' },
            minPotentialScore: { $min: '$potentialScore' },
            avgAge: { $avg: '$averageAge' },
            avgIncome: { $avg: '$averageIncome' },
            avgDensity: { $avg: '$populationDensity' },
            totalLocations: { $sum: 1 }
          }
        }
      ]),
      SpatialData.find()
        .populate('markerId', 'title latitude longitude category')
        .sort({ potentialScore: -1 })
        .limit(5)
    ]);

    sendResponse(res, { statistics: stats[0] || {}, topLocations });

  } catch (error) {
    handleError(res, error, 'Error fetching statistics');
  }
};

// UPLOAD DATA
exports.uploadSpatialData = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return handleError(res, { message: 'Missing file' }, 'No file uploaded', 400);

    let records = [];
    
    // Parse logic
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      const parser = fs.createReadStream(file.path).pipe(parse({ columns: true, skip_empty_lines: true }));
      for await (const record of parser) records.push(record);
    } else if (file.originalname.match(/\.(xlsx|xls)$/)) {
      const workbook = XLSX.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      records = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else {
      return handleError(res, { message: 'Invalid type' }, 'Unsupported file type', 400);
    }

    // Add Creator ID
    const dataToInsert = records.map(r => ({ ...r, createdBy: req.user.id }));
    const inserted = await SpatialData.insertMany(dataToInsert);
    
    fs.unlinkSync(file.path); // Clean up
    sendResponse(res, null, 200, { message: 'Data uploaded successfully', count: inserted.length });

  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path); // Clean up on error
    handleError(res, err, err.message);
  }
};

// PREDICT
exports.predictBusinessPotential = async (req, res) => {
  try {
    const { latitude, longitude, category, price } = req.body;
    
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return handleError(res, { message: 'Invalid Input' }, 'Invalid coords', 400);
    }

    // Cari data terdekat (Aggregation Pipeline)
    const spatial = await SpatialData.aggregate([
      {
        $lookup: { from: 'markers', localField: 'markerId', foreignField: '_id', as: 'marker' }
      },
      { $unwind: '$marker' },
      {
        $addFields: {
          distance: {
            $sqrt: {
              $add: [
                { $pow: [{ $subtract: ['$marker.latitude', latitude] }, 2] },
                { $pow: [{ $subtract: ['$marker.longitude', longitude] }, 2] }
              ]
            }
          }
        }
      },
      { $sort: { distance: 1 } },
      { $limit: 1 }
    ]);

    if (!spatial.length) return handleError(res, { message: 'Not Found' }, 'No nearby data found', 404);

    const data = spatial[0];
    
    // Gunakan Helper Function untuk hitung skor
    const score = calculatePotentialScore(
      data.averageAge, 
      data.averageIncome, 
      data.populationDensity, 
      data.roadAccessibility
    );

    // Labeling
    let categoryLabel = 'Rendah';
    if (score >= 75) categoryLabel = 'Sangat Tinggi';
    else if (score >= 60) categoryLabel = 'Tinggi';
    else if (score >= 40) categoryLabel = 'Sedang';

    sendResponse(res, {
      score,
      category: categoryLabel,
      detail: {
        averageAge: data.averageAge,
        averageIncome: data.averageIncome,
        populationDensity: data.populationDensity,
        roadAccessibility: data.roadAccessibility
      }
    });

  } catch (err) {
    handleError(res, err, err.message);
  }
};

// GET COMBINED DATA (Complex Merge Logic Refactored)
exports.getAllCombinedData = async (req, res) => {
  try {
    const [demographics, economics, infrastructures] = await Promise.all([
      DemographicData.find().populate('markerId').lean(), // .lean() biar lebih ringan
      EconomicData.find().populate('markerId').lean(),
      InfrastructureData.find().populate('markerId').lean()
    ]);

    const combinedMap = new Map();

    // Helper kecil untuk init atau get object di Map
    const getOrInit = (id, doc) => {
      if (!combinedMap.has(id)) {
        combinedMap.set(id, {
          markerId: doc.markerId,
          averageAge: 0, populationDensity: 0, averageIncome: 0, roadAccessibility: 0,
          createdAt: doc.createdAt, updatedAt: doc.updatedAt
        });
      }
      return combinedMap.get(id);
    };

    // Merging Process
    demographics.forEach(d => {
      if (d.markerId) {
        const item = getOrInit(d.markerId._id.toString(), d);
        item.averageAge = d.averageAge;
        item.populationDensity = d.populationDensity;
      }
    });

    economics.forEach(e => {
      if (e.markerId) {
        const item = getOrInit(e.markerId._id.toString(), e);
        item.averageIncome = e.averageIncome;
      }
    });

    infrastructures.forEach(i => {
      if (i.markerId) {
        const item = getOrInit(i.markerId._id.toString(), i);
        item.roadAccessibility = i.roadAccessibility;
      }
    });

    // Calculate Scores & Final Array
    const combinedData = Array.from(combinedMap.values()).map(item => ({
      ...item,
      potentialScore: calculatePotentialScore(
        item.averageAge, 
        item.averageIncome, 
        item.populationDensity, 
        item.roadAccessibility
      )
    }));

    sendResponse(res, combinedData);

  } catch (error) {
    handleError(res, error, 'Gagal mengambil data gabungan');
  }
};

// GET COMBINED BY ID
exports.getCombinedDataByMarkerId = async (req, res) => {
  try {
    const { markerId } = req.params;

    const [demographic, economic, infrastructure] = await Promise.all([
      DemographicData.findOne({ markerId }).populate('markerId').lean(),
      EconomicData.findOne({ markerId }).populate('markerId').lean(),
      InfrastructureData.findOne({ markerId }).populate('markerId').lean()
    ]);

    if (!demographic && !economic && !infrastructure) {
      return handleError(res, { message: 'Not Found' }, 'Data tidak ditemukan', 404);
    }

    // Extract values safely
    const baseData = demographic || economic || infrastructure;
    const avgAge = demographic?.averageAge || 0;
    const avgIncome = economic?.averageIncome || 0;
    const popDensity = demographic?.populationDensity || 0;
    const roadAccess = infrastructure?.roadAccessibility || 0;

    const data = {
      _id: baseData._id,
      markerId: baseData.markerId,
      averageAge: avgAge,
      averageIncome: avgIncome,
      populationDensity: popDensity,
      roadAccessibility: roadAccess,
      potentialScore: calculatePotentialScore(avgAge, avgIncome, popDensity, roadAccess),
      createdAt: baseData.createdAt,
      updatedAt: baseData.updatedAt
    };

    sendResponse(res, data);

  } catch (error) {
    handleError(res, error, 'Gagal mengambil data gabungan');
  }
};