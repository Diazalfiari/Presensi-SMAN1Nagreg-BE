/**
 * src/models/Schedule.js
 * Model operasi database untuk tabel schedules.
 */
const { pool } = require('../config/database');

class Schedule {
  static async findAll({ hari, kelasId, teacherId }) {
    let whereConditions = [];
    let queryParams = [];

    if (hari && hari !== 'Semua') {
      whereConditions.push('sch.hari = ?');
      queryParams.push(hari);
    }

    if (kelasId) {
      whereConditions.push('sch.kelas_id = ?');
      queryParams.push(kelasId);
    }

    if (teacherId) {
      whereConditions.push('sch.teacher_id = ?');
      queryParams.push(teacherId);
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT sch.id, sch.mapel_id, sch.kelas_id, sch.teacher_id, sch.hari, 
              sch.jam_mulai, sch.jam_selesai, sch.ruang, sch.status,
              sch.tanggal_mulai, sch.tanggal_selesai, sch.tanggal_spesifik,
              sub.nama_mapel, sub.kode_mapel,
              cls.nama_kelas, cls.tingkat,
              u.nama AS nama_guru, t.nip AS nip_guru
       FROM schedules sch
       JOIN subjects sub ON sub.id = sch.mapel_id
       JOIN classes cls ON cls.id = sch.kelas_id
       JOIN teachers t ON t.id = sch.teacher_id
       JOIN users u ON u.id = t.user_id
       ${whereSql}
       ORDER BY FIELD(sch.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'), sch.jam_mulai ASC`,
      queryParams
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT sch.id, sch.mapel_id, sch.kelas_id, sch.teacher_id, sch.hari, 
              sch.jam_mulai, sch.jam_selesai, sch.ruang, sch.status,
              sch.tanggal_mulai, sch.tanggal_selesai, sch.tanggal_spesifik,
              sub.nama_mapel, sub.kode_mapel,
              cls.nama_kelas, cls.tingkat,
              u.nama AS nama_guru, t.nip AS nip_guru
       FROM schedules sch
       JOIN subjects sub ON sub.id = sch.mapel_id
       JOIN classes cls ON cls.id = sch.kelas_id
       JOIN teachers t ON t.id = sch.teacher_id
       JOIN users u ON u.id = t.user_id
       WHERE sch.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async create({ mapelId, kelasId, teacherId, hari, jamMulai, jamSelesai, ruang, status, tanggalMulai, tanggalSelesai, tanggalSpesifik }) {
    const [result] = await pool.query(
      `INSERT INTO schedules (mapel_id, kelas_id, teacher_id, hari, jam_mulai, jam_selesai, ruang, status, tanggal_mulai, tanggal_selesai, tanggal_spesifik) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        mapelId,
        kelasId,
        teacherId,
        hari,
        jamMulai,
        jamSelesai,
        ruang || 'Ruang Kelas',
        status || 'Offline',
        tanggalMulai || null,
        tanggalSelesai || null,
        tanggalSpesifik ? (typeof tanggalSpesifik === 'string' ? tanggalSpesifik : JSON.stringify(tanggalSpesifik)) : null,
      ]
    );
    return result.insertId;
  }

  static async update(id, { mapelId, kelasId, teacherId, hari, jamMulai, jamSelesai, ruang, status, tanggalMulai, tanggalSelesai, tanggalSpesifik }) {
    await pool.query(
      `UPDATE schedules 
       SET mapel_id = COALESCE(?, mapel_id),
           kelas_id = COALESCE(?, kelas_id),
           teacher_id = COALESCE(?, teacher_id),
           hari = COALESCE(?, hari),
           jam_mulai = COALESCE(?, jam_mulai),
           jam_selesai = COALESCE(?, jam_selesai),
           ruang = COALESCE(?, ruang),
           status = COALESCE(?, status),
           tanggal_mulai = COALESCE(?, tanggal_mulai),
           tanggal_selesai = COALESCE(?, tanggal_selesai),
           tanggal_spesifik = COALESCE(?, tanggal_spesifik)
       WHERE id = ?`,
      [
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
        tanggalSpesifik ? (typeof tanggalSpesifik === 'string' ? tanggalSpesifik : JSON.stringify(tanggalSpesifik)) : null,
        id,
      ]
    );
  }

  static async delete(id) {
    await pool.query('DELETE FROM schedules WHERE id = ?', [id]);
  }
}

module.exports = Schedule;
