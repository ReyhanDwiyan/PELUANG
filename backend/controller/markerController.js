const Marker = require('../models/Marker');

// --- HELPER FUNCTIONS ---

// 1. Standard Error Handler
const handleError = (res, error, message, status = 500) => {
  console.error(message, error); // Opsional: log error server
  res.status(status).json({
    success: false,
    message,
    error: error.message
  });
};

// 2. Standard Success Response
const sendResponse = (res, data, status = 200, extras = {}) => {
  res.status(status).json({
    success: true,
    ...extras, // Untuk count, message, atau radius
    data
  });
};

// 3. Helper Geo (Memisahkan logika matematika dari controller)
const calculateGeoBounds = (lat, lng, radiusKm) => {
  const latRange = radiusKm / 111;
  const lngRange = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
  return {
    minLat: lat - latRange,
    maxLat: lat + latRange,
    minLng: lng - lngRange,
    maxLng: lng + lngRange
  };
};


// --- MAIN CONTROLLERS ---

// GET ALL MARKERS
exports.getAllMarkers = async (req, res) => {
  try {
    const { category, search, limit = 100 } = req.query;
    
    // Build Query
    const query = { isActive: true };
    
    if (category && category !== 'all') query.category = category;
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const markers = await Marker.find(query)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username email');
    
    sendResponse(res, markers, 200, { count: markers.length });

  } catch (error) {
    handleError(res, error, 'Error fetching markers');
  }
};

// GET SINGLE MARKER
exports.getMarkerById = async (req, res) => {
  try {
    const marker = await Marker.findById(req.params.id)
      .populate('createdBy', 'username email');
    
    if (!marker) return handleError(res, { message: 'Not Found' }, 'Marker not found', 404);
    
    sendResponse(res, marker);

  } catch (error) {
    handleError(res, error, 'Error fetching marker');
  }
};

// CREATE MARKER
exports.createMarker = async (req, res) => {
  try {
    const newMarkerData = {
      ...req.body,
      createdBy: req.user.id
    };

    const marker = await Marker.create(newMarkerData);
    
    sendResponse(res, marker, 201, { message: 'Marker created successfully' });

  } catch (error) {
    handleError(res, error, 'Error creating marker', 400);
  }
};

// UPDATE MARKER
exports.updateMarker = async (req, res) => {
  try {
    let marker = await Marker.findById(req.params.id);

    if (!marker) return handleError(res, { message: 'Not Found' }, 'Marker not found', 404);

    marker = await Marker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    sendResponse(res, marker, 200, { message: 'Marker updated successfully' });

  } catch (error) {
    handleError(res, error, 'Error updating marker', 400);
  }
};

// DELETE MARKER
exports.deleteMarker = async (req, res) => {
  try {
    const marker = await Marker.findByIdAndDelete(req.params.id);
    
    if (!marker) return handleError(res, { message: 'Not Found' }, 'Marker not found', 404);
    
    // Kirim null sebagai data karena sudah dihapus
    sendResponse(res, null, 200, { message: 'Marker deleted successfully' });

  } catch (error) {
    handleError(res, error, 'Error deleting marker');
  }
};

// GET NEARBY MARKERS
exports.getNearbyMarkers = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;
    
    if (!latitude || !longitude) {
      return handleError(res, { message: 'Missing params' }, 'Please provide latitude and longitude', 400);
    }
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusInKm = parseFloat(radius);
    
    // Panggil helper function untuk hitungan matematika
    const bounds = calculateGeoBounds(lat, lng, radiusInKm);
    
    const markers = await Marker.find({
      latitude: { $gte: bounds.minLat, $lte: bounds.maxLat },
      longitude: { $gte: bounds.minLng, $lte: bounds.maxLng },
      isActive: true
    });
    
    sendResponse(res, markers, 200, { 
      count: markers.length, 
      radius: `${radiusInKm} km` 
    });

  } catch (error) {
    handleError(res, error, 'Error fetching nearby markers');
  }
};

// GET MARKER STATS
exports.getMarkerStats = async (req, res) => {
  try {
    const [stats, totalMarkers] = await Promise.all([
      Marker.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avgRating: { $avg: '$rating' }
          }
        },
        { $sort: { count: -1 } }
      ]),
      Marker.countDocuments({ isActive: true })
    ]);
    
    sendResponse(res, { total: totalMarkers, byCategory: stats });

  } catch (error) {
    handleError(res, error, 'Error fetching statistics');
  }
};