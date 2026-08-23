/**
 * src/services/dashboardService.js
 * Business Logic untuk data statistik dashboard admin, guru, dan siswa.
 */
const { pool } = require('../config/database');
const AttendanceRecord = require('../models/AttendanceRecord');
const Schedule = require('../models/Schedule');
const { getDayNameFromDate, getCurrentDateString } = require('../utils/dateHelper');

class DashboardService {
  static async getAdminDashboard() {
    // 1. Total statistik entitas
    const [[{ totalSiswa }]] = await pool.query('SELECT COUNT(*) AS totalSiswa FROM students');
    const [[{ totalGuru }]] = await pool.query('SELECT COUNT(*) AS totalGuru FROM teachers');
    const [[{ totalKelas }]] = await pool.query('SELECT COUNT(*) AS totalKelas FROM classes');

    // 2. Rekapitulasi per kelas
    const rekapKelas = await AttendanceRecord.getRekapByDateRange({});

    let totalAttendance = 0;
    let totalHadir = 0;
    let totalSakit = 0;
    let totalIzin = 0;
    let totalAlpa = 0;

    const classPerformance = rekapKelas.map((cls) => {
      const total = parseInt(cls.total, 10) || 0;
      const hadir = parseInt(cls.hadir, 10) || 0;
      const sakit = parseInt(cls.sakit, 10) || 0;
      const izin = parseInt(cls.izin, 10) || 0;
      const alpa = parseInt(cls.alpa, 10) || 0;

      totalAttendance += total;
      totalHadir += hadir;
      totalSakit += sakit;
      totalIzin += izin;
      totalAlpa += alpa;

      const percentage = total > 0 ? Number(((hadir / total) * 100).toFixed(1)) : 0;

      return {
        id: cls.kelas_id,
        kelas: cls.nama_kelas,
        tingkat: cls.tingkat,
        total,
        hadir,
        sakit,
        izin,
        alpa,
        percentage,
        hasData: total > 0,
      };
    });

    const persentaseKehadiran = totalAttendance > 0 
      ? Number(((totalHadir / totalAttendance) * 100).toFixed(1)) 
      : 0;

    // Filter hanya kelas yang SUDAH memiliki data presensi
    const classesWithData = classPerformance.filter((c) => c.total > 0);

    // Kelas teratas: urutkan dari persentase kehadiran tertinggi
    const leadingClasses = [...classesWithData]
      .sort((a, b) => b.percentage - a.percentage || b.hadir - a.hadir)
      .slice(0, 4);

    // Kelas yang perlu perhatian: kelas yang punya data dengan persentase kehadiran < 85% atau memiliki alpa/sakit/izin
    const attentionClasses = [...classesWithData]
      .filter((c) => c.percentage < 85 || c.alpa > 0 || c.sakit > 0 || c.izin > 0)
      .sort((a, b) => a.percentage - b.percentage || b.alpa - a.alpa)
      .slice(0, 4);

    return {
      totalSiswa,
      totalGuru,
      totalKelas,
      persentaseKehadiran,
      stats: {
        total: totalAttendance,
        hadir: totalHadir,
        sakit: totalSakit,
        izin: totalIzin,
        alpa: totalAlpa,
      },
      rekapitulasiKelas: classPerformance,
      leadingClasses,
      attentionClasses,
    };
  }

  static async getGuruDashboard(user) {
    const todayDate = getCurrentDateString();
    const todayDayName = getDayNameFromDate(todayDate);

    // Ambil profil teacher
    const [[teacher]] = await pool.query('SELECT id FROM teachers WHERE user_id = ?', [user.id]);

    if (!teacher) {
      return { todaySchedules: [], totalSesi: 0 };
    }

    // Ambil jadwal mengajar hari ini
    const [schedules] = await pool.query(
      `SELECT sch.id, sch.mapel_id, sch.kelas_id, sch.hari, sch.jam_mulai, sch.jam_selesai, sch.ruang, sch.status,
              sub.nama_mapel, cls.nama_kelas,
              ts.id AS session_id, ts.status_sesi, ts.topik_materi
       FROM schedules sch
       JOIN subjects sub ON sub.id = sch.mapel_id
       JOIN classes cls ON cls.id = sch.kelas_id
       LEFT JOIN teaching_sessions ts ON ts.schedule_id = sch.id AND ts.tanggal = ?
       WHERE sch.teacher_id = ? AND sch.hari = ?
       ORDER BY sch.jam_mulai ASC`,
      [todayDate, teacher.id, todayDayName]
    );

    return {
      tanggal: todayDate,
      hari: todayDayName,
      todaySchedules: schedules,
      totalSesiHariIni: schedules.length,
    };
  }

