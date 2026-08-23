# 🏫 Backend RESTful API - Sistem Presensi SMAN 1 Nagreg

Backend server terpusat berbasis **Node.js, Express.js, dan MySQL** yang dirancang dengan pola arsitektur **MVC (*Model-View-Controller*) + Service Layer** standar industri untuk mendukung seluruh fitur presensi digital, rekapitulasi, impor/ekspor Excel, dan audit log SMAN 1 Nagreg.

---

## 🛠️ Prasyarat Sistem (Prerequisites)

Pastikan perangkat Anda telah terinstal:
- **Node.js**: Versi `>= 18.x LTS` ([Unduh Node.js](https://nodejs.org/))
- **MySQL Server**: Versi `>= 8.0` (Bisa menggunakan **XAMPP**, **Laragon**, atau MySQL Standalone)
- **NPM**: Versi `>= 9.x`

---

## 🚀 Panduan Langkah Demi Langkah (Step-by-Step Guide)

### Langkah 1: Buka Terminal & Masuk ke Folder Backend
Buka terminal (Command Prompt / PowerShell / Git Bash / Terminal VS Code) dan arahkan ke direktori backend:
```bash
cd d:/Diaz/vibescoding/projects/Backend
```

---

### Langkah 2: Pastikan Dependensi Terpasang
Jika belum menginstal dependensi pustaka npm:
```bash
npm install
```

---

### Langkah 3: Konfigurasi Variabel Environment (`.env`)
Periksa file `.env` di dalam folder `Backend/` dan sesuaikan dengan konfigurasi MySQL lokal Anda:

```env
# Port Server & Lingkungan
PORT=5000
NODE_ENV=development

# URL Frontend React (CORS)
CLIENT_URL=http://localhost:3000

# Konfigurasi Database MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=db_presensi_sman1nagreg

# Kunci Rahasia JWT
JWT_SECRET=super_secret_jwt_key_sman1nagreg_2026_secure
JWT_EXPIRES_IN=1d

# Batas Maksimal Upload File (10 MB)
MAX_FILE_SIZE=10485760
```

> [!TIP]
> Jika Anda menggunakan **XAMPP / Laragon**, biasanya `DB_USER=root` dan `DB_PASSWORD=` (kosong).

---

### Langkah 4: Jalankan Server MySQL
- Buka **XAMPP Control Panel** lalu klik **Start** pada modul **MySQL**, ATAU
- Buka **Laragon** lalu klik **Start All**, ATAU
- Pastikan service **MySQL** di Windows Services dalam status *Running*.

---

### Langkah 5: Inisialisasi Database & Seeder Otomatis
Jalankan perintah berikut untuk membuat database `db_presensi_sman1nagreg`, 9 tabel relasional, serta data awal (admin, guru, siswa, kelas, jadwal):

```bash
npm run db:init
```

Output berhasil akan menampilkan:
```plaintext
🔄 Menghubungkan ke MySQL di localhost:3306 sebagai 'root'...
✅ Berhasil terhubung ke server MySQL.
✅ Menggunakan database: 'db_presensi_sman1nagreg'.
⏳ Menjalankan skrip schema.sql...
✅ Skema tabel (9 tabel relasional) berhasil dibuat.
⏳ Menjalankan skrip seeders.sql...
✅ Data seeder awal berhasil dimasukkan.
🎉 Inisialisasi database selesai! Siap digunakan oleh server Express.js.
```

---

### Langkah 6: Jalankan Server Backend

Untuk mode pengembangan (*development with auto-restart*):
```bash
npm run dev
```

Atau untuk mode produksi (*production*):
```bash
npm start
```

Server akan aktif dan siap menerima request pada:
👉 **`http://localhost:5000/api`**

---

## 🔑 Kredensial Akun Uji Coba Default

| Peran (Role) | Username | Password | Keterangan / Akses |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Akses penuh dashboard, manajemen user, kelas, jadwal, log |
| **Guru Pengajar** | `guru` | `guru123` | Sesi mengajar Matematika, input presensi, materi & tugas |
| **Siswa** | `siswa` | `siswa123` | Ahmad Rizki (Kelas X-1), cek riwayat kehadiran pribadi |

---

## 🌐 Daftar Endpoint RESTful API

### 1. Autentikasi (`/api/auth`)
- `POST /api/auth/login` - Login pengguna & mendapatkan token JWT
- `GET /api/auth/me` - Mendapatkan profil pengguna yang sedang login
- `POST /api/auth/logout` - Logout pengguna
- `PUT /api/auth/change-password` - Mengubah kata sandi akun

### 2. Dashboard (`/api/dashboard`)
- `GET /api/dashboard/admin` - Metrik agregasi kehadiran, grafik kelas terbaik/evaluasi *(Admin)*
- `GET /api/dashboard/guru` - Jadwal mengajar hari ini & status sesi *(Guru)*
- `GET /api/dashboard/siswa` - Persentase presensi & jadwal kelas hari ini *(Siswa)*

### 3. Presensi & Sesi Mengajar (`/api/presensi`)
- `GET /api/presensi/sesi/:jadwalId?tanggal=YYYY-MM-DD` - Data sesi mengajar, materi, tugas & daftar siswa
- `POST /api/presensi/sesi/:jadwalId/start` - Memulai sesi kelas aktif
- `POST /api/presensi/sesi/:jadwalId/save` - Menyimpan daftar presensi siswa, topik & deskripsi materi, serta tugas/kuis
- `GET /api/presensi/rekapitulasi` - Rekapitulasi per kelas & rentang tanggal
- `GET /api/presensi/bulanan?kelasId=1&bulan=8&tahun=2026` - Matriks presensi siswa bulanan
- `GET /api/presensi/bulanan/export-excel` - Unduh laporan matriks bulanan format `.xlsx`
- `GET /api/presensi/riwayat/guru` - Riwayat sesi mengajar guru
- `GET /api/presensi/riwayat/siswa` - Riwayat kehadiran pribadi siswa

### 4. Manajemen Pengguna (`/api/users`)
- `GET /api/users` - Daftar pengguna (filter role, pencarian, pagination) *(Admin)*
- `GET /api/users/:id` - Detail pengguna *(Admin)*
- `POST /api/users` - Tambah pengguna baru *(Admin)*
- `PUT /api/users/:id` - Update data pengguna *(Admin)*
- `DELETE /api/users/:id` - Hapus pengguna *(Admin)*
- `POST /api/users/import-excel` - Upload spreadsheet Excel untuk impor massal akun pengguna *(Admin)*

### 5. Manajemen Kelas (`/api/kelas`)
- `GET /api/kelas` - Daftar 36 kelas jenjang X, XI, XII & wali kelas
- `GET /api/kelas/:id` - Detail kelas & daftar siswa di dalamnya
- `POST /api/kelas` - Tambah kelas baru *(Admin)*
- `PUT /api/kelas/:id` - Edit data kelas / wali kelas *(Admin)*
- `DELETE /api/kelas/:id` - Hapus kelas *(Admin)*
- `POST /api/kelas/:id/mutasi-siswa` - Pindahkan siswa ke rombel kelas lain *(Admin)*

### 6. Manajemen Jadwal (`/api/jadwal`)
- `GET /api/jadwal` - Daftar jadwal pelajaran sekolah
- `GET /api/jadwal/guru` - Jadwal mengajar milik guru yang login *(Guru)*
- `GET /api/jadwal/siswa` - Jadwal pelajaran milik siswa yang login *(Siswa)*
- `GET /api/jadwal/mata-pelajaran` - Daftar master mata pelajaran
- `POST /api/jadwal` - Tambah jadwal mata pelajaran baru *(Admin)*
- `PUT /api/jadwal/:id` - Update jadwal pelajaran *(Admin)*
- `DELETE /api/jadwal/:id` - Hapus jadwal pelajaran *(Admin)*

### 7. Audit Log Aktivitas (`/api/logs`)
- `GET /api/logs` - Daftar audit log aktivitas sistem *(Admin)*
- `GET /api/logs/:id` - Detail metadata log *(Admin)*
- `GET /api/logs/export-excel` - Unduh spreadsheet Excel audit trail log *(Admin)*

### 8. Health Check
- `GET /api/health` - Status koneksi server backend

---

## 🏗️ Struktur Arsitektur MVC

```plaintext
Backend/
├── database/                    # Skrip DDL MySQL (schema.sql, seeders.sql, initDb.js)
├── server.js                    # Entry point server Express.js
└── src/
    ├── config/                  # Koneksi pool MySQL & app config
    ├── controllers/             # Layer penanganan request & response HTTP
    ├── middlewares/             # JWT auth, role guard RBAC, logger, error handling
    ├── models/                  # Layer Model database (9 tabel MySQL)
    ├── routes/                  # Layer routing RESTful API modular
    ├── services/                # Layer Business logic murni & Excel processing
    └── utils/                   # Helper response API, hashing bcrypt & kalender
```

---

## ❓ Troubleshooting & Solusi

1. **Error: `ECONNREFUSED 127.0.0.1:3306`**:
   - Pastikan MySQL server telah berjalan di XAMPP / Laragon.
2. **Error: `Access denied for user 'root'@'localhost'`**:
   - Periksa kata sandi MySQL di file `.env` (`DB_PASSWORD`).
3. **Port 5000 sudah terpakai (`EADDRINUSE`)**:
   - Ubah nilai `PORT` di file `.env` menjadi port lain (misal `PORT=5001`).

---

*© 2026 SMAN 1 Nagreg - Sistem Informasi Presensi Digital.*
