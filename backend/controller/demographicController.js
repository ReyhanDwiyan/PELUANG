const DemographicData = require('../models/DemographicData');
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
exports.createDemographicData = async (req, res) => {
  try {
    const { markerId, averageAge, populationDensity } = req.body;

    // 1. Validasi Marker
    const marker = await Marker.findById(markerId);
    if (!marker) {
      return handleError(res, { message: 'Not Found' }, 'Marker tidak ditemukan', 404);
    }

    // 2. Validasi Duplikat
    const existingData = await DemographicData.findOne({ markerId });
    if (existingData) {
      return handleError(res, { message: 'Duplicate' }, 'Data demografi untuk marker ini sudah ada', 400);
    }

    // 3. Create & Populate
    const newItem = await DemographicData.create({
      markerId,
      averageAge,
      populationDensity,
      createdBy: req.user.userId
    });

    const populatedData = await DemographicData.findById(newItem._id).populate('markerId');

    sendResponse(res, populatedData, 201, 'Data demografi berhasil ditambahkan');

  } catch (error) {
    handleError(res, error, 'Gagal menambahkan data demografi');
  }
};

// GET ALL
exports.getAllDemographicData = async (req, res) => {
  try {
    const data = await DemographicData.find()
      .populate('markerId')
      .sort({ createdAt: -1 });

    sendResponse(res, data);

  } catch (error) {
    handleError(res, error, 'Gagal mengambil data demografi');
  }
};

// GET BY MARKER ID
exports.getDemographicDataByMarkerId = async (req, res) => {
  try {
    const data = await DemographicData.findOne({ markerId: req.params.markerId })
      .populate('markerId');

    if (!data) {
      return handleError(res, { message: 'Not Found' }, 'Data demografi tidak ditemukan', 404);
    }

    sendResponse(res, data);

  } catch (error) {
    handleError(res, error, 'Gagal mengambil data demografi');
  }
};

// UPDATE
exports.updateDemographicData = async (req, res) => {
  try {
    const { averageAge, populationDensity } = req.body;

    const data = await DemographicData.findByIdAndUpdate(
      req.params.id,
      { averageAge, populationDensity },
      { new: true, runValidators: true }
    ).populate('markerId');

    if (!data) {
      return handleError(res, { message: 'Not Found' }, 'Data demografi tidak ditemukan', 404);
    }

    sendResponse(res, data, 200, 'Data demografi berhasil diupdate');

  } catch (error) {
    handleError(res, error, 'Gagal mengupdate data demografi');
  }
};

// DELETE
exports.deleteDemographicData = async (req, res) => {
  try {
    const data = await DemographicData.findByIdAndDelete(req.params.id);

    if (!data) {
      return handleError(res, { message: 'Not Found' }, 'Data demografi tidak ditemukan', 404);
    }

    sendResponse(res, undefined, 200, 'Data demografi berhasil dihapus');

  } catch (error) {
    handleError(res, error, 'Gagal menghapus data demografi');
  }
};