/**
 * src/config/database.js
 * Konfigurasi koneksi Pool MySQL menggunakan mysql2/promise.
 * Mendukung Railway MySQL (MYSQL_URL / MYSQLHOST) dan Local Development.
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

const getPoolConfig = () => {
  // 1. Jika menggunakan Connection URL (Railway / PlanetScale / Cloud DB)
  if (process.env.MYSQL_URL || process.env.DATABASE_URL) {
    const connectionUri = process.env.MYSQL_URL || process.env.DATABASE_URL;
    return {
      uri: connectionUri,
      waitForConnections: true,
      connectionLimit: 15,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      dateStrings: true,
      ssl: process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true'
        ? { rejectUnauthorized: false }
        : undefined,
    };
  }

  // 2. Parameter terpisah (Railway MYSQL* atau Custom DB_*)
  const host = process.env.DB_HOST || process.env.MYSQLHOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10);
  const user = process.env.DB_USER || process.env.MYSQLUSER || 'root';
  const password = process.env.DB_PASSWORD !== undefined
    ? process.env.DB_PASSWORD
    : (process.env.MYSQLPASSWORD || '');
  const database = process.env.DB_NAME || process.env.MYSQLDATABASE || 'db_presensi_sman1nagreg';

  const config = {
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    dateStrings: true,
  };

  if (process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true') {
    config.ssl = { rejectUnauthorized: false };
  }

  return config;
};

const pool = mysql.createPool(getPoolConfig());

// Helper function untuk test koneksi
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT DATABASE() AS currentDb, @@version AS version');
    const activeDb = rows[0]?.currentDb || process.env.DB_NAME || process.env.MYSQLDATABASE || 'connected';
    console.log(`✅ Terhubung ke Database MySQL [${activeDb}] (v${rows[0]?.version || 'unknown'})`);
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

