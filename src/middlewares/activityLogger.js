/**
 * src/middlewares/activityLogger.js
 * Middleware helper untuk mencatat log aktivitas audit trail ke database.
 */
const { pool } = require('../config/database');

const logActivity = async ({
  userId = null,
  namaUser = 'Sistem',
  role = 'sistem',
  kategori = 'Sistem',
  aksi,
  deskripsi,
  status = 'success',
  ipAddress = null,
  userAgent = null,
  payloadDetail = null,
}) => {
  try {
    const query = `
      INSERT INTO activity_logs 
      (user_id, nama_user, role, kategori, aksi, deskripsi, status, ip_address, user_agent, payload_detail) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const formattedPayload = payloadDetail ? JSON.stringify(payloadDetail) : null;

    await pool.query(query, [
      userId,
      namaUser,
      role,
      kategori,
      aksi,
      deskripsi,
      status,
      ipAddress,
      userAgent,
      formattedPayload,
    ]);
  } catch (error) {
    console.error('⚠️ Gagal menyimpan activity log:', error.message);
  }
};

module.exports = {
  logActivity,
};
