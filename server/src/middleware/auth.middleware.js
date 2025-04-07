// src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const config = require('../config');
const { ApiError } = require('../utils/errors');
const User = require('../models/user.model');

const auth = (requiredRoles = []) => {
  return async (req, res, next) => {
    try {
      // Lấy token từ header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ApiError(401, 'Please authenticate');
      }

      const token = authHeader.substring(7);
      
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Tìm user
      const user = await User.findById(decoded.sub);
      if (!user) {
        throw new ApiError(401, 'Please authenticate');
      }

      // Kiểm tra role nếu có yêu cầu
      if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        throw new ApiError(403, 'Not authorized');
      }

      // Đính kèm user vào request
      req.user = user;
      
      next();
    } catch (error) {
      next(new ApiError(401, 'Please authenticate'));
    }
  };
};

module.exports = auth;