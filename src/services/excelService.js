/**
 * src/services/excelService.js
 * Business Logic untuk pembuatan laporan matriks presensi bulanan ke format Excel.
 */
const ExcelJS = require('exceljs');
const { getDaysInMonth, NAMA_BULAN } = require('../utils/dateHelper');

class ExcelService {
  static async generateMonthlyReportExcel({ kelasName, bulan, tahun, students, records }) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Bulanan');

    const totalDays = getDaysInMonth(tahun, bulan);
    const namaBulan = NAMA_BULAN[bulan - 1] || 'Bulan';

    // Header Laporan
    worksheet.mergeCells('A1:AJ1');
    const title = worksheet.getCell('A1');
    title.value = `REKAPITULASI PRESENSI SISWA - KELAS ${kelasName.toUpperCase()}`;
    title.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    title.alignment = { horizontal: 'center', vertical: 'middle' };
    title.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF172654' },
    };
    worksheet.getRow(1).height = 28;

    worksheet.mergeCells('A2:AJ2');
    const subTitle = worksheet.getCell('A2');
    subTitle.value = `Periode: ${namaBulan} ${tahun} | SMAN 1 Nagreg`;
    subTitle.font = { italic: true, size: 10 };
    subTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 20;

    // Header Kolom
    const headerRowValues = ['No', 'ID / NIS', 'Nama Siswa'];
    for (let day = 1; day <= totalDays; day += 1) {
      headerRowValues.push(String(day));
    }
    headerRowValues.push('H', 'S', 'I', 'A', '%');

    worksheet.getRow(4).values = headerRowValues;
    const headerRow = worksheet.getRow(4);
    headerRow.height = 24;
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF29438F' },
      };
    });

    // Peta catatan presensi per student_id dan tgl
    const recordMap = new Map();
    records.forEach((rec) => {
      const key = `${rec.student_id}_${rec.tgl}`;
      recordMap.set(key, rec.status);
    });

    // Masukkan baris data siswa
    students.forEach((std, index) => {
      const rowData = [index + 1, std.nipd, std.nama_siswa];
      let hCount = 0;
      let sCount = 0;
      let iCount = 0;
      let aCount = 0;
      let totalRecorded = 0;

      for (let day = 1; day <= totalDays; day += 1) {
        const key = `${std.student_id}_${day}`;
        const status = recordMap.get(key);

        if (status === 'Hadir') {
          rowData.push('H');
          hCount += 1;
          totalRecorded += 1;
        } else if (status === 'Sakit') {
          rowData.push('S');
          sCount += 1;
          totalRecorded += 1;
        } else if (status === 'Izin') {
          rowData.push('I');
          iCount += 1;
          totalRecorded += 1;
        } else if (status === 'Alpa') {
          rowData.push('A');
          aCount += 1;
          totalRecorded += 1;
        } else {
          rowData.push('-');
        }
      }

      const percent = totalRecorded > 0 ? `${((hCount / totalRecorded) * 100).toFixed(0)}%` : '100%';
      rowData.push(hCount, sCount, iCount, aCount, percent);

      const addedRow = worksheet.addRow(rowData);
      addedRow.height = 20;
      addedRow.alignment = { vertical: 'middle' };
      addedRow.getCell(1).alignment = { horizontal: 'center' };
      addedRow.getCell(2).alignment = { horizontal: 'center' };

      for (let colIdx = 4; colIdx <= 4 + totalDays + 4; colIdx += 1) {
        addedRow.getCell(colIdx).alignment = { horizontal: 'center' };
      }
    });

    // Auto-fit kolom
    worksheet.columns[0].width = 6;
    worksheet.columns[1].width = 14;
    worksheet.columns[2].width = 28;

    return workbook.xlsx.writeBuffer();
  }
}

module.exports = ExcelService;
