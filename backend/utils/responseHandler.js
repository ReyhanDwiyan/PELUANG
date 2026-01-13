const handleError = (res, error, message, status = 500) => {
  console.error(`${message}:`, error);
  res.status(status).json({
    success: false,
    message,
    error: error.message || 'Unknown Error'
  });
};

const sendResponse = (res, data, status = 200, extras = {}) => {
  res.status(status).json({
    success: true,
    ...extras,
    data
  });
};

module.exports = { handleError, sendResponse };