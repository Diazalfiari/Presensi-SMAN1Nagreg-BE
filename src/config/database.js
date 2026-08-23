/**
 * src/config/database.js
 * Konfigurasi koneksi Pool MySQL menggunakan mysql2/promise.
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db_presensi_sman1nagreg',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  dateStrings: true,
});

// Helper function untuk test koneksi
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Terhubung ke Database MySQL:', process.env.DB_NAME || 'db_presensi_sman1nagreg');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Gagal terhubung ke Database MySQL:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  query: (sql, params) => pool.query(sql, params),
  testConnection,
};
