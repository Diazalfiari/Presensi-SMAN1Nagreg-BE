/**
 * src/routes/index.js
 * Central Router Aggregator untuk seluruh modul RESTful API (/api).
 */
const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const presensiRoutes = require('./presensiRoutes');
const userRoutes = require('./userRoutes');
const kelasRoutes = require('./kelasRoutes');
const jadwalRoutes = require('./jadwalRoutes');
const logRoutes = require('./logRoutes');

// Endpoint Root /api
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'RESTful API Sistem Presensi SMAN 1 Nagreg aktif & siap digunakan.',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      dashboard: '/api/dashboard',
      presensi: '/api/presensi',
      users: '/api/users',
      kelas: '/api/kelas',
      jadwal: '/api/jadwal',
      logs: '/api/logs',
    },
  });
});

// Healthcheck endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend API SMAN 1 Nagreg berjalan dengan normal.',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Mount modular sub-routes
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/presensi', presensiRoutes);
router.use('/users', userRoutes);
router.use('/kelas', kelasRoutes);
router.use('/jadwal', jadwalRoutes);
router.use('/logs', logRoutes);

module.exports = router;
