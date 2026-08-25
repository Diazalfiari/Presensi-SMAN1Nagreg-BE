# 🚀 Panduan Lengkap Deploy Backend ke Railway & Integrasi dengan Vercel

Panduan ini berisi instruksi lengkap langkah-demi-langkah untuk mendeploy RESTful API Backend **SMAN 1 Nagreg** ke **Railway.app** dan menghubungkannya dengan Frontend yang telah Anda deploy di **Vercel**.

---

## 📋 Ringkasan Perubahan Kode yang Telah Diterapkan

Kami telah memperbarui dan mengoptimalkan backend agar 100% siap untuk cloud deployment Railway:
1. **`src/config/database.js`**: Mendukung Railway Connection URL (`MYSQL_URL`), Railway Environment Variables (`MYSQLHOST`, `MYSQLPORT`, dll.), koneksi SSL otomatis, dan failover reconnect pool.
2. **`src/config/appConfig.js` & `server.js`**: Konfigurasi CORS cerdas yang otomatis mengizinkan domain Vercel (`*.vercel.app`), multi-origin comma-separated di `CLIENT_URL`, dan penanganan trailing slash otomatis.
3. **`database/initDb.js`, `schema.sql`, `seeders.sql`**: Skema dan seeding database dibuat dinamis (database-agnostic) sehingga dapat berjalan pada nama database apapun di Railway (`railway` atau custom).
4. **`package.json`**: Menambahkan kompatibilitas engine Node.js (`>=18.0.0`).
5. **`railway.json`**: Menyertakan konfigurasi build Nixpacks, health check endpoint (`/api/health`), dan restart policy.

---

## 🛠️ Langkah-Langkah Deployment ke Railway

### Langkah 1: Push Pembaruan Kode ke GitHub
Sebelum deploy ke Railway, pastikan semua perubahan kode terbaru sudah di-commit dan di-push ke repository GitHub Backend Anda:

```bash
cd d:\Diaz\vibescoding\projects\Backend
git add .
git commit -m "feat: optimize backend config for Railway deployment and Vercel CORS"
git push origin main
```

---

### Langkah 2: Buat Project & Tambahkan Database MySQL di Railway

