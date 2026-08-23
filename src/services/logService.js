/**
 * src/services/logService.js
 * Business Logic untuk query audit log aktivitas dan pembuatan laporan Excel.
 */
const ActivityLog = require('../models/ActivityLog');
const ExcelJS = require('exceljs');

class LogService {
  static async getLogs(params) {
    return ActivityLog.findAll(params);
  }

  static async getLogDetail(id) {
    const log = await ActivityLog.findById(id);
    if (!log) {
      throw new Error('Entri log aktivitas tidak ditemukan.');
    }
    return log;
  }

  static async exportLogsToExcel(params) {
    const { items } = await ActivityLog.findAll({ ...params, limit: 1000 });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SMAN 1 Nagreg System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Log Aktivitas');

    // Judul
    worksheet.mergeCells('A1:G1');
    const title = worksheet.getCell('A1');
    title.value = 'LOG AKTIVITAS SISTEM PRESENSI SMAN 1 NAGREG';
    title.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    title.alignment = { horizontal: 'center', vertical: 'middle' };
    title.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF172654' },
    };
    worksheet.getRow(1).height = 30;

    // Header Tabel
    const headers = ['No', 'Waktu & Tanggal', 'Nama Pengguna', 'Peran', 'Kategori', 'Aktivitas / Deskripsi', 'IP & Perangkat'];
    worksheet.getRow(3).values = headers;
    const headerRow = worksheet.getRow(3);
    headerRow.height = 24;
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF29438F' },
      };
    });

    items.forEach((item, index) => {
      const row = worksheet.addRow([
        index + 1,
        `${item.tanggal} ${item.waktu}`,
        item.nama_user,
        item.role.toUpperCase(),
        item.kategori,
        `${item.aksi}: ${item.deskripsi}`,
        `${item.ip_address || '-'} (${item.user_agent || '-'})`,
      ]);

      row.height = 22;
      row.alignment = { vertical: 'middle' };
      row.getCell(1).alignment = { horizontal: 'center' };
      row.getCell(2).alignment = { horizontal: 'center' };
      row.getCell(4).alignment = { horizontal: 'center' };
      row.getCell(5).alignment = { horizontal: 'center' };
    });

    worksheet.columns = [
      { width: 8 },
      { width: 22 },
      { width: 25 },
      { width: 12 },
      { width: 22 },
      { width: 55 },
      { width: 30 },
    ];

    return workbook.xlsx.writeBuffer();
  }
}

module.exports = LogService;
