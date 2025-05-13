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

/**
 * Quên mật khẩu
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const token = await authService.forgotPassword(email);

  // Trong môi trường thực tế, chúng ta sẽ không trả về token
  // Thay vào đó, chúng ta sẽ gửi email với link đặt lại mật khẩu
  // Ở đây, chúng ta trả về token để dễ dàng kiểm thử
  res.status(200).send({
    message: 'Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn',
    token: token.token // Chỉ trả về trong môi trường phát triển
  });
});

/**
 * Đặt lại mật khẩu
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  await authService.resetPassword(token, password);
  res.status(200).send({ message: 'Mật khẩu đã được đặt lại thành công' });
});

module.exports = {
  register,
  login,
  refreshTokens,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
};