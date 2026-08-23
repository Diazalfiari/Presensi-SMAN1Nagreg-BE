/**
 * src/routes/authRoutes.js
 * Routing untuk endpoint autentikasi (/api/auth).
 */
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/login', AuthController.login);
router.get('/me', authMiddleware, AuthController.me);
router.post('/logout', authMiddleware, AuthController.logout);
router.put('/change-password', authMiddleware, AuthController.changePassword);

module.exports = router;
