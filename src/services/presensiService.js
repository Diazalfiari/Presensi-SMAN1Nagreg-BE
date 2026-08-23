/**
 * src/services/presensiService.js
 * Business Logic untuk pencatatan presensi sesi kelas, materi & tugas/kuis, rekapitulasi, dan matriks bulanan.
 */
const TeachingSession = require('../models/TeachingSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const Student = require('../models/Student');
const Schedule = require('../models/Schedule');
const { logActivity } = require('../middlewares/activityLogger');
const { getCurrentDateString } = require('../utils/dateHelper');

class PresensiService {
  static async getSessionDetails(scheduleId, tanggal) {
    const sessionDate = tanggal || getCurrentDateString();

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      throw new Error('Jadwal pelajaran tidak ditemukan.');
    }

    // Ambil atau buat sesi belajar mengajar untuk tanggal tersebut
    const session = await TeachingSession.findOrCreate(scheduleId, sessionDate);

    // Ambil daftar seluruh siswa di kelas terkait
    const students = await Student.findByClassId(schedule.kelas_id);

    // Ambil presensi yang sudah tersimpan
    const existingAttendance = await AttendanceRecord.findBySession(session.id);
    const attendanceMap = new Map();
    existingAttendance.forEach((item) => {
      attendanceMap.set(item.student_id, item);
    });

    // Gabungkan data siswa dengan status presensi
    const attendanceList = students.map((std) => {
      const recorded = attendanceMap.get(std.id);
      return {
        id: std.id,
        userId: std.user_id,
        nama: std.nama,
        nipd: std.nipd,
        nisn: std.nisn,
        gender: std.gender,
        status: recorded ? recorded.status : (session.status_sesi === 'Belum Dimulai' ? 'Belum Presensi' : 'Hadir'),
        isRecorded: Boolean(recorded),
        catatan: recorded ? recorded.catatan : '',
      };
    });

    return {
      session: {
        id: session.id,
        tanggal: session.tanggal,
        statusSesi: session.status_sesi,
        topikMateri: session.topik_materi || '',
        deskripsiMateri: session.deskripsi_materi || '',
        tugasSiswa: session.tugas_siswa || '',
        kuisEvaluasi: session.kuis_evaluasi || '',
      },
      schedule,
      attendance: attendanceList,
    };
  }

  static async startSession(scheduleId, tanggal, user) {
    const sessionDate = tanggal || getCurrentDateString();
    const session = await TeachingSession.findOrCreate(scheduleId, sessionDate);

    await TeachingSession.updateStatus(session.id, 'Sedang Berlangsung');

    await logActivity({
      userId: user.id,
      namaUser: user.nama,
      role: user.role,
      kategori: 'Presensi',
      aksi: 'Mulai Sesi Mengajar',
      deskripsi: `Guru '${user.nama}' memulai sesi pembelajaran tanggal ${sessionDate}.`,
      status: 'success',
    });

    return { sessionId: session.id, statusSesi: 'Sedang Berlangsung' };
  }

  static async saveSessionAttendance({
    scheduleId,
    tanggal,
    attendance,
    materi,
    tugasKuis,
    user,
    ipAddress,
    userAgent,
  }) {
    const sessionDate = tanggal || getCurrentDateString();
    const session = await TeachingSession.findOrCreate(scheduleId, sessionDate);

    // 1. Update status sesi menjadi selesai
    await TeachingSession.updateStatus(session.id, 'Selesai');

    // 2. Simpan materi pembelajaran, tugas, dan kuis
    if (materi || tugasKuis) {
      await TeachingSession.updateMateriDanTugas(session.id, {
        topikMateri: materi?.topik || null,
        deskripsiMateri: materi?.deskripsi || null,
        tugasSiswa: tugasKuis?.tugas || null,
        kuisEvaluasi: tugasKuis?.kuis || null,
      });
    }

    // 3. Simpan daftar presensi siswa
    if (Array.isArray(attendance) && attendance.length > 0) {
      await AttendanceRecord.saveBatch(session.id, attendance);
    }

    // 4. Catat aktivitas audit
    await logActivity({
      userId: user.id,
      namaUser: user.nama,
      role: user.role,
      kategori: 'Presensi',
      aksi: 'Simpan Presensi Sesi',
      deskripsi: `Guru '${user.nama}' menyimpan presensi dan materi/tugas sesi tanggal ${sessionDate} (${attendance?.length || 0} siswa).`,
      status: 'success',
      ipAddress,
      userAgent,
      payloadDetail: {
        scheduleId,
        tanggal: sessionDate,
        totalSiswa: attendance?.length || 0,
        materi: materi?.topik || '-',
      },
    });

    return true;
  }

  static async getRekapitulasi({ kelasId, startDate, endDate, tingkat }) {
    return AttendanceRecord.getRekapByDateRange({ kelasId, startDate, endDate, tingkat });
  }

  static async getMonthlyMatrix({ kelasId, bulan, tahun, mapelId }) {
    return AttendanceRecord.getMonthlyMatrix({ kelasId, bulan, tahun, mapelId });
  }
}

module.exports = PresensiService;
