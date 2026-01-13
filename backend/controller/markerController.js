const Marker = require('../models/Marker');
const { handleError, sendResponse } = require('../utils/responseHandler');

// GET ALL MARKERS
exports.getAllMarkers = async (req, res) => {
  try {
    const { category, search, limit = 100 } = req.query;
    
    let query = { isActive: true };
    
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
    const marker = await Marker.findById(req.params.id);

    if (!marker) return handleError(res, { message: 'Not Found' }, 'Marker not found', 404);
    
    const updatedMarker = await Marker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    sendResponse(res, updatedMarker, 200, { message: 'Marker updated successfully' });

  } catch (error) {
    handleError(res, error, 'Error updating marker', 400);
  }
};

// DELETE MARKER
exports.deleteMarker = async (req, res) => {
  try {
    const marker = await Marker.findByIdAndDelete(req.params.id);
    
    if (!marker) return handleError(res, { message: 'Not Found' }, 'Marker not found', 404);
    
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
      return handleError(res, { message: 'Validation Error' }, 'Please provide latitude and longitude', 400);
    }
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusInKm = parseFloat(radius);
    
    const latRange = radiusInKm / 111;
    const lngRange = radiusInKm / (111 * Math.cos(lat * Math.PI / 180));
    
    const markers = await Marker.find({
      latitude: { $gte: lat - latRange, $lte: lat + latRange },
      longitude: { $gte: lng - lngRange, $lte: lng + lngRange },
      isActive: true
    });
    
    sendResponse(res, markers, 200, { count: markers.length, radius: `${radiusInKm} km` });

  } catch (error) {
    handleError(res, error, 'Error fetching nearby markers');
  }
};

// GET MARKER STATS
exports.getMarkerStats = async (req, res) => {
  try {
    const [stats, total] = await Promise.all([
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
    
    sendResponse(res, { total, byCategory: stats });

  } catch (error) {
    handleError(res, error, 'Error fetching statistics');
  }
};