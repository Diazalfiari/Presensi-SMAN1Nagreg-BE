/**
 * src/models/Teacher.js
 * Model operasi database untuk tabel teachers.
 */
const { pool } = require('../config/database');

class Teacher {
  static async findByUserId(userId) {
    const [rows] = await pool.query(
      `SELECT t.*, u.nama, u.username, u.email, u.phone 
       FROM teachers t
       JOIN users u ON u.id = t.user_id
       WHERE t.user_id = ? LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT t.*, u.nama, u.username, u.email, u.phone 
       FROM teachers t
       JOIN users u ON u.id = t.user_id
       WHERE t.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByNip(nip) {
    if (!nip) return null;
    const [rows] = await pool.query(
      `SELECT id, user_id, nip FROM teachers WHERE nip = ? LIMIT 1`,
      [nip]
    );
    return rows[0] || null;
  }

  static async findAll() {
    const [rows] = await pool.query(
      `SELECT t.id, t.user_id, t.nip, t.spesialisasi, u.nama, u.email, u.phone 
       FROM teachers t
       JOIN users u ON u.id = t.user_id
       ORDER BY u.nama ASC`
    );
    return rows;
  }

  static async create({ userId, nip, spesialisasi }) {
    const [result] = await pool.query(
      `INSERT INTO teachers (user_id, nip, spesialisasi) 
       VALUES (?, ?, ?)`,
      [userId, nip || null, spesialisasi || null]
    );
    return result.insertId;
  }

  static async updateByUserId(userId, { nip, spesialisasi }) {
    await pool.query(
      `UPDATE teachers 
       SET nip = COALESCE(?, nip),
           spesialisasi = COALESCE(?, spesialisasi)
       WHERE user_id = ?`,
      [nip, spesialisasi, userId]
    );
  }
}

module.exports = Teacher;
