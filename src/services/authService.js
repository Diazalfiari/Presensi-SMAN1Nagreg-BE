/**
 * src/services/authService.js
 * Business Logic untuk autentikasi, token JWT, dan manajemen password.
 */
const jwt = require('jsonwebtoken');
const appConfig = require('../config/appConfig');
const User = require('../models/User');
const { comparePassword, hashPassword } = require('../utils/passwordHelper');
const { logActivity } = require('../middlewares/activityLogger');

class AuthService {
  static async login({ username, password, ipAddress, userAgent }) {
    if (!username || !password) {
      throw new Error('Username dan kata sandi wajib diisi.');
    }

    const user = await User.findByUsername(username);

    if (!user) {
      throw new Error('Username atau kata sandi tidak valid.');
    }

    if (!user.is_active) {
      throw new Error('Akun Anda dinonaktifkan. Hubungi administrator sekolah.');
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      throw new Error('Username atau kata sandi tidak valid.');
    }

    // Generate JWT token
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      nama: user.nama,
    };

    const token = jwt.sign(payload, appConfig.jwt.secret, {
      expiresIn: appConfig.jwt.expiresIn,
    });

    // Catat log aktivitas login
    await logActivity({
      userId: user.id,
      namaUser: user.nama,
      role: user.role,
      kategori: 'Autentikasi',
      aksi: `Login ${user.role.toUpperCase()}`,
      deskripsi: `Pengguna '${user.nama}' (${user.role}) berhasil login ke dalam sistem.`,
      status: 'success',
      ipAddress,
      userAgent,
    });

    // Susun data respon profil (tanpa hash password)
    const userProfile = {
      id: user.id,
      username: user.username,
      role: user.role,
      nama: user.nama,
      email: user.email,
      nip: user.nip || null,
      nipd: user.nipd || null,
      kelas: user.nama_kelas || null,
      teacherId: user.teacher_id || null,
      studentId: user.student_id || null,
    };

    return { token, user: userProfile };
  }

  static async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Data profil pengguna tidak ditemukan.');
    }
    return user;
  }

  static async logout({ user, ipAddress, userAgent }) {
    await logActivity({
      userId: user.id,
      namaUser: user.nama,
      role: user.role,
      kategori: 'Autentikasi',
      aksi: `Logout ${user.role.toUpperCase()}`,
      deskripsi: `Pengguna '${user.nama}' (${user.role}) berhasil logout dari sistem.`,
      status: 'info',
      ipAddress,
      userAgent,
    });
  }

  static async changePassword(userId, { oldPassword, newPassword, ipAddress, userAgent }) {
    if (!oldPassword || !newPassword) {
      throw new Error('Kata sandi lama dan baru wajib diisi.');
    }

    if (newPassword.length < 6) {
      throw new Error('Kata sandi baru minimal 6 karakter.');
    }

    const [rows] = await User.findByUsername(userId);
    const user = await User.findById(userId);

    const userWithPass = await User.findByUsername(user.username);
    const isMatch = await comparePassword(oldPassword, userWithPass.password);

    if (!isMatch) {
      throw new Error('Kata sandi lama tidak sesuai.');
    }

    const hashed = await hashPassword(newPassword);
    await User.updatePassword(userId, hashed);

    await logActivity({
      userId: user.id,
      namaUser: user.nama,
      role: user.role,
      kategori: 'Autentikasi',
      aksi: 'Ubah Kata Sandi',
      deskripsi: `Pengguna '${user.nama}' berhasil memperbarui kata sandi akun.`,
      status: 'success',
      ipAddress,
      userAgent,
    });

    return true;
  }
}

module.exports = AuthService;
