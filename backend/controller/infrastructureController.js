const InfrastructureData = require('../models/InfrastructureData');
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
exports.createInfrastructureData = async (req, res) => {
  try {
    const { markerId, roadAccessibility } = req.body;

    // 1. Validasi Marker
    const marker = await Marker.findById(markerId);
    if (!marker) {
      return handleError(res, { message: 'Not Found' }, 'Marker tidak ditemukan', 404);
    }

    // 2. Validasi Duplikat
    const existingData = await InfrastructureData.findOne({ markerId });
    if (existingData) {
      return handleError(res, { message: 'Duplicate' }, 'Data infrastruktur untuk marker ini sudah ada', 400);
    }

    // 3. Create & Populate
    const newItem = await InfrastructureData.create({
      markerId,
      roadAccessibility,
      createdBy: req.user.userId
    });

    const populatedData = await InfrastructureData.findById(newItem._id).populate('markerId');

    sendResponse(res, populatedData, 201, 'Data infrastruktur berhasil ditambahkan');

  } catch (error) {
    handleError(res, error, 'Gagal menambahkan data infrastruktur');
  }
};

// GET ALL
exports.getAllInfrastructureData = async (req, res) => {
  try {
    const data = await InfrastructureData.find()
      .populate('markerId')
      .sort({ createdAt: -1 });

    sendResponse(res, data);

  } catch (error) {
    handleError(res, error, 'Gagal mengambil data infrastruktur');
  }
};

// GET BY MARKER ID
exports.getInfrastructureDataByMarkerId = async (req, res) => {
  try {
    const data = await InfrastructureData.findOne({ markerId: req.params.markerId })
      .populate('markerId');

    if (!data) {
      return handleError(res, { message: 'Not Found' }, 'Data infrastruktur tidak ditemukan', 404);
    }

    sendResponse(res, data);

  } catch (error) {
    handleError(res, error, 'Gagal mengambil data infrastruktur');
  }
};

// UPDATE
exports.updateInfrastructureData = async (req, res) => {
  try {
    const { roadAccessibility } = req.body;

    const data = await InfrastructureData.findByIdAndUpdate(
      req.params.id,
      { roadAccessibility },
      { new: true, runValidators: true }
    ).populate('markerId');

    if (!data) {
      return handleError(res, { message: 'Not Found' }, 'Data infrastruktur tidak ditemukan', 404);
    }

    sendResponse(res, data, 200, 'Data infrastruktur berhasil diupdate');

  } catch (error) {
    handleError(res, error, 'Gagal mengupdate data infrastruktur');
  }
};

// DELETE
exports.deleteInfrastructureData = async (req, res) => {
  try {
    const data = await InfrastructureData.findByIdAndDelete(req.params.id);

    if (!data) {
      return handleError(res, { message: 'Not Found' }, 'Data infrastruktur tidak ditemukan', 404);
    }

    sendResponse(res, undefined, 200, 'Data infrastruktur berhasil dihapus');

  } catch (error) {
    handleError(res, error, 'Gagal menghapus data infrastruktur');
  }
};