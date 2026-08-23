/**
 * src/services/userService.js
 * Business Logic untuk pengelolaan pengguna, registrasi manual, bulk insert, dan impor Excel.
 */
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Class = require('../models/Class');
const { hashPassword } = require('../utils/passwordHelper');
const { logActivity } = require('../middlewares/activityLogger');
const ExcelJS = require('exceljs');

class UserService {
  static async getUsers(params) {
    return User.findAll(params);
  }

  static async getUserDetail(id) {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('Pengguna tidak ditemukan.');
    }
    return user;
  }

  static async createUser(userData, adminUser) {
    const {
      username,
      password,
      role = 'siswa',
      nama,
      email,
      phone,
      nomor_hp,
      nip,
      gelar,
      spesialisasi,
      nipd,
      nisn,
      kelasId,
      kelas,
      gender,
      jenis_kelamin,
      alamat,
    } = userData;

    if (!username || !password || !nama || !role) {
      throw new Error('Data wajib (Nama Lengkap, Username, Password, Role) harus diisi.');
    }

    const cleanUsername = String(username).trim();
    const existing = await User.findByUsername(cleanUsername);
    if (existing) {
      throw new Error(`Username '${cleanUsername}' sudah terdaftar.`);
    }

    const cleanEmail = email ? String(email).trim() : null;
    if (cleanEmail) {
      const existingEmail = await User.findByEmail(cleanEmail);
      if (existingEmail) {
        throw new Error(`Email '${cleanEmail}' sudah digunakan oleh pengguna lain.`);
      }
    }

    if (role === 'guru' && nip) {
      const cleanNip = String(nip).trim();
      if (cleanNip) {
        const existingNip = await Teacher.findByNip(cleanNip);
        if (existingNip) {
          throw new Error(`NIP '${cleanNip}' sudah terdaftar pada guru lain.`);
        }
      }
    }

    if (role === 'siswa') {
      const studentNipd = nipd ? String(nipd).trim() : cleanUsername;
      if (studentNipd) {
        const existingNipd = await Student.findByNipd(studentNipd);
        if (existingNipd) {
          throw new Error(`NIPD '${studentNipd}' sudah terdaftar pada siswa lain.`);
        }
      }

      const cleanNisn = nisn ? String(nisn).trim() : null;
      if (cleanNisn) {
        const existingNisn = await Student.findByNisn(cleanNisn);
        if (existingNisn) {
          throw new Error(`NISN '${cleanNisn}' sudah terdaftar pada siswa lain.`);
        }
      }
    }

    const phoneNumber = phone || nomor_hp || null;
    const studentGender = gender || jenis_kelamin || 'L';

    const hashedPassword = await hashPassword(String(password).trim());
    const userId = await User.create({
      username: cleanUsername,
      password: hashedPassword,
      role,
      nama: String(nama).trim(),
      email: cleanEmail,
      phone: phoneNumber,
    });

    if (role === 'guru') {
      await Teacher.create({
        userId,
        nip: nip ? String(nip).trim() : null,
        spesialisasi: spesialisasi ? String(spesialisasi).trim() : null,
      });
    } else if (role === 'siswa') {
      const studentNipd = nipd ? String(nipd).trim() : cleanUsername;
      let targetClassId = kelasId ? parseInt(kelasId, 10) : null;

      // Jika yang dikirim nama kelas (misal: 'X-1')
      if (!targetClassId && kelas) {
        const foundClass = await Class.findByName(String(kelas).trim());
        if (foundClass) {
          targetClassId = foundClass.id;
        } else {
          // Default ke kelas pertama jika tidak ditemukan
          const allClasses = await Class.findAll({});
          targetClassId = allClasses[0]?.id || 1;
        }
      }

      if (!targetClassId) {
        const allClasses = await Class.findAll({});
        targetClassId = allClasses[0]?.id || 1;
      }

      await Student.create({
        userId,
        kelasId: targetClassId,
        nipd: String(studentNipd).trim(),
        nisn: nisn ? String(nisn).trim() : null,
        gender: studentGender === 'P' || studentGender === 'Perempuan' ? 'P' : 'L',
        alamat: alamat || null,
      });
    }

    if (adminUser) {
      await logActivity({
        userId: adminUser.id,
        namaUser: adminUser.nama,
        role: adminUser.role,
        kategori: 'Manajemen Pengguna',
        aksi: 'Tambah Pengguna',
        deskripsi: `Admin '${adminUser.nama}' menambahkan akun baru '${nama}' (${role}).`,
        status: 'success',
      });
    }

    return userId;
  }

  static async createUsersBulk(usersArray, adminUser) {
    if (!Array.isArray(usersArray) || usersArray.length === 0) {
      throw new Error('Data pengguna untuk bulk insert tidak boleh kosong.');
    }

    const createdUsers = [];
    const errors = [];

    for (let i = 0; i < usersArray.length; i += 1) {
      const u = usersArray[i];
      try {
        const userId = await this.createUser(u, null);
        createdUsers.push({ id: userId, username: u.username, nama: u.nama });
      } catch (err) {
        errors.push({
          row: i + 1,
          username: u.username || `Baris ${i + 1}`,
          error: err.message,
        });
      }
    }

    if (adminUser) {
      await logActivity({
        userId: adminUser.id,
        namaUser: adminUser.nama,
        role: adminUser.role,
        kategori: 'Manajemen Pengguna',
        aksi: 'Bulk Tambah Pengguna',
        deskripsi: `Admin '${adminUser.nama}' memproses bulk import ${createdUsers.length} pengguna (Gagal: ${errors.length}).`,
        status: createdUsers.length > 0 ? 'success' : 'error',
      });
    }

    return {
      totalBerhasil: createdUsers.length,
      totalGagal: errors.length,
      createdUsers,
      errors,
    };
  }

  static async updateUser(id, updateData, adminUser) {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('Pengguna tidak ditemukan.');
    }

    if (updateData.username && updateData.username !== user.username) {
      const cleanUsername = String(updateData.username).trim();
      const existing = await User.findByUsername(cleanUsername);
      if (existing && existing.id !== user.id) {
        throw new Error(`Username '${cleanUsername}' sudah digunakan oleh pengguna lain.`);
      }
    }

    if (updateData.email && updateData.email !== user.email) {
      const cleanEmail = String(updateData.email).trim();
      const existingEmail = await User.findByEmail(cleanEmail);
      if (existingEmail && existingEmail.id !== user.id) {
        throw new Error(`Email '${cleanEmail}' sudah digunakan oleh pengguna lain.`);
      }
    }

    if (user.role === 'guru' && updateData.nip && updateData.nip !== user.nip) {
      const cleanNip = String(updateData.nip).trim();
      const existingNip = await Teacher.findByNip(cleanNip);
      if (existingNip && existingNip.user_id !== user.id) {
        throw new Error(`NIP '${cleanNip}' sudah terdaftar pada guru lain.`);
      }
    }

    if (user.role === 'siswa') {
      if (updateData.nipd && updateData.nipd !== user.nipd) {
        const cleanNipd = String(updateData.nipd).trim();
        const existingNipd = await Student.findByNipd(cleanNipd);
        if (existingNipd && existingNipd.user_id !== user.id) {
          throw new Error(`NIPD '${cleanNipd}' sudah terdaftar pada siswa lain.`);
        }
      }

      if (updateData.nisn && updateData.nisn !== user.nisn) {
        const cleanNisn = String(updateData.nisn).trim();
        const existingNisn = await Student.findByNisn(cleanNisn);
        if (existingNisn && existingNisn.user_id !== user.id) {
          throw new Error(`NISN '${cleanNisn}' sudah terdaftar pada siswa lain.`);
        }
      }
    }

    await User.update(id, updateData);

    if (user.role === 'guru') {
      await Teacher.updateByUserId(id, {
        nip: updateData.nip,
        spesialisasi: updateData.spesialisasi,
      });
    } else if (user.role === 'siswa') {
      let targetClassId = updateData.kelasId ? parseInt(updateData.kelasId, 10) : undefined;
      if (!targetClassId && updateData.kelas) {
        const foundClass = await Class.findByName(String(updateData.kelas).trim());
        if (foundClass) targetClassId = foundClass.id;
      }

      await Student.updateByUserId(id, {
        nipd: updateData.nipd,
        nisn: updateData.nisn,
        gender: updateData.gender || updateData.jenis_kelamin,
        alamat: updateData.alamat,
        kelasId: targetClassId,
      });
    }

    await logActivity({
      userId: adminUser.id,
      namaUser: adminUser.nama,
      role: adminUser.role,
      kategori: 'Manajemen Pengguna',
      aksi: 'Update Pengguna',
      deskripsi: `Admin '${adminUser.nama}' memperbarui profil pengguna '${user.nama}'.`,
      status: 'info',
    });

    return true;
  }

  static async toggleUserStatus(id, isActive, adminUser) {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('Pengguna tidak ditemukan.');
    }

    const newStatus = isActive === true || isActive === 1 || isActive === '1' ? 1 : 0;
    await User.update(id, { is_active: newStatus });

    if (adminUser) {
      await logActivity({
        userId: adminUser.id,
        namaUser: adminUser.nama,
        role: adminUser.role,
        kategori: 'Manajemen Pengguna',
        aksi: 'Ubah Status Pengguna',
        deskripsi: `Admin '${adminUser.nama}' mengubah status akun '${user.nama}' (${user.role}) menjadi ${newStatus === 1 ? 'Aktif' : 'Non-aktif'}.`,
        status: 'info',
      });
    }

    return { id, is_active: newStatus };
  }

  static async deleteUser(id, adminUser) {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('Pengguna tidak ditemukan.');
    }

    await User.delete(id);

    await logActivity({
      userId: adminUser.id,
      namaUser: adminUser.nama,
      role: adminUser.role,
      kategori: 'Manajemen Pengguna',
      aksi: 'Hapus Pengguna',
      deskripsi: `Admin '${adminUser.nama}' menghapus akun pengguna '${user.nama}' (${user.role}).`,
      status: 'warning',
    });

    return true;
  }

  static async importUsersFromExcel(fileBuffer, adminUser) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      throw new Error('Lembar kerja spreadsheet Excel kosong.');
    }

    const rawRows = [];

    // Baca setiap baris data (mulai baris 2 jika baris 1 adalah header)
    for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      const row = worksheet.getRow(rowNumber);
      const col1 = row.getCell(1).text?.trim();

      // Lewati header jika baris 1 berisi kata 'nama' atau 'name'
      if (rowNumber === 1 && (col1.toLowerCase() === 'nama' || col1.toLowerCase() === 'nama lengkap' || col1.toLowerCase() === 'no')) {
        continue;
      }

      const nama = row.getCell(1).text?.trim();
      const username = row.getCell(2).text?.trim();
      const password = row.getCell(3).text?.trim() || `${username}123`;
      const nipd = row.getCell(4).text?.trim() || username;
      const kelas = row.getCell(5).text?.trim();
      const gender = row.getCell(6).text?.trim() || 'L';
      const alamat = row.getCell(7).text?.trim() || '';
      const phone = row.getCell(8).text?.trim() || '';

      if (nama && username) {
        rawRows.push({
          role: 'siswa',
          nama,
          username,
          password,
          nipd,
          kelas,
          gender,
          alamat,
          phone,
        });
      }
    }

    return this.createUsersBulk(rawRows, adminUser);
  }
}

module.exports = UserService;
