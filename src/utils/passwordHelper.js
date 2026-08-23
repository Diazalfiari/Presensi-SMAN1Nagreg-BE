/**
 * src/utils/passwordHelper.js
 * Enkripsi kata sandi dan perbandingan hash menggunakan bcryptjs.
 */
const bcrypt = require('bcryptjs');

const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = {
  hashPassword,
  comparePassword,
};
