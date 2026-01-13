const User = require('../models/User');

// --- HELPER FUNCTIONS ---

const handleError = (res, error, message, status = 500) => {
  res.status(status).json({
    success: false,
    message,
    error: error.message
  });
};

const sendResponse = (res, data, status = 200, extras = {}) => {
  res.status(status).json({
    success: true,
    ...extras, // Untuk message atau count
    data
  });
};

// --- CONTROLLERS ---

// GET ALL USERS
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('-password')
      .sort({ createdAt: -1 });
    
    sendResponse(res, users, 200, { count: users.length });

  } catch (error) {
    handleError(res, error, 'Error fetching users');
  }
};

// GET USER BY ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return handleError(res, { message: 'Not Found' }, 'User not found', 404);
    }
    
    sendResponse(res, user);

  } catch (error) {
    handleError(res, error, 'Error fetching user');
  }
};

// UPDATE USER
exports.updateUser = async (req, res) => {
  try {
    // Security: Hapus password dari body agar tidak di-update lewat route ini
    if (req.body.password) delete req.body.password;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return handleError(res, { message: 'Not Found' }, 'User not found', 404);
    }
    
    sendResponse(res, user, 200, { message: 'User updated successfully' });

  } catch (error) {
    handleError(res, error, 'Error updating user', 400);
  }
};

// DELETE USER (Soft Delete)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false }, // Logic soft delete dipertahankan
      { new: true }
    );
    
    if (!user) {
      return handleError(res, { message: 'Not Found' }, 'User not found', 404);
    }
    
    // Kirim null atau undefined pada data karena user dihapus (deactivated)
    sendResponse(res, undefined, 200, { message: 'User deactivated successfully' });

  } catch (error) {
    handleError(res, error, 'Error deleting user');
  }
};