const { pool } = require('../src/config/database');

async function migrate() {
  try {
    const [cols] = await pool.query('SHOW COLUMNS FROM students');
    const colNames = cols.map(c => c.Field);
    console.log('Current students columns:', colNames);

    if (!colNames.includes('status')) {
      await pool.query("ALTER TABLE students ADD COLUMN status ENUM('aktif', 'lulus', 'mutasi_keluar', 'drop_out') NOT NULL DEFAULT 'aktif'");
      console.log('✅ Added column `status` to table `students`.');
    } else {
      console.log('ℹ️ Column `status` already exists in `students`.');
    }

    await pool.query('ALTER TABLE students MODIFY COLUMN kelas_id INT UNSIGNED NULL');
    console.log('✅ Modified column `kelas_id` in `students` to be NULLABLE.');

    console.log('🎉 Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
