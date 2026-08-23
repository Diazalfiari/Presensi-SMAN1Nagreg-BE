/**
 * src/utils/dateHelper.js
 * Utilitas format penanggalan & hari lokal Indonesia.
 */

const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const getDayNameFromDate = (dateString) => {
  const date = new Date(dateString);
  return NAMA_HARI[date.getDay()];
};

const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

const formatDateIndo = (dateString) => {
  const date = new Date(dateString);
  const hari = NAMA_HARI[date.getDay()];
  const tgl = date.getDate();
  const bln = NAMA_BULAN[date.getMonth()];
  const thn = date.getFullYear();
  return `${hari}, ${tgl} ${bln} ${thn}`;
};

const getCurrentDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

module.exports = {
  NAMA_HARI,
  NAMA_BULAN,
  getDayNameFromDate,
  getDaysInMonth,
  formatDateIndo,
  getCurrentDateString,
};
