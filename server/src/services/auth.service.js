// src/services/auth.service.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const moment = require('moment');
const User = require('../models/user.model');
const Token = require('../models/token.model');
const { ApiError } = require('../utils/errors');
const config = require('../config');

/**
 * Tạo tokens cho user
 * @param {Object} user
 * @returns {Object}
 */
const generateTokens = async (user) => {
  // Tạo access token
  const accessToken = jwt.sign(
    { sub: user.id, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpirationMinutes * 60 }
  );

  // Tạo refresh token
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');

  // Lưu refresh token vào database
  await Token.create({
    token: refreshToken,
    user: user.id,
    type: 'refresh',
    expires: refreshTokenExpires.toDate(),
  });

  return {
    access: {
      token: accessToken,
      expires: moment().add(config.jwt.accessExpirationMinutes, 'minutes').toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

/**
 * Verify refresh token
 * @param {string} refreshToken
 * @returns {Promise<Token>}
 */
const verifyRefreshToken = async (refreshToken) => {
  const tokenDoc = await Token.findOne({
    token: refreshToken,
    type: 'refresh',
    blacklisted: false,
    expires: { $gt: new Date() },
  });

  if (!tokenDoc) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  return tokenDoc;
};

/**
 * Đăng ký user mới
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const register = async (userBody) => {
  // Kiểm tra xem email đã tồn tại chưa
  if (await User.findOne({ email: userBody.email })) {
    throw new ApiError(409, 'Email already taken');
  }

  // Tạo user mới
  const user = await User.create(userBody);
  return user;
};

/**
 * Đăng nhập với email và password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>}
 */
const login = async (email, password) => {
  // Tìm user
  const user = await User.findOne({ email });
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(401, 'Incorrect email or password');
  }

  // Cập nhật thời gian đăng nhập
  user.lastLoginAt = new Date();
  await user.save();

  // Tạo tokens
  const tokens = await generateTokens(user);
  return { user, tokens };
};

/**
 * Làm mới access token
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuth = async (refreshToken) => {
  // Verify refresh token
  const tokenDoc = await verifyRefreshToken(refreshToken);

  // Tìm user
  const user = await User.findById(tokenDoc.user);
  if (!user) {
    throw new ApiError(401, 'User not found');
  }

  // Blacklist token cũ
  await Token.findByIdAndUpdate(tokenDoc._id, { blacklisted: true });

  // Tạo tokens mới
  const tokens = await generateTokens(user);
  return { user, tokens };
};

/**
 * Đăng xuất
 * @param {string} refreshToken
 * @returns {Promise}
 */
const logout = async (refreshToken) => {
  const tokenDoc = await Token.findOne({
    token: refreshToken,
    type: 'refresh',
    blacklisted: false,
  });

  if (!tokenDoc) {
    throw new ApiError(404, 'Token not found');
  }

  await Token.findByIdAndUpdate(tokenDoc._id, { blacklisted: true });
};

module.exports = {
  register,
  login,
  refreshAuth,
  logout,
  generateTokens,
  verifyRefreshToken,
};