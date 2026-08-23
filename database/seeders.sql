-- ==============================================================================
-- DATABASE SEEDERS: SISTEM PRESENSI SMAN 1 NAGREG
-- Initial Data matching Frontend Mock System
-- ==============================================================================

USE `db_presensi_sman1nagreg`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. SEED USERS (Password default hashed with bcrypt for admin123, guru123, siswa123)
-- Hash untuk 'admin123': $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi (atau dihasilkan via initDb.js)
INSERT INTO `users` (`id`, `username`, `password`, `role`, `nama`, `email`, `phone`, `is_active`) VALUES
(1, 'admin', '$2b$10$Z3lPZ6bU7fQfC5sV2y7pLezY1.2Z2J.7m6N5x4w3V2u1T0s9r8q7p', 'admin', 'Administrator', 'admin@sman1nagreg.sch.id', '081234567890', 1),
(2, 'guru', '$2b$10$Z3lPZ6bU7fQfC5sV2y7pLezY1.2Z2J.7m6N5x4w3V2u1T0s9r8q7p', 'guru', 'Budi Santoso, S.Pd', 'budi.santoso@sman1nagreg.sch.id', '081298765432', 1),
(3, 'siswa', '$2b$10$Z3lPZ6bU7fQfC5sV2y7pLezY1.2Z2J.7m6N5x4w3V2u1T0s9r8q7p', 'siswa', 'Ahmad Rizki', 'ahmad.rizki@siswa.sman1nagreg.sch.id', '085712345678', 1),
(4, 'guru_matematika', '$2b$10$Z3lPZ6bU7fQfC5sV2y7pLezY1.2Z2J.7m6N5x4w3V2u1T0s9r8q7p', 'guru', 'Siti Aminah, M.Pd', 'siti.aminah@sman1nagreg.sch.id', '081345678901', 1),
(5, 'guru_fisika', '$2b$10$Z3lPZ6bU7fQfC5sV2y7pLezY1.2Z2J.7m6N5x4w3V2u1T0s9r8q7p', 'guru', 'Dedi Supriadi, S.Pd', 'dedi.supriadi@sman1nagreg.sch.id', '081356789012', 1);

-- 2. SEED TEACHERS
INSERT INTO `teachers` (`id`, `user_id`, `nip`, `spesialisasi`) VALUES
(1, 2, '198505152010011003', 'Matematika'),
(2, 4, '198807202012012004', 'Bahasa Indonesia'),
(3, 5, '198203102008011005', 'Fisika');

-- 3. SEED CLASSES (36 Kelas Tingkat X, XI, XII)
INSERT INTO `classes` (`id`, `nama_kelas`, `tingkat`, `wali_kelas_id`, `tahun_ajaran`) VALUES
(1, 'X-1', 'X', 1, '2025/2026'),
(2, 'X-2', 'X', 2, '2025/2026'),
(3, 'X-3', 'X', 3, '2025/2026'),
(4, 'X-4', 'X', NULL, '2025/2026'),
(5, 'X-5', 'X', NULL, '2025/2026'),
(6, 'X-6', 'X', NULL, '2025/2026'),
(7, 'X-7', 'X', NULL, '2025/2026'),
(8, 'X-8', 'X', NULL, '2025/2026'),
(9, 'X-9', 'X', NULL, '2025/2026'),
(10, 'X-10', 'X', NULL, '2025/2026'),
(11, 'X-11', 'X', NULL, '2025/2026'),
(12, 'X-12', 'X', NULL, '2025/2026'),
(13, 'XI-1', 'XI', 1, '2025/2026'),
(14, 'XI-2', 'XI', 2, '2025/2026'),
(15, 'XI-3', 'XI', NULL, '2025/2026'),
(16, 'XI-4', 'XI', NULL, '2025/2026'),
(17, 'XI-5', 'XI', NULL, '2025/2026'),
(18, 'XI-6', 'XI', NULL, '2025/2026'),
(19, 'XI-7', 'XI', NULL, '2025/2026'),
(20, 'XI-8', 'XI', NULL, '2025/2026'),
(21, 'XI-9', 'XI', NULL, '2025/2026'),
(22, 'XI-10', 'XI', NULL, '2025/2026'),
(23, 'XI-11', 'XI', NULL, '2025/2026'),
(24, 'XI-12', 'XI', NULL, '2025/2026'),
(25, 'XII-1', 'XII', 3, '2025/2026'),
(26, 'XII-2', 'XII', NULL, '2025/2026'),
(27, 'XII-3', 'XII', NULL, '2025/2026'),
(28, 'XII-4', 'XII', NULL, '2025/2026'),
(29, 'XII-5', 'XII', NULL, '2025/2026'),
(30, 'XII-6', 'XII', NULL, '2025/2026'),
(31, 'XII-7', 'XII', NULL, '2025/2026'),
(32, 'XII-8', 'XII', NULL, '2025/2026'),
(33, 'XII-9', 'XII', NULL, '2025/2026'),
(34, 'XII-10', 'XII', NULL, '2025/2026'),
(35, 'XII-11', 'XII', NULL, '2025/2026'),
(36, 'XII-12', 'XII', NULL, '2025/2026');

