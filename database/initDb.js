/**
 * database/initDb.js
 * Skrip otomatis untuk inisialisasi skema tabel dan seeding data MySQL.
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function initDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'db_presensi_sman1nagreg';

  console.log(`\n🔄 Menghubungkan ke MySQL di ${host}:${port} sebagai '${user}'...`);

  let connection;
  try {
    // 1. Hubungkan ke MySQL server (tanpa database tertentu dulu)
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true,
    });

    console.log('✅ Berhasil terhubung ke server MySQL.');

    // 2. Buat database jika belum ada
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${dbName}\`;`);
    console.log(`✅ Menggunakan database: '${dbName}'.`);

    // 3. Jalankan schema.sql
    console.log('⏳ Menjalankan skrip schema.sql...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schemaSql);
    console.log('✅ Skema tabel (9 tabel relasional) berhasil dibuat.');

    // 4. Hash default passwords
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const guruPasswordHash = await bcrypt.hash('guru123', 10);
    const siswaPasswordHash = await bcrypt.hash('siswa123', 10);

    // 5. Jalankan seeders.sql
    console.log('⏳ Menjalankan skrip seeders.sql...');
    const seedersPath = path.join(__dirname, 'seeders.sql');
    let seedersSql = fs.readFileSync(seedersPath, 'utf8');

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
    console.log('💡 Tip: Pastikan MySQL Server (cth: XAMPP / Laragon / Standalone MySQL) sedang berjalan aktif.');
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
