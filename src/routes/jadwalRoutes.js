/**
 * src/routes/jadwalRoutes.js
 * Routing untuk endpoint jadwal pelajaran dan mata pelajaran (/api/jadwal & /api/mapel).
 */
const express = require('express');
const router = express.Router();
const JadwalController = require('../controllers/jadwalController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.get('/', authMiddleware, roleMiddleware('admin', 'guru'), JadwalController.getAllSchedules);
router.get('/guru', authMiddleware, roleMiddleware('guru'), JadwalController.getTeacherSchedules);
router.get('/siswa', authMiddleware, roleMiddleware('siswa'), JadwalController.getStudentSchedules);
router.get('/mata-pelajaran', authMiddleware, JadwalController.getAllSubjects);
router.get('/:id', authMiddleware, JadwalController.getScheduleById);
router.post('/', authMiddleware, roleMiddleware('admin'), JadwalController.createSchedule);
router.put('/:id', authMiddleware, roleMiddleware('admin'), JadwalController.updateSchedule);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), JadwalController.deleteSchedule);

module.exports = router;
