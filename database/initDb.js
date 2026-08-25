/**
 * database/initDb.js
 * Skrip otomatis untuk inisialisasi skema tabel dan seeding data MySQL.
 * Kompatibel dengan Local MySQL & Railway Cloud MySQL.
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function initDatabase() {
  const uri = process.env.MYSQL_URL || process.env.DATABASE_URL;
  let dbConfig = {};

  if (uri) {
    try {
      const parsedUrl = new URL(uri);
      dbConfig = {
        host: parsedUrl.hostname,
        port: parseInt(parsedUrl.port || '3306', 10),
        user: decodeURIComponent(parsedUrl.username || 'root'),
        password: decodeURIComponent(parsedUrl.password || ''),
        database: parsedUrl.pathname ? parsedUrl.pathname.replace(/^\//, '') : 'railway',
      };
    } catch (e) {
      dbConfig = { uri };
    }
  } else {
    dbConfig = {
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

  console.log(`\n🔄 Memulai inisialisasi database MySQL...`);

  let connection;
  try {
    if (dbConfig.host) {
      console.log(`🔌 Menghubungkan ke MySQL di ${dbConfig.host}:${dbConfig.port} (DB: ${dbConfig.database})...`);

      // Coba buat database dulu jika user memiliki akses root/create database di localhost
      if (dbConfig.host === 'localhost' || dbConfig.host === '127.0.0.1') {
        try {
          const rootConn = await mysql.createConnection({
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.user,
            password: dbConfig.password,
          });
          await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
          await rootConn.end();
        } catch (createDbErr) {
          // Abaikan
        }
      }

      connection = await mysql.createConnection({
        ...dbConfig,
        multipleStatements: true,
        ssl: isSsl ? { rejectUnauthorized: false } : undefined,
      });
    } else {
      console.log(`🔌 Menghubungkan menggunakan Connection URI...`);
      connection = await mysql.createConnection({
        uri: dbConfig.uri,
        multipleStatements: true,
        ssl: isSsl ? { rejectUnauthorized: false } : undefined,
      });
    }

    console.log('✅ Berhasil terhubung ke server database.');

    // 1. Jalankan schema.sql
    console.log('⏳ Menjalankan skrip schema.sql...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Hapus statement CREATE DATABASE / USE statis agar fleksibel untuk database nama apapun
    schemaSql = schemaSql
      .replace(/CREATE DATABASE[\s\S]*?;/gi, '')
      .replace(/USE\s+[`\w]+;/gi, '');

    await connection.query(schemaSql);
    console.log('✅ Skema tabel (9 tabel relasional) berhasil dibuat.');

    // 2. Hash default passwords
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const guruPasswordHash = await bcrypt.hash('guru123', 10);
    const siswaPasswordHash = await bcrypt.hash('siswa123', 10);

    // 3. Jalankan seeders.sql
    console.log('⏳ Menjalankan skrip seeders.sql...');
    const seedersPath = path.join(__dirname, 'seeders.sql');
    let seedersSql = fs.readFileSync(seedersPath, 'utf8');

    // Hapus USE statis
    seedersSql = seedersSql.replace(/USE\s+[`\w]+;/gi, '');

    // Replace placeholder hash with verified bcrypt hashes
    seedersSql = seedersSql
      .replace(/VALUES\s*\(1,\s*'admin',\s*'[^']+'/, `VALUES (1, 'admin', '${adminPasswordHash}'`)
      .replace(/\(2,\s*'guru',\s*'[^']+'/, `(2, 'guru', '${guruPasswordHash}'`)
      .replace(/\(3,\s*'siswa',\s*'[^']+'/, `(3, 'siswa', '${siswaPasswordHash}'`)
      .replace(/\(4,\s*'guru_matematika',\s*'[^']+'/, `(4, 'guru_matematika', '${guruPasswordHash}'`)
      .replace(/\(5,\s*'guru_fisika',\s*'[^']+'/, `(5, 'guru_fisika', '${guruPasswordHash}'`);

    await connection.query(seedersSql);
    console.log('✅ Data seeder awal berhasil dimasukkan.');

    console.log('\n🎉 Inisialisasi database selesai! Siap digunakan oleh server Express.js.\n');
  } catch (err) {
    console.error('❌ Terjadi kesalahan saat inisialisasi database:', err.message);
    console.log('💡 Tip: Pastikan MySQL Server (XAMPP / Laragon / Railway MySQL) aktif dan variabel DB benar.');
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;

