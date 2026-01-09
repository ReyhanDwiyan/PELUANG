const InfrastructureData = require('../models/InfrastructureData');
const Marker = require('../models/Marker');

exports.createInfrastructureData = async (req, res) => {
  try {
    const { markerId, roadAccessibility } = req.body;

    const marker = await Marker.findById(markerId);
    if (!marker) {
      return res.status(404).json({
        success: false,
        message: 'Marker tidak ditemukan'
      });
    }

    const existingData = await InfrastructureData.findOne({ markerId });
    if (existingData) {
      return res.status(400).json({
        success: false,
        message: 'Data infrastruktur untuk marker ini sudah ada'
      });
    }

    const infrastructureData = await InfrastructureData.create({
      markerId,
      roadAccessibility,
      createdBy: req.user.userId
    });

    const populatedData = await InfrastructureData.findById(infrastructureData._id)
      .populate('markerId');

    res.status(201).json({
      success: true,
      message: 'Data infrastruktur berhasil ditambahkan',
      data: populatedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan data infrastruktur',
      error: error.message
    });
  }
};

exports.getAllInfrastructureData = async (req, res) => {
  try {
    const data = await InfrastructureData.find()
      .populate('markerId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data infrastruktur',
      error: error.message
    });
  }
};

exports.getInfrastructureDataByMarkerId = async (req, res) => {
  try {
    const data = await InfrastructureData.findOne({ markerId: req.params.markerId })
      .populate('markerId');

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Data infrastruktur tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data infrastruktur',
      error: error.message
    });
  }
};

exports.updateInfrastructureData = async (req, res) => {
  try {
    const { roadAccessibility } = req.body;

    const data = await InfrastructureData.findByIdAndUpdate(
      req.params.id,
      { roadAccessibility },
      { new: true, runValidators: true }
    ).populate('markerId');

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Data infrastruktur tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Data infrastruktur berhasil diupdate',
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate data infrastruktur',
      error: error.message
    });
  }
};

exports.deleteInfrastructureData = async (req, res) => {
  try {
    const data = await InfrastructureData.findByIdAndDelete(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Data infrastruktur tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Data infrastruktur berhasil dihapus'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus data infrastruktur',
      error: error.message
    });
  }
};