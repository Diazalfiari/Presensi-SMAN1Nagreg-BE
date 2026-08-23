/**
 * src/services/kelasService.js
 * Business Logic untuk manajemen rombongan belajar / kelas dan mutasi siswa.
 */
const Class = require('../models/Class');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { logActivity } = require('../middlewares/activityLogger');

class KelasService {
  static async getAllClasses(filters) {
    return Class.findAll(filters);
  }

  static async getClassDetail(id) {
    let classObj = null;
    if (!isNaN(id) && !String(id).includes('-')) {
      classObj = await Class.findById(parseInt(id, 10));
    }
    if (!classObj) {
      classObj = await Class.findByName(id);
    }
    if (!classObj) {
      throw new Error('Kelas tidak ditemukan.');
    }

    const students = await Student.findByClassId(classObj.id);

    return {
      ...classObj,
      students,
    };
  }

  static async createClass({ namaKelas, tingkat, waliKelasId, tahunAjaran }, adminUser) {
    if (!namaKelas || !tingkat) {
      throw new Error('Nama kelas dan tingkat wajib diisi.');
    }

    const existing = await Class.findByName(namaKelas);
    if (existing) {
      throw new Error(`Nama kelas '${namaKelas}' sudah ada.`);
    }

    let finalWaliKelasId = null;
    if (waliKelasId) {
      const parsedId = parseInt(waliKelasId, 10);
      let teacher = await Teacher.findById(parsedId);
      if (!teacher) {
        teacher = await Teacher.findByUserId(parsedId);
      }
      if (teacher) {
        finalWaliKelasId = teacher.id;
      }
    }

    const classId = await Class.create({
      namaKelas,
      tingkat,
      waliKelasId: finalWaliKelasId,
      tahunAjaran,
    });

    if (adminUser) {
      await logActivity({
        userId: adminUser.id,
        namaUser: adminUser.nama,
        role: adminUser.role,
        kategori: 'Manajemen Kelas',
        aksi: 'Tambah Kelas',
        deskripsi: `Admin '${adminUser.nama}' membuat kelas baru '${namaKelas}' (${tingkat}).`,
        status: 'success',
      });
    }

    return classId;
  }

  static async updateClass(id, { namaKelas, tingkat, waliKelasId, tahunAjaran }, adminUser) {
    let classObj = null;
    if (!isNaN(id) && !String(id).includes('-')) {
      classObj = await Class.findById(parseInt(id, 10));
    }
    if (!classObj) {
      classObj = await Class.findByName(id);
    }
    if (!classObj) {
      throw new Error('Kelas tidak ditemukan.');
    }

    let finalWaliKelasId = null;
    if (waliKelasId) {
      const parsedId = parseInt(waliKelasId, 10);
      let teacher = await Teacher.findById(parsedId);
      if (!teacher) {
        teacher = await Teacher.findByUserId(parsedId);
      }
      if (teacher) {
        finalWaliKelasId = teacher.id;
      }
    }

    await Class.update(classObj.id, {
      namaKelas,
      tingkat,
      waliKelasId: finalWaliKelasId,
      tahunAjaran,
    });

    if (adminUser) {
      await logActivity({
        userId: adminUser.id,
        namaUser: adminUser.nama,
        role: adminUser.role,
        kategori: 'Manajemen Kelas',
        aksi: 'Update Kelas',
        deskripsi: `Admin '${adminUser.nama}' memperbarui informasi kelas '${classObj.nama_kelas}'.`,
        status: 'info',
      });
    }

    return true;
  }

  static async deleteClass(id, adminUser) {
    let classObj = null;
    if (!isNaN(id) && !String(id).includes('-')) {
      classObj = await Class.findById(parseInt(id, 10));
    }
    if (!classObj) {
      classObj = await Class.findByName(id);
    }
    if (!classObj) {
      throw new Error('Kelas tidak ditemukan.');
    }

    await Class.delete(classObj.id);

    if (adminUser) {
      await logActivity({
        userId: adminUser.id,
        namaUser: adminUser.nama,
        role: adminUser.role,
        kategori: 'Manajemen Kelas',
        aksi: 'Hapus Kelas',
        deskripsi: `Admin '${adminUser.nama}' menghapus kelas '${classObj.nama_kelas}'.`,
        status: 'warning',
      });
    }

    return true;
  }

