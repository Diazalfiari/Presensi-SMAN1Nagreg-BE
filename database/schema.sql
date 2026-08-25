-- ==============================================================================
-- DATABASE SCHEMA: SISTEM PRESENSI SMAN 1 NAGREG
-- MySQL 8.0+ Compatible (Local & Cloud Railway MySQL)
-- ==============================================================================

-- Disable Foreign Key Checks during setup
SET FOREIGN_KEY_CHECKS = 0;

-- 1. TABEL USERS (Autentikasi Pengguna Multi-Role)
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'guru', 'siswa') NOT NULL DEFAULT 'siswa',
  `nama` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NULL UNIQUE,
  `phone` VARCHAR(20) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABEL TEACHERS (Profil Guru Pengajar)
DROP TABLE IF EXISTS `teachers`;
CREATE TABLE `teachers` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL UNIQUE,
  `nip` VARCHAR(30) NULL UNIQUE,
  `spesialisasi` VARCHAR(100) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_teachers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABEL CLASSES (Rombongan Belajar / Kelas)
DROP TABLE IF EXISTS `classes`;
CREATE TABLE `classes` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nama_kelas` VARCHAR(20) NOT NULL UNIQUE,
  `tingkat` ENUM('X', 'XI', 'XII') NOT NULL,
  `wali_kelas_id` INT UNSIGNED NULL,
  `tahun_ajaran` VARCHAR(20) NOT NULL DEFAULT '2025/2026',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_classes_wali_kelas` FOREIGN KEY (`wali_kelas_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL,
  INDEX `idx_classes_tingkat` (`tingkat`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TABEL STUDENTS (Profil Siswa & Pemetaan Kelas)
DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL UNIQUE,
  `kelas_id` INT UNSIGNED NULL,
  `nipd` VARCHAR(30) NOT NULL UNIQUE,
  `nisn` VARCHAR(30) NULL UNIQUE,
  `gender` ENUM('L', 'P') NOT NULL DEFAULT 'L',
  `alamat` TEXT NULL,
  `status` ENUM('aktif', 'lulus', 'mutasi_keluar', 'drop_out') NOT NULL DEFAULT 'aktif',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_students_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_students_class` FOREIGN KEY (`kelas_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL,
  INDEX `idx_students_nipd` (`nipd`),
  INDEX `idx_students_kelas` (`kelas_id`),
  INDEX `idx_students_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TABEL SUBJECTS (Mata Pelajaran)
DROP TABLE IF EXISTS `subjects`;
CREATE TABLE `subjects` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `kode_mapel` VARCHAR(20) NOT NULL UNIQUE,
  `nama_mapel` VARCHAR(100) NOT NULL,
  `kategori` VARCHAR(50) NOT NULL DEFAULT 'Umum',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_subjects_nama` (`nama_mapel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TABEL SCHEDULES (Jadwal Pelajaran Mingguan)
DROP TABLE IF EXISTS `schedules`;
CREATE TABLE `schedules` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `mapel_id` INT UNSIGNED NOT NULL,
  `kelas_id` INT UNSIGNED NOT NULL,
  `teacher_id` INT UNSIGNED NOT NULL,
  `hari` ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu') NOT NULL,
  `jam_mulai` VARCHAR(10) NOT NULL,
  `jam_selesai` VARCHAR(10) NOT NULL,
  `ruang` VARCHAR(50) NOT NULL DEFAULT 'Ruang Kelas',
  `status` ENUM('Offline', 'Online') NOT NULL DEFAULT 'Offline',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_schedules_mapel` FOREIGN KEY (`mapel_id`) REFERENCES `subjects` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_schedules_class` FOREIGN KEY (`kelas_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_schedules_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE,
  INDEX `idx_schedules_hari_kelas` (`hari`, `kelas_id`),
  INDEX `idx_schedules_teacher` (`teacher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. TABEL TEACHING_SESSIONS (Sesi Pembelajaran, Materi, Tugas & Kuis)
DROP TABLE IF EXISTS `teaching_sessions`;
CREATE TABLE `teaching_sessions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `schedule_id` INT UNSIGNED NOT NULL,
  `tanggal` DATE NOT NULL,
  `status_sesi` ENUM('Belum Dimulai', 'Sedang Berlangsung', 'Selesai') NOT NULL DEFAULT 'Belum Dimulai',
  `topik_materi` VARCHAR(200) NULL,
  `deskripsi_materi` TEXT NULL,
  `tugas_siswa` TEXT NULL,
  `kuis_evaluasi` TEXT NULL,
  `started_at` DATETIME NULL,
  `ended_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_sessions_schedule` FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_session_schedule_date` (`schedule_id`, `tanggal`),
  INDEX `idx_sessions_date` (`tanggal`),
  INDEX `idx_sessions_status` (`status_sesi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. TABEL ATTENDANCE_RECORDS (Catatan Presensi Siswa per Sesi)
DROP TABLE IF EXISTS `attendance_records`;
CREATE TABLE `attendance_records` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `session_id` INT UNSIGNED NOT NULL,
  `student_id` INT UNSIGNED NOT NULL,
  `status` ENUM('Hadir', 'Sakit', 'Izin', 'Alpa') NOT NULL DEFAULT 'Hadir',
  `catatan` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_att_session` FOREIGN KEY (`session_id`) REFERENCES `teaching_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_att_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_att_session_student` (`session_id`, `student_id`),
  INDEX `idx_att_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. TABEL ACTIVITY_LOGS (Audit Trail Aktivitas Sistem)
DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE `activity_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NULL,
  `nama_user` VARCHAR(100) NOT NULL,
  `role` VARCHAR(20) NOT NULL,
  `kategori` VARCHAR(50) NOT NULL,
  `aksi` VARCHAR(100) NOT NULL,
  `deskripsi` TEXT NOT NULL,
  `status` ENUM('success', 'info', 'warning', 'error') NOT NULL DEFAULT 'success',
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(255) NULL,
  `payload_detail` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_logs_kategori` (`kategori`),
  INDEX `idx_logs_role` (`role`),
  INDEX `idx_logs_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Re-enable Foreign Key Checks
SET FOREIGN_KEY_CHECKS = 1;
