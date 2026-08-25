/**
 * src/config/appConfig.js
 * Konstanta aplikasi dan konfigurasi lingkungan.
 */
require('dotenv').config();

const parseClientUrls = (urlEnv) => {
  if (!urlEnv) return ['http://localhost:3000', 'http://127.0.0.1:3000'];
  return urlEnv
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, '')) // Hapus trailing slash
    .filter(Boolean);
};

module.exports = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  allowedOrigins: parseClientUrls(process.env.CLIENT_URL),
  jwt: {
    secret: process.env.JWT_SECRET || 'sman1nagreg_jwt_secret_default_key_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10 MB
  },
};

