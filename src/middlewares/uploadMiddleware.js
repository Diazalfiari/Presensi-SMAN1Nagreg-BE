/**
 * src/middlewares/uploadMiddleware.js
 * Konfigurasi Multer untuk upload file spreadsheet Excel & dokumen.
 */
const multer = require('multer');
const path = require('path');
const appConfig = require('../config/appConfig');

// Memory storage untuk parsing Excel langsung tanpa menyimpan ke disk lokal
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.xlsx', '.xls', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Harap unggah file spreadsheet Excel (.xlsx / .xls).'), false);
  }
};

const uploadExcel = multer({
  storage,
  limits: { fileSize: appConfig.upload.maxFileSize },
  fileFilter,
});

module.exports = {
  uploadExcel,
};
