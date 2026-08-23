/**
 * src/routes/logRoutes.js
 * Routing untuk endpoint audit trail log aktivitas (/api/logs).
 */
const express = require('express');
const router = express.Router();
const LogController = require('../controllers/logController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.get('/', authMiddleware, roleMiddleware('admin'), LogController.getLogs);
router.get('/export-excel', authMiddleware, roleMiddleware('admin'), LogController.exportLogsExcel);
router.get('/:id', authMiddleware, roleMiddleware('admin'), LogController.getLogDetail);

module.exports = router;
