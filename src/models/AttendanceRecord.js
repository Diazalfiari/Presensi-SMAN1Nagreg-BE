/**
 * src/models/AttendanceRecord.js
 * Model operasi database untuk tabel attendance_records.
 */
const { pool } = require('../config/database');

class AttendanceRecord {
  static async findBySession(sessionId) {
    const [rows] = await pool.query(
      `SELECT ar.id, ar.session_id, ar.student_id, ar.status, ar.catatan,
              s.nipd, s.nisn, u.nama AS nama_siswa, s.gender
       FROM attendance_records ar
       JOIN students s ON s.id = ar.student_id
       JOIN users u ON u.id = s.user_id
       WHERE ar.session_id = ?
       ORDER BY u.nama ASC`,
      [sessionId]
    );
    return rows;
  }

  static async saveBatch(sessionId, attendanceList) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const item of attendanceList) {
        const studentId = item.studentId || item.id;
        const status = item.status || 'Hadir';
        const catatan = item.catatan || null;

        await connection.query(
          `INSERT INTO attendance_records (session_id, student_id, status, catatan)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             status = VALUES(status),
             catatan = VALUES(catatan)`,
          [sessionId, studentId, status, catatan]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getRekapByDateRange({ kelasId, startDate, endDate, tingkat }) {
    let whereConditions = [];
    let queryParams = [];

    if (kelasId) {
      whereConditions.push('cls.id = ?');
      queryParams.push(kelasId);
    }

    if (tingkat && tingkat !== 'Semua') {
      whereConditions.push('cls.tingkat = ?');
      queryParams.push(tingkat);
    }

    if (startDate && endDate) {
      whereConditions.push('ts.tanggal BETWEEN ? AND ?');
      queryParams.push(startDate, endDate);
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT cls.id AS kelas_id, cls.nama_kelas, cls.tingkat,
              COUNT(ar.id) AS total,
              SUM(CASE WHEN ar.status = 'Hadir' THEN 1 ELSE 0 END) AS hadir,
              SUM(CASE WHEN ar.status = 'Sakit' THEN 1 ELSE 0 END) AS sakit,
              SUM(CASE WHEN ar.status = 'Izin' THEN 1 ELSE 0 END) AS izin,
              SUM(CASE WHEN ar.status = 'Alpa' THEN 1 ELSE 0 END) AS alpa
       FROM classes cls
       LEFT JOIN schedules sch ON sch.kelas_id = cls.id
       LEFT JOIN teaching_sessions ts ON ts.schedule_id = sch.id
       LEFT JOIN attendance_records ar ON ar.session_id = ts.id
       ${whereSql}
       GROUP BY cls.id, cls.nama_kelas, cls.tingkat
       ORDER BY cls.tingkat ASC, cls.nama_kelas ASC`,
      queryParams
    );

    return rows;
  }

  static async getMonthlyMatrix({ kelasId, bulan, tahun, mapelId }) {
    let queryParams = [kelasId, bulan, tahun];
    let mapelCondition = '';

    if (mapelId && mapelId !== 'all') {
      mapelCondition = 'AND sch.mapel_id = ?';
      queryParams.push(mapelId);
    }

    // Ambil daftar seluruh siswa di kelas target
    const [students] = await pool.query(
      `SELECT s.id AS student_id, s.nipd, s.nisn, u.nama AS nama_siswa
       FROM students s
       JOIN users u ON u.id = s.user_id
       WHERE s.kelas_id = ?
       ORDER BY u.nama ASC`,
      [kelasId]
    );

    // Ambil seluruh rekor presensi pada bulan & tahun tersebut
    const [records] = await pool.query(
      `SELECT ar.student_id, ar.status, DAY(ts.tanggal) AS tgl, ts.tanggal, sub.nama_mapel
       FROM attendance_records ar
       JOIN teaching_sessions ts ON ts.id = ar.session_id
       JOIN schedules sch ON sch.id = ts.schedule_id
       JOIN subjects sub ON sub.id = sch.mapel_id
       WHERE sch.kelas_id = ? 
         AND MONTH(ts.tanggal) = ? 
         AND YEAR(ts.tanggal) = ?
         ${mapelCondition}`,
      queryParams
    );

    return { students, records };
  }

  static async getStudentHistory(studentId, { page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;

    const [countRows] = await pool.query(
      'SELECT COUNT(*) AS total FROM attendance_records WHERE student_id = ?',
      [studentId]
    );
    const totalItems = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT ar.id, ar.status, ar.catatan, ar.created_at,
              ts.tanggal, ts.topik_materi,
              sch.jam_mulai, sch.jam_selesai, sch.ruang,
              sub.nama_mapel, u.nama AS nama_guru
       FROM attendance_records ar
       JOIN teaching_sessions ts ON ts.id = ar.session_id
       JOIN schedules sch ON sch.id = ts.schedule_id
       JOIN subjects sub ON sub.id = sch.mapel_id
       JOIN teachers t ON t.id = sch.teacher_id
       JOIN users u ON u.id = t.user_id
       WHERE ar.student_id = ?
       ORDER BY ts.tanggal DESC, ar.id DESC
       LIMIT ? OFFSET ?`,
      [studentId, parseInt(limit, 10), parseInt(offset, 10)]
    );

    // Hitung ringkasan status kehadiran
    const [summaryRows] = await pool.query(
      `SELECT 
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'Hadir' THEN 1 ELSE 0 END) AS hadir,
         SUM(CASE WHEN status = 'Sakit' THEN 1 ELSE 0 END) AS sakit,
         SUM(CASE WHEN status = 'Izin' THEN 1 ELSE 0 END) AS izin,
         SUM(CASE WHEN status = 'Alpa' THEN 1 ELSE 0 END) AS alpa
       FROM attendance_records 
       WHERE student_id = ?`,
      [studentId]
    );

    return { items: rows, totalItems, summary: summaryRows[0] };
  }
}

module.exports = AttendanceRecord;
