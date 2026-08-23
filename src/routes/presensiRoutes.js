/**
 * src/routes/presensiRoutes.js
 * Routing untuk endpoint presensi dan sesi mengajar (/api/presensi).
 */
const express = require('express');
const router = express.Router();
const PresensiController = require('../controllers/presensiController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Sesi mengajar guru & materi pelajaran siswa
router.get('/sesi/:jadwalId', authMiddleware, roleMiddleware('admin', 'guru', 'siswa'), PresensiController.getSession);
router.post('/sesi/:jadwalId/start', authMiddleware, roleMiddleware('guru'), PresensiController.startSession);
router.post('/sesi/:jadwalId/save', authMiddleware, roleMiddleware('guru'), PresensiController.saveSession);

// Rekapitulasi & Bulanan
router.get('/rekapitulasi', authMiddleware, roleMiddleware('admin', 'guru'), PresensiController.getRekapitulasi);
router.get('/bulanan', authMiddleware, roleMiddleware('admin', 'guru'), PresensiController.getBulanan);
router.get('/bulanan/export-excel', authMiddleware, roleMiddleware('admin', 'guru'), PresensiController.exportBulananExcel);

// Riwayat presensi
router.get('/riwayat/guru', authMiddleware, roleMiddleware('guru'), PresensiController.getGuruHistory);
router.get('/riwayat/siswa', authMiddleware, roleMiddleware('siswa'), PresensiController.getSiswaHistory);

module.exports = router;
