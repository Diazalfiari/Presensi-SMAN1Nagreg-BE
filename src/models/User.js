/**
 * src/models/User.js
 * Model operasi database untuk tabel users.
 */
const { pool } = require('../config/database');

class User {
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.role, u.nama, u.email, u.phone, u.is_active, u.created_at,
              t.id AS teacher_id, t.nip, t.spesialisasi,
              s.id AS student_id, s.nipd, s.nisn, s.kelas_id, s.gender, s.alamat, s.status AS status_siswa, c.nama_kelas
       FROM users u
       LEFT JOIN teachers t ON t.user_id = u.id
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN classes c ON c.id = s.kelas_id
       WHERE u.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByUsername(username) {
    const [rows] = await pool.query(
      `SELECT u.*, 
              t.id AS teacher_id, t.nip, t.spesialisasi,
              s.id AS student_id, s.nipd, s.nisn, s.kelas_id, s.gender, s.alamat, s.status AS status_siswa, c.nama_kelas
       FROM users u
       LEFT JOIN teachers t ON t.user_id = u.id
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN classes c ON c.id = s.kelas_id
       WHERE u.username = ? LIMIT 1`,
      [username]
    );
    return rows[0] || null;
  }

  static async findByEmail(email) {
    if (!email) return null;
    const [rows] = await pool.query(
      `SELECT id, username, email FROM users WHERE email = ? LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  }

  static async findAll({ role, search, page = 1, limit = 10 }) {
    let whereConditions = [];
    let queryParams = [];

    if (role && role !== 'Semua') {
      whereConditions.push('u.role = ?');
      queryParams.push(role);
    }

    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      let searchFields = [
        'u.nama LIKE ?',
        'u.username LIKE ?',
        'u.email LIKE ?',
        'u.phone LIKE ?',
        's.nipd LIKE ?',
        's.nisn LIKE ?',
        's.alamat LIKE ?',
        'c.nama_kelas LIKE ?',
        't.nip LIKE ?',
        't.spesialisasi LIKE ?',
      ];
      const searchParam = `%${q}%`;
      const searchParamsArray = searchFields.map(() => searchParam);

      const lowerQ = q.toLowerCase();
      if (lowerQ === 'laki-laki' || lowerQ === 'laki' || lowerQ === 'l') {
        searchFields.push("s.gender = 'L'");
      } else if (lowerQ === 'perempuan' || lowerQ === 'p') {
        searchFields.push("s.gender = 'P'");
      }

      whereConditions.push(`(${searchFields.join(' OR ')})`);
      queryParams.push(...searchParamsArray);
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Hitung total items (sertakan classes join agar pencarian nama_kelas konsisten)
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM users u
       LEFT JOIN teachers t ON t.user_id = u.id
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN classes c ON c.id = s.kelas_id
       ${whereSql}`,
      queryParams
    );
    const totalItems = countRows[0].total;

    // Ambil data terpaginasi
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.role, u.nama, u.email, u.phone, u.is_active, u.created_at,
              t.id AS teacher_id, t.nip, t.spesialisasi,
              s.id AS student_id, s.nipd, s.nisn, s.kelas_id, s.gender, s.alamat, s.status AS status_siswa, c.nama_kelas
       FROM users u
       LEFT JOIN teachers t ON t.user_id = u.id
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN classes c ON c.id = s.kelas_id
       ${whereSql}
       ORDER BY u.id DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit, 10), parseInt(offset, 10)]
    );

    return { items: rows, totalItems };
  }

  static async create({ username, password, role, nama, email, phone }) {
    const [result] = await pool.query(
      `INSERT INTO users (username, password, role, nama, email, phone) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, password, role, nama, email || null, phone || null]
    );
    return result.insertId;
  }

  static async update(id, { nama, email, phone, is_active, role }) {
    await pool.query(
      `UPDATE users 
       SET nama = COALESCE(?, nama),
           email = COALESCE(?, email),
           phone = COALESCE(?, phone),
           is_active = COALESCE(?, is_active),
           role = COALESCE(?, role)
       WHERE id = ?`,
      [
        nama !== undefined ? nama : null,
        email !== undefined ? email : null,
        phone !== undefined ? phone : null,
        is_active !== undefined ? (is_active ? 1 : 0) : null,
        role !== undefined ? role : null,
        id,
      ]
    );
  }

  static async updatePassword(id, hashedPassword) {
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
  }

  static async delete(id) {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
  }
}

module.exports = User;