  static async mutateStudent(studentIdsInput, newClassId, adminUser) {
    const rawIds = Array.isArray(studentIdsInput) ? studentIdsInput : [studentIdsInput];
    if (rawIds.length === 0) {
      throw new Error('Data siswa wajib dipilih.');
    }

    let targetClass = null;
    if (!isNaN(newClassId) && !String(newClassId).includes('-')) {
      targetClass = await Class.findById(parseInt(newClassId, 10));
    }
    if (!targetClass) {
      targetClass = await Class.findByName(newClassId);
    }
    if (!targetClass) {
      throw new Error('Kelas tujuan tidak ditemukan.');
    }

    let resolvedStudentIds = [];
    let studentNames = [];

    for (const sId of rawIds) {
      let student = await Student.findById(sId);
      if (!student) {
        student = await Student.findByUserId(sId);
      }
      if (student) {
        resolvedStudentIds.push(student.id);
        studentNames.push(student.nama);
      }
    }

    if (resolvedStudentIds.length === 0) {
      throw new Error('Data siswa yang dipilih tidak valid.');
    }

    await Student.promoteStudents(resolvedStudentIds, targetClass.id);

    if (adminUser) {
      const desc = resolvedStudentIds.length === 1
        ? `Admin '${adminUser.nama}' memindahkan siswa '${studentNames[0]}' ke kelas '${targetClass.nama_kelas}'.`
        : `Admin '${adminUser.nama}' memindahkan ${resolvedStudentIds.length} siswa ke kelas '${targetClass.nama_kelas}'.`;

      await logActivity({
        userId: adminUser.id,
        namaUser: adminUser.nama,
        role: adminUser.role,
        kategori: 'Manajemen Kelas',
        aksi: 'Mutasi Siswa',
        deskripsi: desc,
        status: 'info',
      });
    }

    return {
      count: resolvedStudentIds.length,
      targetClass: targetClass.nama_kelas,
    };
  }

  static async promoteClass(fromClassId, { targetClassId, studentIds }, adminUser) {
    let fromClass = null;
    if (!isNaN(fromClassId) && !String(fromClassId).includes('-')) {
      fromClass = await Class.findById(parseInt(fromClassId, 10));
    }
    if (!fromClass) {
      fromClass = await Class.findByName(fromClassId);
    }
    if (!fromClass) {
      throw new Error('Kelas asal tidak ditemukan.');
    }

    if (fromClass.tingkat === 'XII') {
      throw new Error('Kelas XII tidak dapat dinaikkan tingkat. Gunakan fitur kelulusan.');
    }

    // Tentukan kelas tujuan
    let targetClass = null;
    if (targetClassId) {
      if (!isNaN(targetClassId) && !String(targetClassId).includes('-')) {
        targetClass = await Class.findById(parseInt(targetClassId, 10));
      }
      if (!targetClass) {
        targetClass = await Class.findByName(targetClassId);
      }
    } else {
      // Rekomendasi otomatis: X-1 -> XI-1, XI-1 -> XII-1
      let nextGrade = fromClass.tingkat === 'X' ? 'XI' : 'XII';
      let targetName = fromClass.nama_kelas.replace(/^X-/, 'XI-').replace(/^XI-/, 'XII-');
      targetClass = await Class.findByName(targetName);
    }

    if (!targetClass) {
      throw new Error('Kelas tujuan tidak ditemukan.');
    }

    let idsToPromote = [];
    if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
      idsToPromote = studentIds;
    } else {
      const activeStudents = await Student.findByClassId(fromClass.id);
      idsToPromote = activeStudents.map((s) => s.id);
    }

    if (idsToPromote.length === 0) {
      throw new Error('Tidak ada siswa aktif yang dipilih untuk dinaikkan kelas.');
    }

    await Student.promoteStudents(idsToPromote, targetClass.id);

    if (adminUser) {
      await logActivity({
        userId: adminUser.id,
        namaUser: adminUser.nama,
        role: adminUser.role,
        kategori: 'Manajemen Kelas',
        aksi: 'Kenaikan Kelas',
        deskripsi: `Admin '${adminUser.nama}' memproses kenaikan kelas untuk ${idsToPromote.length} siswa dari '${fromClass.nama_kelas}' ke '${targetClass.nama_kelas}'.`,
        status: 'success',
      });
    }

