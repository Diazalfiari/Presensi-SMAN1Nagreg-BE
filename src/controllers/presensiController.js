/**
 * src/controllers/presensiController.js
 * Controller untuk sesi mengajar, pencatatan presensi, rekapitulasi, dan ekspor matriks bulanan.
 */
const PresensiService = require('../services/presensiService');
const ExcelService = require('../services/excelService');
const Class = require('../models/Class');
const TeachingSession = require('../models/TeachingSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const apiResponse = require('../utils/apiResponse');

class PresensiController {
  static async getSession(req, res, next) {
    try {
      const { jadwalId } = req.params;
      const { tanggal } = req.query;

      const data = await PresensiService.getSessionDetails(jadwalId, tanggal);
      return apiResponse.success(res, 'Detail sesi presensi berhasil dimuat.', data);
    } catch (err) {
      return apiResponse.error(res, err.message, 400);
    }
  }

  static async startSession(req, res, next) {
    try {
      const { jadwalId } = req.params;
      const { tanggal } = req.body;

      const result = await PresensiService.startSession(jadwalId, tanggal, req.user);
      return apiResponse.success(res, 'Sesi pembelajaran berhasil dimulai.', result);
    } catch (err) {
      return apiResponse.error(res, err.message, 400);
    }
  }

  static async saveSession(req, res, next) {
    try {
      const { jadwalId } = req.params;
      const { tanggal, attendance, materi, tugasKuis } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      await PresensiService.saveSessionAttendance({
        scheduleId: jadwalId,
        tanggal,
        attendance,
        materi,
        tugasKuis,
        user: req.user,
        ipAddress,
        userAgent,
      });

      return apiResponse.success(res, 'Data kehadiran, materi pembelajaran, dan tugas/kuis berhasil disimpan.');
    } catch (err) {
      return apiResponse.error(res, err.message, 400);
    }
  }

  static async getRekapitulasi(req, res, next) {
    try {
      const { kelasId, startDate, endDate, tingkat } = req.query;

      const data = await PresensiService.getRekapitulasi({ kelasId, startDate, endDate, tingkat });
      return apiResponse.success(res, 'Data rekapitulasi presensi berhasil dimuat.', data);
    } catch (err) {
      next(err);
    }
  }

  static async getBulanan(req, res, next) {
    try {
      const { kelasId, bulan, tahun, mapelId } = req.query;

      if (!kelasId || !bulan || !tahun) {
        return apiResponse.error(res, 'Parameter kelasId, bulan, dan tahun wajib diisi.', 400);
      }

      const data = await PresensiService.getMonthlyMatrix({
        kelasId,
        bulan: parseInt(bulan, 10),
        tahun: parseInt(tahun, 10),
        mapelId,
      });

      return apiResponse.success(res, 'Matriks presensi bulanan berhasil dimuat.', data);
    } catch (err) {
      next(err);
    }
  }

  static async exportBulananExcel(req, res, next) {
    try {
      const { kelasId, bulan, tahun, mapelId } = req.query;

      if (!kelasId || !bulan || !tahun) {
        return apiResponse.error(res, 'Parameter kelasId, bulan, dan tahun wajib diisi.', 400);
      }

      const classObj = await Class.findById(kelasId);
      const { students, records } = await PresensiService.getMonthlyMatrix({
        kelasId,
        bulan: parseInt(bulan, 10),
        tahun: parseInt(tahun, 10),
        mapelId,
      });

      const buffer = await ExcelService.generateMonthlyReportExcel({
        kelasName: classObj?.nama_kelas || 'Kelas',
        bulan: parseInt(bulan, 10),
        tahun: parseInt(tahun, 10),
        students,
        records,
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Laporan_Presensi_${classObj?.nama_kelas || 'Kelas'}_${bulan}_${tahun}.xlsx`);
      return res.send(buffer);
    } catch (err) {
      next(err);
    }
  }

  static async getGuruHistory(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const teacher = await Teacher.findByUserId(req.user.id);

      if (!teacher) {
        return apiResponse.paginate(res, 'Riwayat sesi presensi guru', [], 0, page, limit);
      }

      const { items, totalItems } = await TeachingSession.getHistoryByTeacher(teacher.id, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });

      return apiResponse.paginate(res, 'Riwayat sesi presensi guru berhasil dimuat.', items, totalItems, page, limit);
    } catch (err) {
      next(err);
    }
  }

  static async getSiswaHistory(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const student = await Student.findByUserId(req.user.id);

      if (!student) {
        return apiResponse.paginate(res, 'Riwayat presensi siswa', [], 0, page, limit);
      }

      const { items, totalItems, summary } = await AttendanceRecord.getStudentHistory(student.id, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });

      return res.status(200).json({
        success: true,
        message: 'Riwayat presensi siswa berhasil dimuat.',
        data: items,
        summary,
        meta: {
          currentPage: parseInt(page, 10),
          itemsPerPage: parseInt(limit, 10),
          totalItems,
          totalPages: Math.ceil(totalItems / limit) || 1,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = PresensiController;
