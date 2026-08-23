/**
 * src/controllers/authController.js
 * Controller untuk endpoint otentikasi login, profil aktif, dan password.
 */
const AuthService = require('../services/authService');
const apiResponse = require('../utils/apiResponse');

class AuthController {
  static async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await AuthService.login({
        username,
        password,
        ipAddress,
        userAgent,
      });

      return apiResponse.success(res, 'Login berhasil.', result);
    } catch (err) {
      return apiResponse.error(res, err.message, 400);
    }
  }

  static async me(req, res, next) {
    try {
      const user = await AuthService.getMe(req.user.id);
      return apiResponse.success(res, 'Data pengguna berhasil dimuat.', user);
    } catch (err) {
      return apiResponse.error(res, err.message, 400);
    }
  }

  static async logout(req, res, next) {
    try {
      return apiResponse.success(res, 'Logout berhasil.');
    } catch (err) {
      next(err);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      await AuthService.changePassword(req.user.id, {
        oldPassword,
        newPassword,
        ipAddress,
        userAgent,
      });

      return apiResponse.success(res, 'Kata sandi berhasil diperbarui.');
    } catch (err) {
      return apiResponse.error(res, err.message, 400);
    }
  }
}

module.exports = AuthController;