  static async getSiswaDashboard(user) {
    const todayDate = getCurrentDateString();
    const todayDayName = getDayNameFromDate(todayDate);

    // Ambil profil student
    const [[student]] = await pool.query(
      `SELECT s.id, s.kelas_id, c.nama_kelas 
       FROM students s 
       JOIN classes c ON c.id = s.kelas_id 
       WHERE s.user_id = ?`,
      [user.id]
    );

    if (!student) {
      return {
        summary: { total: 0, hadir: 0, persentase: 100 },
        jadwalHariIni: [],
        riwayatTerbaru: [],
        totalRiwayat: 0,
      };
    }

    // Ambil riwayat presensi & ringkasan
    const { summary, items: riwayatTerbaru, totalItems } = await AttendanceRecord.getStudentHistory(student.id, {
      page: 1,
      limit: 5,
    });

    const total = parseInt(summary?.total || 0, 10);
    const hadir = parseInt(summary?.hadir || 0, 10);
    const sakit = parseInt(summary?.sakit || 0, 10);
    const izin = parseInt(summary?.izin || 0, 10);
    const alpa = parseInt(summary?.alpa || 0, 10);

    const persentase = total > 0 ? ((hadir / total) * 100).toFixed(1) : '100.0';

    // Jadwal pelajaran kelas siswa hari ini
    const [rawSchedules] = await pool.query(
      `SELECT sch.id, sch.jam_mulai, sch.jam_selesai, sch.ruang, sch.status, sch.tanggal_spesifik, sch.tanggal_mulai, sch.tanggal_selesai,
              sub.nama_mapel, u.nama AS nama_guru,
              ts.id AS session_id, ts.topik_materi, ts.status_sesi,
              ar.status AS status_presensi, ar.catatan AS catatan_presensi
       FROM schedules sch
       JOIN subjects sub ON sub.id = sch.mapel_id
       JOIN teachers t ON t.id = sch.teacher_id
       JOIN users u ON u.id = t.user_id
       LEFT JOIN teaching_sessions ts ON ts.schedule_id = sch.id AND ts.tanggal = ?
       LEFT JOIN attendance_records ar ON ar.session_id = ts.id AND ar.student_id = ?
       WHERE sch.kelas_id = ? AND sch.hari = ?
       ORDER BY sch.jam_mulai ASC`,
      [todayDate, student.id, student.kelas_id, todayDayName]
    );

    // Filter jadwal yang aktif hari ini
    const jadwalHariIni = rawSchedules
      .filter((sch) => {
        let dates = sch.tanggal_spesifik;
        if (typeof dates === 'string') {
          try {
            dates = JSON.parse(dates);
          } catch (e) {
            dates = null;
          }
        }
        if (Array.isArray(dates) && dates.length > 0) {
          return dates.includes(todayDate);
        }
        if (sch.tanggal_mulai && sch.tanggal_selesai) {
          const mul = typeof sch.tanggal_mulai === 'string' ? sch.tanggal_mulai.substring(0, 10) : '';
          const sel = typeof sch.tanggal_selesai === 'string' ? sch.tanggal_selesai.substring(0, 10) : '';
          return todayDate >= mul && todayDate <= sel;
        }
        return true;
      })
      .map((sch) => ({
        id: sch.id,
        nama_mapel: sch.nama_mapel,
        mataPelajaran: sch.nama_mapel,
        nama_guru: sch.nama_guru,
        guru: sch.nama_guru,
        jam_mulai: sch.jam_mulai,
        jam_selesai: sch.jam_selesai,
        waktu: `${(sch.jam_mulai || '07:30').substring(0, 5)} - ${(sch.jam_selesai || '09:00').substring(0, 5)}`,
        ruang: sch.ruang || `Kelas ${student.nama_kelas}`,
        status: sch.status || 'Offline',
        status_sesi: sch.status_sesi || 'Belum Dimulai',
        status_presensi: sch.status_presensi || (sch.status_sesi === 'Belum Dimulai' || !sch.status_sesi ? 'Belum Presensi' : 'Hadir'),
        catatan_presensi: sch.catatan_presensi || '',
      }));

    return {
      kelas: student.nama_kelas,
      summary: {
        total,
        hadir,
        sakit,
        izin,
        alpa,
        persentase: Number(persentase),
      },
      jadwalHariIni,
      riwayatTerbaru: riwayatTerbaru || [],
      totalRiwayat: totalItems || 0,
    };
  }
}

module.exports = DashboardService;