    return {
      count: idsToPromote.length,
      fromClass: fromClass.nama_kelas,
      targetClass: targetClass.nama_kelas,
    };
  }

  static async graduateClass(classId, { studentIds }, adminUser) {
    let classObj = null;
    if (!isNaN(classId) && !String(classId).includes('-')) {
      classObj = await Class.findById(parseInt(classId, 10));
    }
    if (!classObj) {
      classObj = await Class.findByName(classId);
    }
    if (!classObj) {
      throw new Error('Kelas tidak ditemukan.');
    }

    let idsToGraduate = [];
    if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
      idsToGraduate = studentIds;
    } else {
      const activeStudents = await Student.findByClassId(classObj.id);
      idsToGraduate = activeStudents.map((s) => s.id);
    }

    if (idsToGraduate.length === 0) {
      throw new Error('Tidak ada siswa aktif yang dipilih untuk diluluskan.');
    }

    await Student.graduateStudents(idsToGraduate);

    if (adminUser) {
      await logActivity({
        userId: adminUser.id,
        namaUser: adminUser.nama,
        role: adminUser.role,
        kategori: 'Manajemen Kelas',
        aksi: 'Kelulusan Siswa',
        deskripsi: `Admin '${adminUser.nama}' meluluskan ${idsToGraduate.length} siswa dari kelas '${classObj.nama_kelas}'.`,
        status: 'success',
      });
    }

    return {
      count: idsToGraduate.length,
      className: classObj.nama_kelas,
    };
  }

  static async promoteBatchTingkat(tingkatAsal, adminUser) {
    if (!tingkatAsal || (tingkatAsal !== 'X' && tingkatAsal !== 'XI')) {
      throw new Error("Tingkat asal harus 'X' atau 'XI'.");
    }

    const nextTingkat = tingkatAsal === 'X' ? 'XI' : 'XII';
    const classesFrom = await Class.findAll({ tingkat: tingkatAsal });
    const classesTo = await Class.findAll({ tingkat: nextTingkat });

    if (classesFrom.length === 0) {
      throw new Error(`Tidak ditemukan data rombel untuk Tingkat ${tingkatAsal}.`);
    }

    let totalPromoted = 0;
    let details = [];

    for (const fromClass of classesFrom) {
      const targetName = fromClass.nama_kelas.replace(/^X-/, 'XI-').replace(/^XI-/, 'XII-');
      const targetClass = classesTo.find((c) => c.nama_kelas === targetName) || classesTo[0];

      if (targetClass) {
        const students = await Student.findByClassId(fromClass.id);
        const studentIds = students.map((s) => s.id);
        if (studentIds.length > 0) {
          await Student.promoteStudents(studentIds, targetClass.id);
          totalPromoted += studentIds.length;
          details.push({
            from: fromClass.nama_kelas,
            to: targetClass.nama_kelas,
            count: studentIds.length,
          });
        }
      }
    }

    if (adminUser) {
      await logActivity({
        userId: adminUser.id,
        namaUser: adminUser.nama,
        role: adminUser.role,
        kategori: 'Manajemen Kelas',
        aksi: 'Kenaikan Kelas 1 Angkatan',
        deskripsi: `Admin '${adminUser.nama}' memproses kenaikan kelas serentak seluruh angkatan Tingkat ${tingkatAsal} ke Tingkat ${nextTingkat} (${totalPromoted} siswa di ${details.length} rombel).`,
        status: 'success',
      });
    }

    return {
      totalSiswa: totalPromoted,
      totalKelas: details.length,
      tingkatAsal,
      tingkatTujuan: nextTingkat,
      details,
    };
  }

  static async graduateBatchTingkat(tingkat = 'XII', adminUser) {
    const classes = await Class.findAll({ tingkat });
    if (classes.length === 0) {
      throw new Error(`Tidak ditemukan data rombel untuk Tingkat ${tingkat}.`);
    }

    let allStudentIds = [];
    let classesCount = 0;

    for (const cls of classes) {
      const students = await Student.findByClassId(cls.id);
      const studentIds = students.map((s) => s.id);
      if (studentIds.length > 0) {
        allStudentIds.push(...studentIds);
        classesCount++;
      }
    }

    if (allStudentIds.length === 0) {
      throw new Error(`Tidak ada siswa aktif yang ditemukan pada seluruh rombel Tingkat ${tingkat}.`);
    }

    await Student.graduateStudents(allStudentIds);

    if (adminUser) {
      await logActivity({
        userId: adminUser.id,
        namaUser: adminUser.nama,
        role: adminUser.role,
        kategori: 'Manajemen Kelas',
        aksi: 'Kelulusan 1 Angkatan',
        deskripsi: `Admin '${adminUser.nama}' meluluskan serentak 1 angkatan Tingkat ${tingkat} sebanyak ${allStudentIds.length} siswa di ${classesCount} rombel.`,
        status: 'success',
      });
    }

    return {
      totalSiswa: allStudentIds.length,
      totalKelas: classesCount,
      tingkat,
    };
  }
}

module.exports = KelasService;
