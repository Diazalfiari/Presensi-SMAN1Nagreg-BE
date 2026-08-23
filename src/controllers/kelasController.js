/**
 * src/controllers/kelasController.js
 * Controller untuk manajemen kelas, penetapan wali kelas, dan mutasi siswa.
 */
const KelasService = require('../services/kelasService');
const apiResponse = require('../utils/apiResponse');

class KelasController {
  static async getAllClasses(req, res, next) {
    try {
      const { tingkat } = req.query;
      const classes = await KelasService.getAllClasses({ tingkat });
      return apiResponse.success(res, 'Daftar kelas berhasil dimuat.', classes);
    } catch (err) {
      next(err);
    }
  }

  static async getClassDetail(req, res, next) {
    try {
      const classDetail = await KelasService.getClassDetail(req.params.id);
      return apiResponse.success(res, 'Detail kelas berhasil dimuat.', classDetail);
    } catch (err) {
      return apiResponse.error(res, err.message, 404);
    }
  }

  static async createClass(req, res, next) {
    try {
      const classId = await KelasService.createClass(req.body, req.user);
      return apiResponse.success(res, 'Kelas baru berhasil ditambahkan.', { id: classId }, 201);
    } catch (err) {
      return apiResponse.error(res, err.message, 400);
    }
  }

  static async updateClass(req, res, next) {
    try {
      await KelasService.updateClass(req.params.id, req.body, req.user);
      return apiResponse.success(res, 'Data kelas berhasil diperbarui.');
    } catch (err) {
      return apiResponse.error(res, err.message, 400);
    }
  }

  static async deleteClass(req, res, next) {
    try {
      await KelasService.deleteClass(req.params.id, req.user);
      return apiResponse.success(res, 'Kelas berhasil dihapus.');
    } catch (err) {
      return apiResponse.error(res, err.message, 400);
    }
  }

  static async mutateStudent(req, res, next) {
    try {
      const { studentId, studentIds, newClassId } = req.body;
      const ids = studentIds || studentId;
      if (!ids || (Array.isArray(ids) && ids.length === 0) || !newClassId) {
        return apiResponse.error(res, 'studentId / studentIds dan newClassId wajib diisi.', 400);
      }

      const result = await KelasService.mutateStudent(ids, newClassId, req.user);
      return apiResponse.success(
        res,
        `Berhasil memindahkan ${result.count} siswa ke kelas ${result.targetClass}.`,
        result
      );
    } catch (err) {
      return apiResponse.error(res, err.message, 400);
    }
  }

  static async promoteClass(req, res, next) {
    try {
      const result = await KelasService.promoteClass(req.params.id, req.body, req.user);
      return apiResponse.success(
        res,
        `Kenaikan kelas berhasil diproses. Sebanyak ${result.count} siswa berhasil dinaikkan ke kelas ${result.targetClass}.`,
        result
      );
    } catch (err) {
      return apiResponse.error(res, err.message, 400);
    }
  }

  static async graduateClass(req, res, next) {
    try {
      const result = await KelasService.graduateClass(req.params.id, req.body, req.user);
      return apiResponse.success(
        res,
        `Kelulusan berhasil diproses. Sebanyak ${result.count} siswa dari kelas ${result.className} telah berstatus Lulus.`,
        result
      );
    } catch (err) {
      return apiResponse.error(res, err.message, 400);
    }
  }

  static async promoteBatch(req, res, next) {
    try {
      const { tingkatAsal } = req.body;
      const result = await KelasService.promoteBatchTingkat(tingkatAsal, req.user);
      return apiResponse.success(
        res,
        `Kenaikan kelas 1 angkatan berhasil diproses. Total ${result.totalSiswa} siswa di ${result.totalKelas} rombel berhasil naik ke Tingkat ${result.tingkatTujuan}.`,
        result
      );
    } catch (err) {
      return apiResponse.error(res, err.message, 400);
    }
  }

  static async graduateBatch(req, res, next) {
    try {
      const { tingkat } = req.body;
      const result = await KelasService.graduateBatchTingkat(tingkat || 'XII', req.user);
      return apiResponse.success(
        res,
        `Kelulusan 1 angkatan berhasil diproses. Total ${result.totalSiswa} siswa di ${result.totalKelas} rombel telah dinyatakan Lulus.`,
        result
      );
    } catch (err) {
      return apiResponse.error(res, err.message, 400);
    }
  }
}

module.exports = KelasController;
