/**
 * src/config/database.js
 * Konfigurasi koneksi Pool MySQL menggunakan mysql2/promise.
 * Mendukung Railway MySQL (MYSQL_URL / MYSQLHOST) dan Local Development.
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

const parseDatabaseConfig = () => {
  const uri = process.env.MYSQL_URL || process.env.DATABASE_URL;
  let config = {};

  if (uri) {
    try {
      const parsedUrl = new URL(uri);
      config = {
        host: parsedUrl.hostname,
        port: parseInt(parsedUrl.port || '3306', 10),
        user: decodeURIComponent(parsedUrl.username || 'root'),
        password: decodeURIComponent(parsedUrl.password || ''),
        database: parsedUrl.pathname ? parsedUrl.pathname.replace(/^\//, '') : 'railway',
      };
    } catch (e) {
      console.warn('⚠️ Gagal parse MYSQL_URL sebagai URL, menggunakan direct URI.');
      config = { uri };
    }
  } else {
    config = {
      host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
      port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10),
      user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
      password: process.env.DB_PASSWORD !== undefined
        ? process.env.DB_PASSWORD
        : (process.env.MYSQLPASSWORD || ''),
      database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'db_presensi_sman1nagreg',
    };
  }

  const isSsl = process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true';

  return {
    ...config,
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    dateStrings: true,
    timezone: '+07:00', // WIB (Waktu Indonesia Barat)
    ssl: isSsl ? { rejectUnauthorized: false } : undefined,
  };
};

const dbOptions = parseDatabaseConfig();
const pool = mysql.createPool(dbOptions);

// Otomatis set timezone WIB untuk setiap koneksi baru dari pool
pool.pool.on('connection', (connection) => {
  connection.query("SET time_zone = '+07:00'");
});

// Helper function untuk test koneksi
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    // Set timezone MySQL session ke WIB (Asia/Jakarta)
    await connection.query("SET time_zone = '+07:00'");
    const [rows] = await connection.query('SELECT DATABASE() AS currentDb, @@version AS version, NOW() AS serverTime');
    const activeDb = rows[0]?.currentDb || dbOptions.database || 'connected';
    console.log(`✅ Terhubung ke Database MySQL [${activeDb}] di ${dbOptions.host || 'remote'} (v${rows[0]?.version || 'unknown'})`);
    console.log(`🕐 Waktu Server MySQL (WIB): ${rows[0]?.serverTime || 'unknown'}`);
    connection.release();
    return true;
  } catch (error) {
    console.error(`❌ Gagal terhubung ke Database MySQL (${dbOptions.host || 'unknown'}:${dbOptions.port || 3306}):`, error.message);
    if ((dbOptions.host === 'localhost' || dbOptions.host === '127.0.0.1') && process.env.NODE_ENV === 'production') {
      console.error('💡 TIP: Di Railway, pastikan Anda telah menambahkan variabel MYSQL_URL di tab Variables service Backend!');
    }
    return false;
  }
};

module.exports = {
  pool,
  query: (sql, params) => pool.query(sql, params),
  testConnection,
};

