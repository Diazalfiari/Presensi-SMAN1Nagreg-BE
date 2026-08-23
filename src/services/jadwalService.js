/**
 * src/services/jadwalService.js
 * Business Logic untuk pembuatan dan pengelolaan jadwal pelajaran sekolah.
 */
const Schedule = require('../models/Schedule');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const { pool } = require('../config/database');
const { logActivity } = require('../middlewares/activityLogger');

class JadwalService {
  static async getAllSchedules(filters) {
    const schedules = await Schedule.findAll(filters);
    return schedules.map((s) => ({
      ...s,
      tanggal_spesifik: typeof s.tanggal_spesifik === 'string' ? JSON.parse(s.tanggal_spesifik) : s.tanggal_spesifik,
    }));
  }

  static async getScheduleById(id) {
    const schedule = await Schedule.findById(id);
    if (!schedule) {
      throw new Error('Jadwal pelajaran tidak ditemukan.');
    }
    return {
      ...schedule,
      tanggal_spesifik: typeof schedule.tanggal_spesifik === 'string' ? JSON.parse(schedule.tanggal_spesifik) : schedule.tanggal_spesifik,
    };
  }

  static async getTeacherSchedules(user) {
    const teacher = await Teacher.findByUserId(user.id);
    if (!teacher) {
      return [];
    }
    const schedules = await Schedule.findAll({ teacherId: teacher.id });
    return schedules.map((s) => ({
      ...s,
      tanggal_spesifik: typeof s.tanggal_spesifik === 'string' ? JSON.parse(s.tanggal_spesifik) : s.tanggal_spesifik,
    }));
  }

  static async getStudentSchedules(user) {
    const student = await Student.findByUserId(user.id);
    if (!student) {
      return [];
    }
    const schedules = await Schedule.findAll({ kelasId: student.kelas_id });
    return schedules.map((s) => ({
      ...s,
      tanggal_spesifik: typeof s.tanggal_spesifik === 'string' ? JSON.parse(s.tanggal_spesifik) : s.tanggal_spesifik,
    }));
  }

  static async createSchedule(data, adminUser) {
    const {
      mapelId,
      kelasId,
      teacherId,
      hari,
      jamMulai,
      jamSelesai,
      ruang,
      status,
      tanggalMulai,
      tanggalSelesai,
      tanggalSpesifik,
      selectedDates,
    } = data;

    if (!mapelId || !kelasId || !teacherId || !hari || !jamMulai || !jamSelesai) {
      throw new Error('Semua data jadwal wajib diisi lengkap.');
    }

    // Resolusi ID guru (baik jika dikirim teachers.id maupun users.id)
    let resolvedTeacherId = teacherId;
    const teacherById = await Teacher.findById(teacherId);
    if (!teacherById) {
      const teacherByUserId = await Teacher.findByUserId(teacherId);
      if (teacherByUserId) {
        resolvedTeacherId = teacherByUserId.id;
      }
    }

    // Olah daftar tanggal spesifik jika ada
    let datesArray = [];
    if (Array.isArray(selectedDates) && selectedDates.length > 0) {
      datesArray = selectedDates;
    } else if (Array.isArray(tanggalSpesifik) && tanggalSpesifik.length > 0) {
      datesArray = tanggalSpesifik;
    } else if (typeof tanggalSpesifik === 'string') {
      try {
        datesArray = JSON.parse(tanggalSpesifik);
      } catch {
        datesArray = [tanggalSpesifik];
      }
    }

    // Urutkan tanggal
    let finalTanggalMulai = tanggalMulai || null;
    let finalTanggalSelesai = tanggalSelesai || null;
    if (datesArray.length > 0) {
      const sorted = [...datesArray].sort();
      finalTanggalMulai = sorted[0];
      finalTanggalSelesai = sorted[sorted.length - 1];
    }

    const scheduleId = await Schedule.create({
      mapelId,
      kelasId,
      teacherId: resolvedTeacherId,
      hari,
      jamMulai,
      jamSelesai,
      ruang,
      status,
      tanggalMulai: finalTanggalMulai,
      tanggalSelesai: finalTanggalSelesai,
      tanggalSpesifik: datesArray.length > 0 ? datesArray : null,
    });

    // Otomatis buat baris teaching_sessions untuk setiap tanggal yang dipilih
    if (datesArray.length > 0) {
      for (const tgl of datesArray) {
        try {
          await pool.query(
            `INSERT INTO teaching_sessions (schedule_id, tanggal, status_sesi) 
             VALUES (?, ?, 'Belum Dimulai') 
             ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
            [scheduleId, tgl]
          );
        } catch (err) {
          console.warn(`Gagal membuat sesi untuk tanggal ${tgl}:`, err.message);
        }
      }
    }

    await logActivity({
      userId: adminUser.id,
      namaUser: adminUser.nama,
      role: adminUser.role,
      kategori: 'Jadwal',
      aksi: 'Tambah Jadwal',
      deskripsi: `Admin '${adminUser.nama}' membuat jadwal baru hari ${hari} (${jamMulai} - ${jamSelesai})${
        datesArray.length > 0 ? ` untuk ${datesArray.length} tanggal pertemuan` : ''
      }.`,
      status: 'success',
    });

    return scheduleId;
  }

  static async updateSchedule(id, data, adminUser) {
    const schedule = await Schedule.findById(id);
    if (!schedule) {
      throw new Error('Jadwal pelajaran tidak ditemukan.');
    }

    await Schedule.update(id, data);

    await logActivity({
      userId: adminUser.id,
      namaUser: adminUser.nama,
      role: adminUser.role,
      kategori: 'Jadwal',
      aksi: 'Update Jadwal',
      deskripsi: `Admin '${adminUser.nama}' memperbarui jadwal mata pelajaran '${schedule.nama_mapel}'.`,
      status: 'info',
    });

    return true;
  }

  static async deleteSchedule(id, adminUser) {
    const schedule = await Schedule.findById(id);
    if (!schedule) {
      throw new Error('Jadwal pelajaran tidak ditemukan.');
    }

    await Schedule.delete(id);

    await logActivity({
      userId: adminUser.id,
      namaUser: adminUser.nama,
      role: adminUser.role,
      kategori: 'Jadwal',
      aksi: 'Hapus Jadwal',
      deskripsi: `Admin '${adminUser.nama}' menghapus jadwal mata pelajaran '${schedule.nama_mapel}'.`,
      status: 'warning',
    });

    return true;
  }
}

module.exports = JadwalService;
