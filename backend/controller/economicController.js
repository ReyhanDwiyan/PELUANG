const EconomicData = require('../models/EconomicData');
const Marker = require('../models/Marker');

// --- HELPER FUNCTIONS ---

const handleError = (res, error, message, status = 500) => {
  res.status(status).json({
    success: false,
    message,
    error: error.message
  });
};

const sendResponse = (res, data, status = 200, message = null) => {
  const response = { success: true };
  if (message) response.message = message;
  if (data !== undefined) response.data = data;
  
  res.status(status).json(response);
};

// --- CONTROLLERS ---

// CREATE
exports.createEconomicData = async (req, res) => {
  try {
    const { markerId, averageIncome } = req.body;

    // 1. Validasi Marker
    const marker = await Marker.findById(markerId);
    if (!marker) {
      return handleError(res, { message: 'Not Found' }, 'Marker tidak ditemukan', 404);
    }

    // 2. Validasi Duplikat
    const existingData = await EconomicData.findOne({ markerId });
    if (existingData) {
      return handleError(res, { message: 'Duplicate' }, 'Data ekonomi untuk marker ini sudah ada', 400);
    }

    // 3. Create & Populate
    const newItem = await EconomicData.create({
      markerId,
      averageIncome,
      createdBy: req.user.userId
    });

    const populatedData = await EconomicData.findById(newItem._id).populate('markerId');

    sendResponse(res, populatedData, 201, 'Data ekonomi berhasil ditambahkan');

  } catch (error) {
    handleError(res, error, 'Gagal menambahkan data ekonomi');
  }
};

// GET ALL
exports.getAllEconomicData = async (req, res) => {
  try {
    const data = await EconomicData.find()
      .populate('markerId')
      .sort({ createdAt: -1 });

    sendResponse(res, data);

  } catch (error) {
    handleError(res, error, 'Gagal mengambil data ekonomi');
  }
};

// GET BY MARKER ID
exports.getEconomicDataByMarkerId = async (req, res) => {
  try {
    const data = await EconomicData.findOne({ markerId: req.params.markerId })
      .populate('markerId');

    if (!data) {
      return handleError(res, { message: 'Not Found' }, 'Data ekonomi tidak ditemukan', 404);
    }

    sendResponse(res, data);

  } catch (error) {
    handleError(res, error, 'Gagal mengambil data ekonomi');
  }
};

// UPDATE
exports.updateEconomicData = async (req, res) => {
  try {
    const { averageIncome } = req.body;

    const data = await EconomicData.findByIdAndUpdate(
      req.params.id,
      { averageIncome },
      { new: true, runValidators: true }
    ).populate('markerId');

    if (!data) {
      return handleError(res, { message: 'Not Found' }, 'Data ekonomi tidak ditemukan', 404);
    }

    sendResponse(res, data, 200, 'Data ekonomi berhasil diupdate');

  } catch (error) {
    handleError(res, error, 'Gagal mengupdate data ekonomi');
  }
};

// DELETE
exports.deleteEconomicData = async (req, res) => {
  try {
    const data = await EconomicData.findByIdAndDelete(req.params.id);

    if (!data) {
      return handleError(res, { message: 'Not Found' }, 'Data ekonomi tidak ditemukan', 404);
    }

    sendResponse(res, undefined, 200, 'Data ekonomi berhasil dihapus');

  } catch (error) {
    handleError(res, error, 'Gagal menghapus data ekonomi');
  }
};