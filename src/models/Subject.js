/**
 * src/models/Subject.js
 * Model operasi database untuk tabel subjects.
 */
const { pool } = require('../config/database');

class Subject {
  static async findAll() {
    const [rows] = await pool.query('SELECT * FROM subjects ORDER BY nama_mapel ASC');
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM subjects WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  static async create({ kodeMapel, namaMapel, kategori }) {
    const [result] = await pool.query(
      `INSERT INTO subjects (kode_mapel, nama_mapel, kategori) 
       VALUES (?, ?, ?)`,
      [kodeMapel, namaMapel, kategori || 'Umum']
    );
    return result.insertId;
  }

  static async update(id, { kodeMapel, namaMapel, kategori }) {
    await pool.query(
      `UPDATE subjects 
       SET kode_mapel = COALESCE(?, kode_mapel),
           nama_mapel = COALESCE(?, nama_mapel),
           kategori = COALESCE(?, kategori)
       WHERE id = ?`,
      [kodeMapel, namaMapel, kategori, id]
    );
  }

  static async delete(id) {
    await pool.query('DELETE FROM subjects WHERE id = ?', [id]);
  }
}

module.exports = Subject;
