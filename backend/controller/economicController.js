const EconomicData = require('../models/EconomicData');
const Marker = require('../models/Marker');

exports.createEconomicData = async (req, res) => {
  try {
    const { markerId, averageIncome } = req.body;

    const marker = await Marker.findById(markerId);
    if (!marker) {
      return res.status(404).json({
        success: false,
        message: 'Marker tidak ditemukan'
      });
    }

    const existingData = await EconomicData.findOne({ markerId });
    if (existingData) {
      return res.status(400).json({
        success: false,
        message: 'Data ekonomi untuk marker ini sudah ada'
      });
    }

    const economicData = await EconomicData.create({
      markerId,
      averageIncome,
      createdBy: req.user.userId
    });

    const populatedData = await EconomicData.findById(economicData._id)
      .populate('markerId');

    res.status(201).json({
      success: true,
      message: 'Data ekonomi berhasil ditambahkan',
      data: populatedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan data ekonomi',
      error: error.message
    });
  }
};

exports.getAllEconomicData = async (req, res) => {
  try {
    const data = await EconomicData.find()
      .populate('markerId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data ekonomi',
      error: error.message
    });
  }
};

exports.getEconomicDataByMarkerId = async (req, res) => {
  try {
    const data = await EconomicData.findOne({ markerId: req.params.markerId })
      .populate('markerId');

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Data ekonomi tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data ekonomi',
      error: error.message
    });
  }
};

exports.updateEconomicData = async (req, res) => {
  try {
    const { averageIncome } = req.body;

    const data = await EconomicData.findByIdAndUpdate(
      req.params.id,
      { averageIncome },
      { new: true, runValidators: true }
    ).populate('markerId');

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Data ekonomi tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Data ekonomi berhasil diupdate',
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate data ekonomi',
      error: error.message
    });
  }
};

exports.deleteEconomicData = async (req, res) => {
  try {
    const data = await EconomicData.findByIdAndDelete(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Data ekonomi tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Data ekonomi berhasil dihapus'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus data ekonomi',
      error: error.message
    });
  }
};