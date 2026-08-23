/**
 * src/controllers/jadwalController.js
 * Controller untuk pembuatan dan pengelolaan jadwal pelajaran sekolah.
 */
const JadwalService = require('../services/jadwalService');
const Subject = require('../models/Subject');
const apiResponse = require('../utils/apiResponse');

class JadwalController {
  static async getAllSchedules(req, res, next) {
    try {
      const { hari, kelasId, teacherId } = req.query;
      const schedules = await JadwalService.getAllSchedules({ hari, kelasId, teacherId });
      return apiResponse.success(res, 'Daftar jadwal pelajaran berhasil dimuat.', schedules);
    } catch (err) {
      next(err);
    }
  }

  static async getScheduleById(req, res, next) {
    try {
      const schedule = await JadwalService.getScheduleById(req.params.id);
      return apiResponse.success(res, 'Detail jadwal berhasil dimuat.', schedule);
    } catch (err) {
      return apiResponse.error(res, err.message, 404);
    }
  }

  static async getTeacherSchedules(req, res, next) {
    try {
      const schedules = await JadwalService.getTeacherSchedules(req.user);
      return apiResponse.success(res, 'Jadwal mengajar guru berhasil dimuat.', schedules);
    } catch (err) {
      next(err);
    }
  }

  static async getStudentSchedules(req, res, next) {
    try {
      const schedules = await JadwalService.getStudentSchedules(req.user);
      return apiResponse.success(res, 'Jadwal pelajaran siswa berhasil dimuat.', schedules);
    } catch (err) {
      next(err);
    }
  }

  static async createSchedule(req, res, next) {
    try {
      const scheduleId = await JadwalService.createSchedule(req.body, req.user);
      return apiResponse.success(res, 'Jadwal pelajaran baru berhasil dibuat.', { id: scheduleId }, 201);
    } catch (err) {
      return apiResponse.error(res, err.message, 400);
    }
  }

  static async updateSchedule(req, res, next) {
    try {
      await JadwalService.updateSchedule(req.params.id, req.body, req.user);
      return apiResponse.success(res, 'Jadwal pelajaran berhasil diperbarui.');
    } catch (err) {
      return apiResponse.error(res, err.message, 400);
    }
  }

  static async deleteSchedule(req, res, next) {
    try {
      await JadwalService.deleteSchedule(req.params.id, req.user);
      return apiResponse.success(res, 'Jadwal pelajaran berhasil dihapus.');
    } catch (err) {
      return apiResponse.error(res, err.message, 400);
    }
  }

  static async getAllSubjects(req, res, next) {
    try {
      const subjects = await Subject.findAll();
      return apiResponse.success(res, 'Daftar mata pelajaran berhasil dimuat.', subjects);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = JadwalController;
