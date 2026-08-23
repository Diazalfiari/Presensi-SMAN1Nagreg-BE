/**
 * src/middlewares/authMiddleware.js
 * Middleware verifikasi token JWT dari header Authorization.
 */
const jwt = require('jsonwebtoken');
const appConfig = require('../config/appConfig');
const apiResponse = require('../utils/apiResponse');
const { pool } = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return apiResponse.error(res, 'Akses ditolak. Token otentikasi tidak ditemukan.', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return apiResponse.error(res, 'Token tidak valid.', 401);
    }

    // Verifikasi token
    const decoded = jwt.verify(token, appConfig.jwt.secret);

    // Ambil data user aktif dari database
    const [rows] = await pool.query(
      'SELECT id, username, role, nama, email, is_active FROM users WHERE id = ? LIMIT 1',
      [decoded.id]
    );

    if (rows.length === 0) {
      return apiResponse.error(res, 'Akun pengguna tidak ditemukan.', 401);
    }

    const user = rows[0];

    if (!user.is_active) {
      return apiResponse.error(res, 'Akun Anda dinonaktifkan. Hubungi administrator.', 403);
    }

    // Tempelkan user data ke objek request
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return apiResponse.error(res, 'Sesi Anda telah kedaluwarsa. Silakan login kembali.', 401);
    }
    return apiResponse.error(res, 'Otorisasi gagal: Token tidak valid.', 401);
  }
};

module.exports = authMiddleware;
