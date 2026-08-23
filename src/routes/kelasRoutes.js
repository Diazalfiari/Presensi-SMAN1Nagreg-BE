/**
 * src/routes/kelasRoutes.js
 * Routing untuk endpoint manajemen kelas & mutasi siswa (/api/kelas).
 */
const express = require('express');
const router = express.Router();
const KelasController = require('../controllers/kelasController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.get('/', authMiddleware, roleMiddleware('admin', 'guru'), KelasController.getAllClasses);
router.post('/naik-kelas-angkatan', authMiddleware, roleMiddleware('admin'), KelasController.promoteBatch);
router.post('/lulus-angkatan', authMiddleware, roleMiddleware('admin'), KelasController.graduateBatch);
router.get('/:id', authMiddleware, roleMiddleware('admin', 'guru'), KelasController.getClassDetail);
router.post('/', authMiddleware, roleMiddleware('admin'), KelasController.createClass);
router.put('/:id', authMiddleware, roleMiddleware('admin'), KelasController.updateClass);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), KelasController.deleteClass);
router.post('/:id/mutasi-siswa', authMiddleware, roleMiddleware('admin'), KelasController.mutateStudent);
router.post('/:id/naik-kelas', authMiddleware, roleMiddleware('admin'), KelasController.promoteClass);
router.post('/:id/lulus', authMiddleware, roleMiddleware('admin'), KelasController.graduateClass);

module.exports = router;
