/**
 * src/models/Class.js
 * Model operasi database untuk tabel classes.
 */
const { pool } = require('../config/database');

class Class {
  static async findAll({ tingkat }) {
    let whereSql = '';
    let queryParams = [];

    if (tingkat && tingkat !== 'Semua') {
      whereSql = 'WHERE c.tingkat = ?';
      queryParams.push(tingkat);
    }

    const [rows] = await pool.query(
      `SELECT c.id, c.nama_kelas, c.tingkat, c.wali_kelas_id, c.tahun_ajaran,
              u.nama AS nama_wali_kelas, t.nip AS nip_wali_kelas,
              (SELECT COUNT(*) FROM students s WHERE s.kelas_id = c.id AND (s.status = 'aktif' OR s.status IS NULL)) AS total_siswa
       FROM classes c
       LEFT JOIN teachers t ON t.id = c.wali_kelas_id
       LEFT JOIN users u ON u.id = t.user_id
       ${whereSql}
       ORDER BY c.tingkat ASC, CAST(SUBSTRING_INDEX(c.nama_kelas, '-', -1) AS UNSIGNED) ASC, c.nama_kelas ASC`,
      queryParams
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT c.id, c.nama_kelas, c.tingkat, c.wali_kelas_id, c.tahun_ajaran,
              u.nama AS nama_wali_kelas, t.nip AS nip_wali_kelas,
              (SELECT COUNT(*) FROM students s WHERE s.kelas_id = c.id AND (s.status = 'aktif' OR s.status IS NULL)) AS total_siswa
       FROM classes c
       LEFT JOIN teachers t ON t.id = c.wali_kelas_id
       LEFT JOIN users u ON u.id = t.user_id
       WHERE c.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByName(namaKelas) {
    const [rows] = await pool.query(
      `SELECT c.id, c.nama_kelas, c.tingkat, c.wali_kelas_id, c.tahun_ajaran,
              u.nama AS nama_wali_kelas, t.nip AS nip_wali_kelas,
              (SELECT COUNT(*) FROM students s WHERE s.kelas_id = c.id AND (s.status = 'aktif' OR s.status IS NULL)) AS total_siswa
       FROM classes c
       LEFT JOIN teachers t ON t.id = c.wali_kelas_id
       LEFT JOIN users u ON u.id = t.user_id
       WHERE c.nama_kelas = ? LIMIT 1`,
      [namaKelas]
    );
    return rows[0] || null;
  }

  static async create({ namaKelas, tingkat, waliKelasId, tahunAjaran }) {
    const [result] = await pool.query(
      `INSERT INTO classes (nama_kelas, tingkat, wali_kelas_id, tahun_ajaran) 
       VALUES (?, ?, ?, ?)`,
      [namaKelas, tingkat, waliKelasId || null, tahunAjaran || '2025/2026']
    );
    return result.insertId;
  }

  static async update(id, { namaKelas, tingkat, waliKelasId, tahunAjaran }) {
    await pool.query(
      `UPDATE classes 
       SET nama_kelas = COALESCE(?, nama_kelas),
           tingkat = COALESCE(?, tingkat),
           wali_kelas_id = ?,
           tahun_ajaran = COALESCE(?, tahun_ajaran)
       WHERE id = ?`,
      [namaKelas, tingkat, waliKelasId, tahunAjaran, id]
    );
  }

  static async delete(id) {
    await pool.query('DELETE FROM classes WHERE id = ?', [id]);
  }
}

module.exports = Class;
