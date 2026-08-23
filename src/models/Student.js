/**
 * src/models/Student.js
 * Model operasi database untuk tabel students.
 */
const { pool } = require('../config/database');

class Student {
  static async findByUserId(userId) {
    const [rows] = await pool.query(
      `SELECT s.*, u.nama, u.username, u.email, u.phone, c.nama_kelas, c.tingkat
       FROM students s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN classes c ON c.id = s.kelas_id
       WHERE s.user_id = ? LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT s.*, u.nama, u.username, u.email, c.nama_kelas, c.tingkat
       FROM students s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN classes c ON c.id = s.kelas_id
       WHERE s.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByClassId(classId) {
    const [rows] = await pool.query(
      `SELECT s.id, s.user_id, s.nipd, s.nisn, s.gender, s.alamat, s.status, u.nama, u.username, u.email, u.phone
       FROM students s
       JOIN users u ON u.id = s.user_id
       WHERE s.kelas_id = ? AND (s.status = 'aktif' OR s.status IS NULL)
       ORDER BY u.nama ASC`,
      [classId]
    );
    return rows;
  }

  static async findByNipd(nipd) {
    if (!nipd) return null;
    const [rows] = await pool.query(
      `SELECT id, user_id, nipd FROM students WHERE nipd = ? LIMIT 1`,
      [nipd]
    );
    return rows[0] || null;
  }

  static async findByNisn(nisn) {
    if (!nisn) return null;
    const [rows] = await pool.query(
      `SELECT id, user_id, nisn FROM students WHERE nisn = ? LIMIT 1`,
      [nisn]
    );
    return rows[0] || null;
  }

  static async create({ userId, kelasId, nipd, nisn, gender, alamat }) {
    const [result] = await pool.query(
      `INSERT INTO students (user_id, kelas_id, nipd, nisn, gender, alamat, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'aktif')`,
      [userId, kelasId || null, nipd, nisn || null, gender || 'L', alamat || null]
    );
    return result.insertId;
  }

  static async updateByUserId(userId, { nipd, nisn, gender, alamat, kelasId, status }) {
    await pool.query(
      `UPDATE students 
       SET nipd = COALESCE(?, nipd),
           nisn = COALESCE(?, nisn),
           gender = COALESCE(?, gender),
           alamat = COALESCE(?, alamat),
           kelas_id = COALESCE(?, kelas_id),
           status = COALESCE(?, status)
       WHERE user_id = ?`,
      [nipd || null, nisn || null, gender || null, alamat || null, kelasId || null, status || null, userId]
    );
  }

  static async updateClass(studentId, newClassId) {
    await pool.query('UPDATE students SET kelas_id = ?, status = \'aktif\' WHERE id = ?', [newClassId, studentId]);
  }

  static async promoteStudents(studentIds, targetClassId) {
    if (!studentIds || studentIds.length === 0) return;
    await pool.query(
      `UPDATE students 
       SET kelas_id = ?, status = 'aktif' 
       WHERE id IN (?)`,
      [targetClassId, studentIds]
    );
  }

  static async graduateStudents(studentIds) {
    if (!studentIds || studentIds.length === 0) return;
    // Ambil user_id untuk menonaktifkan akun / menandai status
    const [students] = await pool.query(
      `SELECT user_id FROM students WHERE id IN (?)`,
      [studentIds]
    );
    const userIds = students.map((s) => s.user_id).filter(Boolean);

    await pool.query(
      `UPDATE students 
       SET status = 'lulus', kelas_id = NULL 
       WHERE id IN (?)`,
      [studentIds]
    );

    if (userIds.length > 0) {
      await pool.query(
        `UPDATE users SET is_active = FALSE WHERE id IN (?)`,
        [userIds]
      );
    }
  }
}

module.exports = Student;
