/**
 * src/utils/apiResponse.js
 * Standarisasi format respon JSON RESTful API.
 */

const success = (res, message = 'Operasi berhasil', data = null, statusCode = 200, meta = null) => {
  const response = {
    success: true,
    message,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

const paginate = (res, message = 'Data berhasil dimuat', items = [], totalItems = 0, page = 1, limit = 10) => {
  const totalPages = Math.ceil(totalItems / limit) || 1;

  return res.status(200).json({
    success: true,
    message,
    data: items,
    meta: {
      currentPage: parseInt(page, 10),
      itemsPerPage: parseInt(limit, 10),
      totalItems: parseInt(totalItems, 10),
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

const error = (res, message = 'Terjadi kesalahan pada server', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  success,
  paginate,
  error,
};
