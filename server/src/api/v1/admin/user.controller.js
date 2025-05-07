// src/api/v1/admin/user.controller.js
const userService = require('../../../services/user.service');
const { asyncHandler } = require('../../../utils/asyncHandler');

/**
 * Create a new user
 */
const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).send(user);
});

/**
 * Get all users
 */
const getUsers = asyncHandler(async (req, res) => {
  const users = await userService.getUsers();
  res.send(users);
});

/**
 * Get user by ID
 */
const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  res.send(user);
});

/**
 * Update user by ID
 */
const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user);
});

/**
 * Delete user by ID
 */
const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(204).send();
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};
