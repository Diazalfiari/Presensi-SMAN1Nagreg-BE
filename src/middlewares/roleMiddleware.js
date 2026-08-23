/**
 * src/middlewares/roleMiddleware.js
 * Middleware pembatas hak akses berbasis peran pengguna (RBAC Guard).
 */
const apiResponse = require('../utils/apiResponse');

const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return apiResponse.error(res, 'Autentikasi diperlukan sebelum mengakses fitur ini.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return apiResponse.error(
        res,
        `Akses ditolak. Fitur ini hanya dapat diakses oleh peran: [${allowedRoles.join(', ')}].`,
        403
      );
    }

    next();
  };
};

module.exports = roleMiddleware;
