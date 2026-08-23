/**
 * src/middlewares/errorMiddleware.js
 * Central Global Error Handler & 404 Route Handler.
 */
const apiResponse = require('../utils/apiResponse');

const notFoundHandler = (req, res, next) => {
  return apiResponse.error(res, `Endpoint '${req.method} ${req.originalUrl}' tidak ditemukan.`, 404);
};

const globalErrorHandler = (err, req, res, next) => {
  console.error('🔥 Server Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Terjadi kesalahan internal pada server.';

  return apiResponse.error(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : null);
};

module.exports = {
  notFoundHandler,
  globalErrorHandler,
};
