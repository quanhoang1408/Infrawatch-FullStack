// src/middleware/rbac.middleware.js
const { ApiError } = require('../utils/errors');

/**
 * Role-based access control middleware
 * @param {Array<string>} requiredRoles - Roles allowed to access the route
 * @returns {Function} Middleware function
 */
const rbac = (requiredRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'Forbidden - insufficient permissions'));
    }

    next();
  };
};

module.exports = rbac;