/**
 * src/models/ActivityLog.js
 * Model operasi database untuk tabel activity_logs.
 */
const { pool } = require('../config/database');

class ActivityLog {
  static async findAll({ search, role, kategori, dateFilter, page = 1, limit = 10 }) {
    let whereConditions = [];
    let queryParams = [];

    if (search) {
      whereConditions.push('(nama_user LIKE ? OR aksi LIKE ? OR deskripsi LIKE ? OR kategori LIKE ?)');
      const searchParam = `%${search}%`;
      queryParams.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (role && role !== 'Semua') {
      whereConditions.push('role = ?');
      queryParams.push(role);
    }

    if (kategori && kategori !== 'Semua Kategori') {
      whereConditions.push('kategori = ?');
      queryParams.push(kategori);
    }

    if (dateFilter === 'today') {
      whereConditions.push('DATE(created_at) = CURDATE()');
    } else if (dateFilter === 'yesterday') {
      whereConditions.push('DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)');
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM activity_logs ${whereSql}`,
      queryParams
    );
    const totalItems = countRows[0].total;

    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT id, user_id, nama_user, role, kategori, aksi, deskripsi, 
              status, ip_address, user_agent, payload_detail, created_at,
              DATE_FORMAT(created_at, '%Y-%m-%d') AS tanggal,
              DATE_FORMAT(created_at, '%H:%i:%s') AS waktu
       FROM activity_logs
       ${whereSql}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit, 10), parseInt(offset, 10)]
    );

    return { items: rows, totalItems };
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT id, user_id, nama_user, role, kategori, aksi, deskripsi, 
              status, ip_address, user_agent, payload_detail, created_at,
              DATE_FORMAT(created_at, '%Y-%m-%d') AS tanggal,
              DATE_FORMAT(created_at, '%H:%i:%s') AS waktu
       FROM activity_logs
       WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }
}

module.exports = ActivityLog;
