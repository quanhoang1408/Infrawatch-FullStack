// src/api/v1/auth/auth.controller.js
const authService = require('../../../services/auth.service');
const { asyncHandler } = require('../../../utils/asyncHandler');

/**
 * Đăng ký user mới
 */
const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).send(user);
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
  const { user, tokens } = await authService.refreshAuth(refreshToken);
  res.send({ user, tokens });
});

/**
 * Đăng xuất
 */
const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(204).send();
});

module.exports = {
  register,
  login,
  refreshTokens,
  logout,
};