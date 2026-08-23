/**
 * src/routes/dashboardRoutes.js
 * Routing untuk endpoint dashboard (/api/dashboard).
 */
const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.get('/admin', authMiddleware, roleMiddleware('admin'), DashboardController.getAdminDashboard);
router.get('/guru', authMiddleware, roleMiddleware('guru'), DashboardController.getGuruDashboard);
router.get('/siswa', authMiddleware, roleMiddleware('siswa'), DashboardController.getSiswaDashboard);

module.exports = router;
