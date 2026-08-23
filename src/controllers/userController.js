/**
 * src/controllers/userController.js
 * Controller untuk manajemen pengguna dan impor data spreadsheet Excel.
 */
const UserService = require('../services/userService');
const apiResponse = require('../utils/apiResponse');

class UserController {
  static async getUsers(req, res, next) {
    try {
      const { role, search, page = 1, limit = 10 } = req.query;

      const { items, totalItems } = await UserService.getUsers({
        role,
        search,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });

      return apiResponse.paginate(res, 'Daftar pengguna berhasil dimuat.', items, totalItems, page, limit);
    } catch (err) {
      next(err);
    }
  }

  static async getUserDetail(req, res, next) {
    try {
      const user = await UserService.getUserDetail(req.params.id);
      return apiResponse.success(res, 'Detail pengguna berhasil dimuat.', user);
    } catch (err) {
      return apiResponse.error(res, err.message, 404);
    }
  }

  static async createUser(req, res, next) {
    try {
      const userId = await UserService.createUser(req.body, req.user);
      return apiResponse.success(res, 'Pengguna baru berhasil ditambahkan.', { id: userId }, 201);
    } catch (err) {
      return apiResponse.error(res, err.message, 400);
    }
  }

  static async updateUser(req, res, next) {
    try {
      await UserService.updateUser(req.params.id, req.body, req.user);
      return apiResponse.success(res, 'Data pengguna berhasil diperbarui.');
    } catch (err) {
      return apiResponse.error(res, err.message, 400);
    }
  }

  static async toggleStatus(req, res, next) {
    try {
      const { isActive } = req.body;
      const result = await UserService.toggleUserStatus(req.params.id, isActive, req.user);
      return apiResponse.success(
        res,
        `Status pengguna berhasil diubah menjadi ${result.is_active === 1 ? 'Aktif' : 'Non-aktif'}.`,
        result
      );
    } catch (err) {
      return apiResponse.error(res, err.message, 400);
    }
  }

  static async deleteUser(req, res, next) {
    try {
      await UserService.deleteUser(req.params.id, req.user);
      return apiResponse.success(res, 'Pengguna berhasil dihapus.');
    } catch (err) {
      return apiResponse.error(res, err.message, 400);
    }
  }

  static async createUsersBulk(req, res, next) {
    try {
      const { users } = req.body;
      const result = await UserService.createUsersBulk(users, req.user);
      return apiResponse.success(
        res,
        `Proses bulk insert selesai. ${result.totalBerhasil} pengguna berhasil disimpan.`,
        result,
        201
      );
    } catch (err) {
      return apiResponse.error(res, err.message, 400);
    }
  }

  static async importExcel(req, res, next) {
    try {
      if (!req.file || !req.file.buffer) {
        return apiResponse.error(res, 'File spreadsheet Excel (.xlsx) wajib diunggah.', 400);
      }

      const result = await UserService.importUsersFromExcel(req.file.buffer, req.user);
      return apiResponse.success(res, `Impor pengguna selesai. ${result.totalBerhasil} data berhasil disimpan.`, result);
    } catch (err) {
      return apiResponse.error(res, err.message, 400);
    }
  }
}

module.exports = UserController;