1. Kunjungi **[https://railway.com](https://railway.com)** (atau **[https://railway.app](https://railway.app)**) dan login dengan akun GitHub Anda.
2. Klik tombol **"+ New Project"** di dashboard Railway.
3. Pilih **"Provision MySQL"** (atau klik **"+ New"** -> **"Database"** -> **"Add MySQL"**).
4. Railway akan membuatkan instance database MySQL dalam beberapa detik.

---

### Langkah 3: Deploy Service Backend dari GitHub

1. Di dalam project yang sama di Railway, klik tombol **"+ New"** (atau tombol **Add Service**).
2. Pilih **"GitHub Repo"**.
3. Pilih repository backend Anda: **`Diazalfiari/Presensi-SMAN1Nagreg-BE`**.
4. Railway akan otomatis mendeteksi project Node.js dan memulai build awal.

---

### Langkah 4: Hubungkan Backend dengan MySQL & Set Environment Variables

1. Klik pada service **Backend** (kotak `Presensi-SMAN1Nagreg-BE`) di Canvas Railway.
2. Buka tab **"Variables"** -> klik **"+ New Variable"** (atau **"Raw Editor"**).
3. Tambahkan environment variables berikut:

| Nama Variabel | Nilai (Value) | Keterangan |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Mode produksi |
| `CLIENT_URL` | `https://nama-project-anda.vercel.app` | Ganti dengan URL Frontend Vercel Anda |
| `JWT_SECRET` | *(String acak panjang)* | Contoh: `sman1nagreg_jwt_production_key_2026_super_secure` |
| `JWT_EXPIRES_IN` | `1d` | Masa aktif token JWT |
| `MYSQL_URL` | `${{MySQL.MYSQL_URL}}` | **PENTING**: Mengambil otomatis koneksi dari MySQL service |

> 💡 **TIPS REFERENSI VARIABEL RAILWAY:**
> Jika Anda mengetik `${{` di input value pada Railway, Railway akan menampilkan daftar variabel dari database MySQL Anda (pilih `MySQL.MYSQL_URL`). 
> Alternatifnya, Anda juga bisa menambahkan:
> - `DB_HOST`: `${{MySQL.MYSQLHOST}}`
> - `DB_PORT`: `${{MySQL.MYSQLPORT}}`
> - `DB_USER`: `${{MySQL.MYSQLUSER}}`
> - `DB_PASSWORD`: `${{MySQL.MYSQLPASSWORD}}`
> - `DB_NAME`: `${{MySQL.MYSQLDATABASE}}`

---

### Langkah 5: Buat Public Domain untuk Backend

Agar Frontend di Vercel dapat mengakses API Backend:
1. Klik service **Backend** di Railway.
2. Buka tab **"Settings"**.
3. Scroll ke bagian **"Networking"** -> **"Public Networking"**.
4. Klik **"Generate Domain"**.
5. Railway akan menghasilkan domain HTTPS publik, misalnya:
   `https://presensi-sman1nagreg-be-production.up.railway.app`
6. Salin (copy) URL domain tersebut.

---

### Langkah 6: Inisialisasi Tabel & Data Awal (Migrasi Database)

Setelah MySQL dan Backend aktif, kita perlu membuat 9 tabel relasional dan data pengguna default (*admin*, *guru*, *siswa*).

#### Cara A: Menggunakan Web Terminal Railway (Paling Praktis)
1. Klik service **Backend** di Railway.
2. Buka tab **"Deployments"** -> Klik deployment yang sedang aktif -> Pilih tab **"Terminal"** (atau **"Exec"**).
3. Ketik perintah berikut lalu tekan Enter:
   ```bash
   npm run db:init
   ```
4. Tunggu beberapa detik sampai muncul pesan:
   `✅ Skema tabel (9 tabel relasional) berhasil dibuat.`
   `✅ Data seeder awal berhasil dimasukkan.`
   `🎉 Inisialisasi database selesai!`

#### Cara B: Menjalankan dari Komputer Lokal ke Database Railway
Jika ingin menjalankan dari terminal VSCode / Command Prompt Anda:
1. Buka service **MySQL** di Railway -> Buka tab **"Connect"** -> Salin **`MYSQL_URL`** (Public Connection URL).
2. Di terminal komputer Anda (folder `Backend`), jalankan:
   - **PowerShell (Windows):**
     ```powershell
     $env:MYSQL_URL="mysql://root:password@roundhouse.proxy.rlwy.net:PORT/railway"; npm run db:init
     ```
   - **CMD (Windows):**
     ```cmd
     set MYSQL_URL=mysql://root:password@roundhouse.proxy.rlwy.net:PORT/railway&& npm run db:init
     ```

---

## 🔗 Menghubungkan Frontend di Vercel ke Backend Railway

Sekarang hubungkan frontend React Anda yang sudah ada di Vercel dengan API Railway:

1. Buka dashboard **[Vercel](https://vercel.com)** dan pilih project frontend Anda (**`absensi_sman1nagreg`**).
2. Masuk ke menu **"Settings"** -> pilih **"Environment Variables"**.
3. Tambahkan variabel baru:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://<domain-railway-anda>.up.railway.app/api`
     *(Pastikan menggunakan `https://`, URL Railway Anda, dan berakhiran `/api`)*
   - **Environment**: Centang **Production**, **Preview**, dan **Development**.
4. Klik **"Save"**.
5. **PENTING (Redeploy)**: 
   Karena Create React App menyematkan environment variables saat proses *build*, Anda wajib melakukan build ulang di Vercel:
   - Masuk ke tab **"Deployments"** di Vercel.
   - Klik tombol **titik tiga (...)** pada deployment paling atas -> Pilih **"Redeploy"**.
   - Tunggu proses deployment selesai (~1 menit).

---

## 🧪 Verifikasi & Pengujian Sistem

1. **Uji Health Check Backend**:
   Buka di browser:
   `https://<domain-railway-anda>.up.railway.app/api/health`
   Pastikan muncul respon JSON:
   ```json
   {
     "success": true,
     "message": "Backend API SMAN 1 Nagreg berjalan dengan normal.",
     "timestamp": "2026-08-25T...",
     "environment": "production"
   }
   ```

2. **Uji Frontend di Vercel**:
   Buka website Vercel Anda (`https://nama-project.vercel.app/login`):
   - Login sebagai **Admin**: Username `admin` | Password `admin123`
   - Login sebagai **Guru**: Username `guru` | Password `guru123`
   - Login sebagai **Siswa**: Username `siswa` | Password `siswa123`
3. **Uji Fitur CRUD & Presensi**:
   - Buka menu Presensi, lakukan pencatatan kehadiran.
   - Coba fitur Export Rekap Presensi Excel.
   - Buka menu Manajemen Siswa & Kelas.

---

## ❓ Panduan Troubleshooting (Solusi Masalah Umum)

### 1. Pesan `Tidak dapat terhubung ke server Backend` di Vercel
- **Penyebab**: Variabel `REACT_APP_API_URL` belum diset di Vercel atau belum di-Redeploy setelah diset.
- **Solusi**: Pastikan nilai `REACT_APP_API_URL` berakhiran `/api` (misal: `https://xxx.up.railway.app/api`) dan lakukan **Redeploy** di dashboard Vercel.

### 2. Error CORS (`Akses diblokir oleh kebijakan CORS`)
- **Penyebab**: Domain Vercel belum didaftarkan di variabel `CLIENT_URL` Railway.
- **Solusi**: Buka Railway -> Service Backend -> Tab Variables -> Set `CLIENT_URL` ke URL Vercel Anda (contoh: `https://presensi-sman1nagreg.vercel.app`). Backend juga sudah otomatis mengizinkan semua domain berakhiran `.vercel.app`.

### 3. Error `Gagal terhubung ke Database MySQL` (Database Connection Error)
- **Penyebab**: Service Backend belum terhubung ke service MySQL di Railway.
- **Solusi**: Pastikan variabel `MYSQL_URL` bernilai `${{MySQL.MYSQL_URL}}` di tab Variables service Backend.

### 4. Tabel Kosong / Gagal Login dengan Kredensial Default
- **Penyebab**: Skrip `npm run db:init` belum dijalankan di database Railway.
- **Solusi**: Jalankan `npm run db:init` melalui web terminal Railway atau dari local PC dengan `MYSQL_URL` Railway.
