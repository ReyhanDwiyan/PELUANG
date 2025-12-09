const SpatialData = require('../models/SpatialData');
const Marker = require('../models/Marker');

// @desc    CREATE - Tambah data spasial
// @route   POST /api/spatial-data
// @access  Private/Admin
exports.createSpatialData = async (req, res) => {
  try {
    const { 
      markerId, 
      averageAge, 
      averageIncome, 
      populationDensity, 
      roadAccessibility 
    } = req.body;

    // Validasi marker exists
    const marker = await Marker.findById(markerId);
    if (!marker) {
      return res.status(404).json({
        success: false,
        message: 'Marker tidak ditemukan'
      });
    }

    // Cek apakah data spasial sudah ada untuk marker ini
    const existingData = await SpatialData.findOne({ markerId });
    if (existingData) {
      return res.status(400).json({
        success: false,
        message: 'Data spasial untuk marker ini sudah ada. Gunakan update untuk mengubah.'
      });
    }

    const spatialData = new SpatialData({
      markerId,
      averageAge,
      averageIncome,
      populationDensity,
      roadAccessibility,
      createdBy: req.user.id // <-- Mengambil ID user dari token
    });

    await spatialData.save();

    res.status(201).json({
      success: true,
      message: 'Data spasial berhasil ditambahkan',
      data: spatialData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating spatial data',
      error: error.message
    });
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