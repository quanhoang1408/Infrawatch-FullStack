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
    throw new ApiError(401, 'Token làm mới không hợp lệ');
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
    throw new ApiError(409, 'Email đã được sử dụng');
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
    throw new ApiError(401, 'Email hoặc mật khẩu không chính xác');
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
    throw new ApiError(401, 'Không tìm thấy người dùng');
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
    throw new ApiError(404, 'Không tìm thấy token');
  }

  await Token.findByIdAndUpdate(tokenDoc._id, { blacklisted: true });
};

/**
 * Gửi email quên mật khẩu
 * @param {string} email
 * @returns {Promise<Token>}
 */
const forgotPassword = async (email) => {
  // Tìm user
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'Không tìm thấy người dùng với email này');
  }

  // Tạo token đặt lại mật khẩu
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpires = moment().add(1, 'hours');

  // Lưu token vào database
  const tokenDoc = await Token.create({
    token: resetToken,
    user: user.id,
    type: 'resetPassword',
    expires: resetTokenExpires.toDate(),
  });

  // TODO: Gửi email với link đặt lại mật khẩu
  // Trong môi trường thực tế, bạn sẽ gửi email với link chứa token
  // Ví dụ: https://your-app.com/reset-password?token=resetToken

  return tokenDoc;
};

/**
 * Đặt lại mật khẩu
 * @param {string} resetToken
 * @param {string} newPassword
 * @returns {Promise<User>}
 */
const resetPassword = async (resetToken, newPassword) => {
  // Tìm token hợp lệ
  const tokenDoc = await Token.findOne({
    token: resetToken,
    type: 'resetPassword',
    blacklisted: false,
    expires: { $gt: new Date() },
  });

  if (!tokenDoc) {
    throw new ApiError(401, 'Token không hợp lệ hoặc đã hết hạn');
  }

  // Tìm user
  const user = await User.findById(tokenDoc.user);
  if (!user) {
    throw new ApiError(404, 'Không tìm thấy người dùng');
  }

  // Cập nhật mật khẩu
  user.password = newPassword;
  await user.save();

  // Blacklist token
  await Token.findByIdAndUpdate(tokenDoc._id, { blacklisted: true });

  return user;
};

/**
 * Thay đổi mật khẩu của người dùng đã đăng nhập
 * @param {string} userId - ID của người dùng
 * @param {string} currentPassword - Mật khẩu hiện tại
 * @param {string} newPassword - Mật khẩu mới
 * @returns {Promise<User>} - Thông tin người dùng đã cập nhật
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  // Tìm user
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'Không tìm thấy người dùng');
  }

  // Kiểm tra mật khẩu hiện tại
  const isPasswordMatch = await user.isPasswordMatch(currentPassword);
  if (!isPasswordMatch) {
    throw new ApiError(401, 'Mật khẩu hiện tại không chính xác');
  }

  // Kiểm tra mật khẩu mới không trùng với mật khẩu cũ
  if (await user.isPasswordMatch(newPassword)) {
    throw new ApiError(400, 'Mật khẩu mới không được trùng với mật khẩu cũ');
  }

  // Cập nhật mật khẩu
  user.password = newPassword;
  await user.save();

  return user;
};

module.exports = {
  register,
  login,
  refreshAuth,
  logout,
  generateTokens,
  verifyRefreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
};