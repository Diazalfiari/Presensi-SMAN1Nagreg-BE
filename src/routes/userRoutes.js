/**
 * src/routes/userRoutes.js
 * Routing untuk endpoint manajemen pengguna (/api/users).
 */
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { uploadExcel } = require('../middlewares/uploadMiddleware');

router.get('/', authMiddleware, roleMiddleware('admin'), UserController.getUsers);
router.get('/:id', authMiddleware, roleMiddleware('admin'), UserController.getUserDetail);
router.post('/', authMiddleware, roleMiddleware('admin'), UserController.createUser);
router.post('/bulk', authMiddleware, roleMiddleware('admin'), UserController.createUsersBulk);
router.put('/:id', authMiddleware, roleMiddleware('admin'), UserController.updateUser);
router.patch('/:id/status', authMiddleware, roleMiddleware('admin'), UserController.toggleStatus);
router.put('/:id/status', authMiddleware, roleMiddleware('admin'), UserController.toggleStatus);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), UserController.deleteUser);
router.post('/import-excel', authMiddleware, roleMiddleware('admin'), uploadExcel.single('file'), UserController.importExcel);

module.exports = router;
