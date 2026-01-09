const fs = require('fs');
const { parse } = require('csv-parse');
const XLSX = require('xlsx');
const SpatialData = require('../models/SpatialData');
const Marker = require('../models/Marker');
const DemographicData = require('../models/DemographicData');
const EconomicData = require('../models/EconomicData');
const InfrastructureData = require('../models/InfrastructureData');

// @desc    CREATE - Tambah data spasial
// @route   POST /api/spatial-data
// @access  Private/Admin
exports.createSpatialData = async (req, res) => {
  try {
    // DEBUG: log user dan body
    console.log('REQ.USER:', req.user);
    console.log('REQ.BODY:', req.body);

    const { markerId, averageAge, averageIncome, populationDensity, roadAccessibility } = req.body;

    // Validasi input
    if (!markerId || averageAge === undefined || averageIncome === undefined || populationDensity === undefined || roadAccessibility === undefined) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi.' });
    }

    // Pastikan req.user ada dan _id valid
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'User tidak ditemukan atau belum login.' });
    }

    const data = {
      markerId,
      averageAge,
      averageIncome,
      populationDensity,
      roadAccessibility,
      createdBy: req.user._id // <-- PENTING: gunakan _id
    };

    // DEBUG: log data yang akan disimpan
    console.log('SpatialData input:', data);

    const newSpatial = await SpatialData.create(data);
    res.json({ success: true, data: newSpatial });
  } catch (err) {
    console.error('SpatialData CREATE ERROR:', err); // WAJIB
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    READ ALL - Get all spatial data
// @route   GET /api/spatial-data
// @access  Private
exports.getAllSpatialData = async (req, res) => {
  try {
    const spatialData = await SpatialData.find()
      .populate('markerId', 'title latitude longitude category')
      .populate('createdBy', 'username email')
      .sort({ potentialScore: -1 });

    res.json({
      success: true,
      count: spatialData.length,
      data: spatialData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching spatial data',
      error: error.message
    });
  }
};

// @desc    READ ONE - Get spatial data by marker ID
// @route   GET /api/spatial-data/marker/:markerId
// @access  Private
exports.getSpatialDataByMarker = async (req, res) => {
  try {
    const spatialData = await SpatialData.findOne({ markerId: req.params.markerId })
      .populate('markerId')
      .populate('createdBy', 'username email');

    if (!spatialData) {
      return res.status(404).json({
        success: false,
        message: 'Data spasial tidak ditemukan untuk marker ini'
      });
    }

    res.json({
      success: true,
      data: spatialData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching spatial data',
      error: error.message
    });
  }
};

// @desc    UPDATE - Update spatial data
// @route   PUT /api/spatial-data/:id
// @access  Private/Admin
exports.updateSpatialData = async (req, res) => {
  try {
    const {
      averageAge,
      averageIncome,
      populationDensity,
      roadAccessibility
    } = req.body;

    const spatialData = await SpatialData.findById(req.params.id);

    if (!spatialData) {
      return res.status(404).json({
        success: false,
        message: 'Data spasial tidak ditemukan'
      });
    }

    // Update fields
    if (averageAge !== undefined) spatialData.averageAge = averageAge;
    if (averageIncome !== undefined) spatialData.averageIncome = averageIncome;
    if (populationDensity !== undefined) spatialData.populationDensity = populationDensity;
    if (roadAccessibility !== undefined) spatialData.roadAccessibility = roadAccessibility;

    spatialData.updatedAt = Date.now();

    await spatialData.save(); // Pre-save hook akan recalculate potentialScore

    res.json({
      success: true,
      message: 'Data spasial berhasil diupdate',
      data: spatialData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating spatial data',
      error: error.message
    });
  }
};

// @desc    DELETE - Delete spatial data
// @route   DELETE /api/spatial-data/:id
// @access  Private/Admin
exports.deleteSpatialData = async (req, res) => {
  try {
    const spatialData = await SpatialData.findByIdAndDelete(req.params.id);

    if (!spatialData) {
      return res.status(404).json({
        success: false,
        message: 'Data spasial tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Data spasial berhasil dihapus'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting spatial data',
      error: error.message
    });
  }
};

// @desc    GET STATISTICS - Get analysis statistics
// @route   GET /api/spatial-data/statistics
// @access  Private
exports.getStatistics = async (req, res) => {
  try {
    const stats = await SpatialData.aggregate([
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
    ]);

    const topLocations = await SpatialData.find()
      .populate('markerId', 'title latitude longitude category')
      .sort({ potentialScore: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        statistics: stats[0] || {},
        topLocations
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

exports.uploadSpatialData = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    let records = [];
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      const parser = fs.createReadStream(file.path).pipe(parse({ columns: true, skip_empty_lines: true }));
      for await (const record of parser) {
        records.push(record);
      }
    } else if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.endsWith('.xlsx')
    ) {
      const workbook = XLSX.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      records = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else {
      return res.status(400).json({ message: 'Unsupported file type' });
    }

    // Tambahkan createdBy ke setiap record
    const userId = req.user.id;
    records = records.map(r => ({
      ...r,
      createdBy: userId
    }));

    const inserted = await SpatialData.insertMany(records);
    fs.unlinkSync(file.path); // Hapus file setelah diproses
    res.json({ message: 'Data uploaded successfully', count: inserted.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
/**
 * @desc    Prediksi potensi bisnis berdasarkan lokasi, kategori, harga produk
 * @route   POST /api/spatial-data/predict
 * @access  Public/User
 * @body    { latitude, longitude, category, price }
 */
exports.predictBusinessPotential = async (req, res) => {
  try {
    const { latitude, longitude, category, price } = req.body;
    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      !category ||
      typeof price !== 'number'
    ) {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }

    // Ambil data spasial terdekat (radius 2km)
    const spatial = await SpatialData.aggregate([
      {
        $lookup: {
          from: 'markers',
          localField: 'markerId',
          foreignField: '_id',
          as: 'marker'
        }
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

    if (!spatial.length) {
      return res.status(404).json({ success: false, message: 'No nearby data found' });
    }

    const data = spatial[0];

    // Rumus skor (sesuaikan dengan kebutuhan)
    let score = 0;
    score += (100 - data.averageAge) * 0.25;
    score += (data.averageIncome / 10000000) * 25;
    score += (data.populationDensity / 10000) * 25;
    score += (data.roadAccessibility / 5) * 25;

    // Kategori
    let categoryLabel = 'Rendah';
    if (score >= 75) categoryLabel = 'Sangat Tinggi';
    else if (score >= 60) categoryLabel = 'Tinggi';
    else if (score >= 40) categoryLabel = 'Sedang';

    res.json({
      success: true,
      score: Math.round(score),
      category: categoryLabel,
      detail: {
        averageAge: data.averageAge,
        averageIncome: data.averageIncome,
        populationDensity: data.populationDensity,
        roadAccessibility: data.roadAccessibility
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllCombinedData = async (req, res) => {
  try {
    const [demographics, economics, infrastructures] = await Promise.all([
      DemographicData.find().populate('markerId'),
      EconomicData.find().populate('markerId'),
      InfrastructureData.find().populate('markerId')
    ]);

    const combinedMap = new Map();

    demographics.forEach(d => {
      if (d.markerId) {
        combinedMap.set(d.markerId._id.toString(), {
          _id: d._id,
          markerId: d.markerId,
          averageAge: d.averageAge,
          populationDensity: d.populationDensity,
          averageIncome: 0,
          roadAccessibility: 0,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt
        });
      }
    });

    economics.forEach(e => {
      if (e.markerId) {
        const key = e.markerId._id.toString();
        if (combinedMap.has(key)) {
          combinedMap.get(key).averageIncome = e.averageIncome;
        } else {
          combinedMap.set(key, {
            _id: e._id,
            markerId: e.markerId,
            averageAge: 0,
            populationDensity: 0,
            averageIncome: e.averageIncome,
            roadAccessibility: 0,
            createdAt: e.createdAt,
            updatedAt: e.updatedAt
          });
        }
      }
    });

    infrastructures.forEach(i => {
      if (i.markerId) {
        const key = i.markerId._id.toString();
        if (combinedMap.has(key)) {
          combinedMap.get(key).roadAccessibility = i.roadAccessibility;
        } else {
          combinedMap.set(key, {
            _id: i._id,
            markerId: i.markerId,
            averageAge: 0,
            populationDensity: 0,
            averageIncome: 0,
            roadAccessibility: i.roadAccessibility,
            createdAt: i.createdAt,
            updatedAt: i.updatedAt
          });
        }
      }
    });

    const combinedData = Array.from(combinedMap.values()).map(item => {
      const ageScore = ((100 - item.averageAge) / 100) * 25;
      const incomeScore = Math.min(item.averageIncome / 10000000, 1) * 25;
      const densityScore = Math.min(item.populationDensity / 10000, 1) * 25;
      const accessScore = (item.roadAccessibility / 5) * 25;
      const potentialScore = Math.round(ageScore + incomeScore + densityScore + accessScore);

      return {
        ...item,
        potentialScore
      };
    });

    res.json({
      success: true,
      data: combinedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data gabungan',
      error: error.message
    });
  }
};

exports.getCombinedDataByMarkerId = async (req, res) => {
  try {
    const { markerId } = req.params;

    const [demographic, economic, infrastructure] = await Promise.all([
      DemographicData.findOne({ markerId }).populate('markerId'),
      EconomicData.findOne({ markerId }).populate('markerId'),
      InfrastructureData.findOne({ markerId }).populate('markerId')
    ]);

    if (!demographic && !economic && !infrastructure) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan untuk marker ini'
      });
    }

    const averageAge = demographic?.averageAge || 0;
    const averageIncome = economic?.averageIncome || 0;
    const populationDensity = demographic?.populationDensity || 0;
    const roadAccessibility = infrastructure?.roadAccessibility || 0;

    const ageScore = ((100 - averageAge) / 100) * 25;
    const incomeScore = Math.min(averageIncome / 10000000, 1) * 25;
    const densityScore = Math.min(populationDensity / 10000, 1) * 25;
    const accessScore = (roadAccessibility / 5) * 25;
    const potentialScore = Math.round(ageScore + incomeScore + densityScore + accessScore);

    res.json({
      success: true,
      data: {
        _id: demographic?._id || economic?._id || infrastructure?._id,
        markerId: demographic?.markerId || economic?.markerId || infrastructure?.markerId,
        averageAge,
        averageIncome,
        populationDensity,
        roadAccessibility,
        potentialScore,
        createdAt: demographic?.createdAt || economic?.createdAt || infrastructure?.createdAt,
        updatedAt: demographic?.updatedAt || economic?.updatedAt || infrastructure?.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data gabungan',
      error: error.message
    });
  }
};