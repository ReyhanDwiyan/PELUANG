const DemographicData = require('../models/DemographicData');
const Marker = require('../models/Marker');

exports.createDemographicData = async (req, res) => {
  try {
    const { markerId, averageAge, populationDensity } = req.body;

    const marker = await Marker.findById(markerId);
    if (!marker) {
      return res.status(404).json({
        success: false,
        message: 'Marker tidak ditemukan'
      });
    }

    const existingData = await DemographicData.findOne({ markerId });
    if (existingData) {
      return res.status(400).json({
        success: false,
        message: 'Data demografi untuk marker ini sudah ada'
      });
    }

    const demographicData = await DemographicData.create({
      markerId,
      averageAge,
      populationDensity,
      createdBy: req.user.userId
    });

    const populatedData = await DemographicData.findById(demographicData._id)
      .populate('markerId');

    res.status(201).json({
      success: true,
      message: 'Data demografi berhasil ditambahkan',
      data: populatedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan data demografi',
      error: error.message
    });
  }
};

exports.getAllDemographicData = async (req, res) => {
  try {
    const data = await DemographicData.find()
      .populate('markerId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data demografi',
      error: error.message
    });
  }
};

exports.getDemographicDataByMarkerId = async (req, res) => {
  try {
    const data = await DemographicData.findOne({ markerId: req.params.markerId })
      .populate('markerId');

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Data demografi tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data demografi',
      error: error.message
    });
  }
};

exports.updateDemographicData = async (req, res) => {
  try {
    const { averageAge, populationDensity } = req.body;

    const data = await DemographicData.findByIdAndUpdate(
      req.params.id,
      { averageAge, populationDensity },
      { new: true, runValidators: true }
    ).populate('markerId');

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Data demografi tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Data demografi berhasil diupdate',
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate data demografi',
      error: error.message
    });
  }
};

exports.deleteDemographicData = async (req, res) => {
  try {
    const data = await DemographicData.findByIdAndDelete(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Data demografi tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Data demografi berhasil dihapus'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus data demografi',
      error: error.message
    });
  }
};