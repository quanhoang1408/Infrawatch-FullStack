// src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const config = require('../config');
const User = require('../models/user.model');

/**
 * Authentication middleware
 * @param {string} [tokenSource='header'] - Source of the token: 'header' or 'query'
 * @returns {Function} - Express middleware
 */
const auth = (tokenSource = 'header') => async (req, res, next) => {
  try {
    let token;

    if (tokenSource === 'query') {
      // Get token from query parameter
      token = req.query.token;
      if (!token) {
        throw new ApiError(401, 'Authentication token is required');
      }
    } else {
      // Get token from authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ApiError(401, 'Bearer token is required');
      }

      token = authHeader.substring(7);
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Get user
    const user = await User.findById(decoded.sub);
    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new ApiError(401, 'Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new ApiError(401, 'Token expired'));
    } else {
      next(error);
    }
  }
};

module.exports = auth;