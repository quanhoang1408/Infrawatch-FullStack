// src/api/v1/auth/auth.controller.js
const authService = require('../../../services/auth.service');
const { asyncHandler } = require('../../../utils/asyncHandler');

/**
 * Đăng ký user mới
 */
const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  const tokens = await authService.generateTokens(user);
  res.status(201).send({ user, tokens });
});

/**
 * Đăng nhập
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, tokens } = await authService.login(email, password);
  res.send({ user, tokens });
});

/**
 * Refresh token
 */
const refreshTokens = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const { tokens } = await authService.refreshAuth(refreshToken);
  res.send(tokens);
});

/**
 * Đăng xuất
 */
const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(204).send();
});

/**
 * Lấy thông tin user hiện tại
 */
const getMe = asyncHandler(async (req, res) => {
  res.send(req.user);
});

module.exports = {
  register,
  login,
  refreshTokens,
  logout,
  getMe,
};