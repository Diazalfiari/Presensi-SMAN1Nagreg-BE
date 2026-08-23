/**
 * src/models/TeachingSession.js
 * Model operasi database untuk tabel teaching_sessions (Sesi mengajar, materi, tugas & kuis).
 */
const { pool } = require('../config/database');

class TeachingSession {
  static async findByScheduleAndDate(scheduleId, tanggal) {
    const [rows] = await pool.query(
      `SELECT ts.*, sch.mapel_id, sch.kelas_id, sch.teacher_id, sch.jam_mulai, sch.jam_selesai, sch.ruang,
              sub.nama_mapel, cls.nama_kelas
       FROM teaching_sessions ts
       JOIN schedules sch ON sch.id = ts.schedule_id
       JOIN subjects sub ON sub.id = sch.mapel_id
       JOIN classes cls ON cls.id = sch.kelas_id
       WHERE ts.schedule_id = ? AND ts.tanggal = ?
       LIMIT 1`,
      [scheduleId, tanggal]
    );
    return rows[0] || null;
  }

  static async findOrCreate(scheduleId, tanggal) {
    let session = await this.findByScheduleAndDate(scheduleId, tanggal);
    if (!session) {
      const [result] = await pool.query(
        `INSERT INTO teaching_sessions (schedule_id, tanggal, status_sesi) 
         VALUES (?, ?, 'Belum Dimulai')`,
        [scheduleId, tanggal]
      );
      session = await this.findById(result.insertId);
    }
    return session;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT ts.*, sch.mapel_id, sch.kelas_id, sch.teacher_id, sch.jam_mulai, sch.jam_selesai, sch.ruang,
              sub.nama_mapel, cls.nama_kelas, u.nama AS nama_guru
       FROM teaching_sessions ts
       JOIN schedules sch ON sch.id = ts.schedule_id
       JOIN subjects sub ON sub.id = sch.mapel_id
       JOIN classes cls ON cls.id = sch.kelas_id
       JOIN teachers t ON t.id = sch.teacher_id
       JOIN users u ON u.id = t.user_id
       WHERE ts.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async updateStatus(id, statusSesi) {
    const startedAt = statusSesi === 'Sedang Berlangsung' ? new Date() : null;
    const endedAt = statusSesi === 'Selesai' ? new Date() : null;

    await pool.query(
      `UPDATE teaching_sessions 
       SET status_sesi = ?,
           started_at = COALESCE(?, started_at),
           ended_at = COALESCE(?, ended_at)
       WHERE id = ?`,
      [statusSesi, startedAt, endedAt, id]
    );
  }

  static async updateMateriDanTugas(id, { topikMateri, deskripsiMateri, tugasSiswa, kuisEvaluasi }) {
    await pool.query(
      `UPDATE teaching_sessions 
       SET topik_materi = ?,
           deskripsi_materi = ?,
           tugas_siswa = ?,
           kuis_evaluasi = ?
       WHERE id = ?`,
      [topikMateri || null, deskripsiMateri || null, tugasSiswa || null, kuisEvaluasi || null, id]
    );
  }

  static async getHistoryByTeacher(teacherId, { page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM teaching_sessions ts
       JOIN schedules sch ON sch.id = ts.schedule_id
       WHERE sch.teacher_id = ? AND (ts.status_sesi = 'Selesai' OR (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = ts.id) > 0)`,
      [teacherId]
    );
    const totalItems = countRows[0]?.total || 0;

    const [rows] = await pool.query(
      `SELECT ts.id, ts.schedule_id, ts.tanggal, ts.status_sesi, ts.topik_materi, ts.created_at,
              sch.jam_mulai, sch.jam_selesai, sch.ruang, sch.mapel_id, sch.kelas_id,
              sub.nama_mapel, cls.nama_kelas, cls.tingkat,
              (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = ts.id AND ar.status = 'Hadir') AS hadir,
              (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = ts.id AND ar.status = 'Sakit') AS sakit,
              (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = ts.id AND ar.status = 'Izin') AS izin,
              (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = ts.id AND ar.status = 'Alpa') AS alpa,
              (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = ts.id AND ar.status = 'Hadir') AS hadir_count,
              (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = ts.id AND ar.status = 'Sakit') AS sakit_count,
              (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = ts.id AND ar.status = 'Izin') AS izin_count,
              (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = ts.id AND ar.status = 'Alpa') AS alpa_count,
              (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = ts.id) AS total_siswa
       FROM teaching_sessions ts
       JOIN schedules sch ON sch.id = ts.schedule_id
       JOIN subjects sub ON sub.id = sch.mapel_id
       JOIN classes cls ON cls.id = sch.kelas_id
       WHERE sch.teacher_id = ? AND (ts.status_sesi = 'Selesai' OR (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = ts.id) > 0)
       ORDER BY ts.tanggal DESC, ts.id DESC
       LIMIT ? OFFSET ?`,
      [teacherId, parseInt(limit, 10), parseInt(offset, 10)]
    );

    return { items: rows, totalItems };
  }
}

module.exports = TeachingSession;