-- 4. SEED STUDENTS
INSERT INTO `students` (`id`, `user_id`, `kelas_id`, `nipd`, `nisn`, `gender`, `alamat`) VALUES
(1, 3, 1, '2021001', '0056789012', 'L', 'Jl. Raya Nagreg No. 45, Bandung');

-- 5. SEED SUBJECTS
INSERT INTO `subjects` (`id`, `kode_mapel`, `nama_mapel`, `kategori`) VALUES
(1, 'MAT-X', 'Matematika', 'MIPA'),
(2, 'BIN-X', 'Bahasa Indonesia', 'Bahasa'),
(3, 'BIG-X', 'Bahasa Inggris', 'Bahasa'),
(4, 'FIS-X', 'Fisika', 'MIPA'),
(5, 'KIM-X', 'Kimia', 'MIPA'),
(6, 'BIO-X', 'Biologi', 'MIPA'),
(7, 'SEJ-X', 'Sejarah', 'IPS'),
(8, 'GEO-X', 'Geografi', 'IPS'),
(9, 'EKO-X', 'Ekonomi', 'IPS'),
(10, 'PJK-X', 'Pendidikan Jasmani', 'Umum');

-- 6. SEED SCHEDULES
INSERT INTO `schedules` (`id`, `mapel_id`, `kelas_id`, `teacher_id`, `hari`, `jam_mulai`, `jam_selesai`, `ruang`, `status`) VALUES
(1, 1, 1, 1, 'Senin', '07:30', '09:00', 'Kelas X-1', 'Offline'),
(2, 2, 1, 2, 'Senin', '09:15', '10:45', 'Kelas X-1', 'Offline'),
(3, 4, 1, 3, 'Selasa', '07:30', '09:00', 'Lab Fisika', 'Offline'),
(4, 1, 13, 1, 'Rabu', '08:50', '10:30', 'Kelas XI-1', 'Offline'),
(5, 1, 25, 1, 'Kamis', '07:30', '09:00', 'Kelas XII-1', 'Offline');

-- 7. SEED TEACHING SESSIONS
INSERT INTO `teaching_sessions` (`id`, `schedule_id`, `tanggal`, `status_sesi`, `topik_materi`, `deskripsi_materi`, `tugas_siswa`, `kuis_evaluasi`) VALUES
(1, 1, '2026-08-22', 'Selesai', 'Turunan Fungsi Trigonometri', 'Pembahasan konsep turunan sin(x) dan cos(x) beserta grafiknya.', 'Kerjakan soal latihan halaman 45 nomor 1 s.d 5 di buku catatan.', 'Kuis 3 soal pemahaman konsep di akhir sesi.');

-- 8. SEED ATTENDANCE RECORDS
INSERT INTO `attendance_records` (`id`, `session_id`, `student_id`, `status`, `catatan`) VALUES
(1, 1, 1, 'Hadir', 'Tepat waktu');

-- 9. SEED ACTIVITY LOGS
INSERT INTO `activity_logs` (`id`, `user_id`, `nama_user`, `role`, `kategori`, `aksi`, `deskripsi`, `status`, `ip_address`, `user_agent`) VALUES
(1, 2, 'Budi Santoso, S.Pd', 'guru', 'Presensi', 'Input Presensi Sesi', 'Menyimpan data presensi kelas X-1 mata pelajaran Matematika (30 Siswa).', 'success', '192.168.1.45', 'Chrome / Windows'),
(2, 1, 'Administrator', 'admin', 'Laporan', 'Ekspor Laporan Excel', 'Mengunduh rekapitulasi laporan presensi bulanan kelas X-1 periode Agustus 2026.', 'success', '192.168.1.10', 'Edge / Windows'),
(3, 1, 'Administrator', 'admin', 'Manajemen Pengguna', 'Import Pengguna Massal', 'Berhasil mengimpor 12 akun pengguna baru (Siswa) via file spreadsheet Excel.', 'success', '192.168.1.10', 'Edge / Windows'),
(4, 1, 'Administrator', 'admin', 'Manajemen Kelas', 'Update Wali Kelas', 'Mengubah wali kelas untuk Kelas X-2 menjadi Guru X-2, S.Pd.', 'info', '192.168.1.10', 'Edge / Windows'),
(5, 3, 'Ahmad Rizki', 'siswa', 'Autentikasi', 'Login Siswa', 'Login berhasil ke dashboard siswa dari perangkat mobile.', 'success', '192.168.1.112', 'Mobile Safari / iOS');

SET FOREIGN_KEY_CHECKS = 1;
