const Marker = require('../models/Marker');

// @desc    Get all markers
// @route   GET /api/markers
// @access  Private
exports.getAllMarkers = async (req, res) => {
  try {
    const { category, search, limit = 100 } = req.query;
    
    let query = { isActive: true };
    
    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Search by title or description
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
    
    res.status(200).json({
      success: true,
      count: markers.length,
      data: markers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching markers',
      error: error.message
    });
  }
};

// @desc    Get single marker by ID
// @route   GET /api/markers/:id
// @access  Private
exports.getMarkerById = async (req, res) => {
  try {
    const marker = await Marker.findById(req.params.id)
      .populate('createdBy', 'username email');
    
    if (!marker) {
      return res.status(404).json({
        success: false,
        message: 'Marker not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: marker
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching marker',
      error: error.message
    });
  }
};

// @desc    Create new marker
// @route   POST /api/markers
// @access  Private/Admin
exports.createMarker = async (req, res) => {
  try {
    // Menambahkan createdBy dari req.user yang disediakan oleh middleware 'protect'
    const newMarkerData = {
      ...req.body,
      createdBy: req.user.id // <-- Mengambil ID user dari token
    };

    const marker = await Marker.create(newMarkerData);
    
    res.status(201).json({
      success: true,
      message: 'Marker created successfully',
      data: marker
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating marker',
      error: error.message
    });
  }
};

// @desc    Update marker
// @route   PUT /api/markers/:id
// @access  Private/Admin
exports.updateMarker = async (req, res) => {
  try {
    const marker = await Marker.findById(req.params.id);

    if (!marker) {
      return res.status(404).json({
        success: false,
        message: 'Marker not found'
      });
    }

    // Hanya admin yang bisa mengupdate, ini sesuai dengan routes Anda (protect, isAdmin)
    // Logika otorisasi kepemilikan (jika bukan admin) bisa ditambahkan di sini, tapi kita ikuti routes: Admin Only.
    
    const updatedMarker = await Marker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Marker updated successfully',
      data: updatedMarker
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating marker',
      error: error.message
    });
  }
};

// @desc    Delete marker
// @route   DELETE /api/markers/:id
// @access  Private/Admin
exports.deleteMarker = async (req, res) => {
  try {
    const marker = await Marker.findByIdAndDelete(req.params.id);
    
    if (!marker) {
      return res.status(404).json({
        success: false,
        message: 'Marker not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Marker deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting marker',
      error: error.message
    });
  }
};

// @desc    Get markers by location (nearby)
// @route   GET /api/markers/nearby
// @access  Private
exports.getNearbyMarkers = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide latitude and longitude'
      });
    }
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusInKm = parseFloat(radius);
    
    // Simple calculation (1 degree ≈ 111 km)
    const latRange = radiusInKm / 111;
    const lngRange = radiusInKm / (111 * Math.cos(lat * Math.PI / 180));
    
    const markers = await Marker.find({
      latitude: { $gte: lat - latRange, $lte: lat + latRange },
      longitude: { $gte: lng - lngRange, $lte: lng + lngRange },
      isActive: true
    });
    
    res.status(200).json({
      success: true,
      count: markers.length,
      radius: `${radiusInKm} km`,
      data: markers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby markers',
      error: error.message
    });
  }
};

// @desc    Get markers statistics
// @route   GET /api/markers/stats
// @access  Private
exports.getMarkerStats = async (req, res) => {
  try {
    const stats = await Marker.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    const totalMarkers = await Marker.countDocuments({ isActive: true });
    
    res.status(200).json({
      success: true,
      data: {
        total: totalMarkers,
        byCategory: stats
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