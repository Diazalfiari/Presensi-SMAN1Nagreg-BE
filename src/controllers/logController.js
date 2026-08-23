/**
 * src/controllers/logController.js
 * Controller untuk query audit trail log aktivitas dan ekspor file Excel.
 */
const LogService = require('../services/logService');
const apiResponse = require('../utils/apiResponse');

class LogController {
  static async getLogs(req, res, next) {
    try {
      const { search, role, kategori, dateFilter, page = 1, limit = 10 } = req.query;

      const { items, totalItems } = await LogService.getLogs({
        search,
        role,
        kategori,
        dateFilter,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });

      return apiResponse.paginate(res, 'Daftar log aktivitas berhasil dimuat.', items, totalItems, page, limit);
    } catch (err) {
      next(err);
    }
  }

  static async getLogDetail(req, res, next) {
    try {
      const log = await LogService.getLogDetail(req.params.id);
      return apiResponse.success(res, 'Detail log aktivitas berhasil dimuat.', log);
    } catch (err) {
      return apiResponse.error(res, err.message, 404);
    }
  }

  static async exportLogsExcel(req, res, next) {
    try {
      const { search, role, kategori, dateFilter } = req.query;

      const buffer = await LogService.exportLogsToExcel({
        search,
        role,
        kategori,
        dateFilter,
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Log_Aktivitas_SMAN1Nagreg_${new Date().toISOString().split('T')[0]}.xlsx`);
      return res.send(buffer);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = LogController;
