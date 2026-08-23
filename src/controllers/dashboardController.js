/**
 * src/controllers/dashboardController.js
 * Controller untuk dashboard metrics per peran (Admin, Guru, Siswa).
 */
const DashboardService = require('../services/dashboardService');
const apiResponse = require('../utils/apiResponse');

class DashboardController {
  static async getAdminDashboard(req, res, next) {
    try {
      const data = await DashboardService.getAdminDashboard();
      return apiResponse.success(res, 'Data dashboard admin berhasil dimuat.', data);
    } catch (err) {
      next(err);
    }
  }

  static async getGuruDashboard(req, res, next) {
    try {
      const data = await DashboardService.getGuruDashboard(req.user);
      return apiResponse.success(res, 'Data dashboard guru berhasil dimuat.', data);
    } catch (err) {
      next(err);
    }
  }

  static async getSiswaDashboard(req, res, next) {
    try {
      const data = await DashboardService.getSiswaDashboard(req.user);
      return apiResponse.success(res, 'Data dashboard siswa berhasil dimuat.', data);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DashboardController;
