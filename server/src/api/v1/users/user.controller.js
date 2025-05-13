// src/api/v1/users/user.controller.js
const userService = require('../../../services/user.service');
const { asyncHandler } = require('../../../utils/asyncHandler');

/**
 * Get user profile
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.user.id);
  res.send(user);
});

/**
 * Update user profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateUserById(req.user.id, req.body);
  res.send(user);
});

module.exports = {
  getProfile,
  updateProfile,
};
