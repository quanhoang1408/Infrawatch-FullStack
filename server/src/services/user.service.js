// src/services/user.service.js
const { User } = require('../models');
const { ApiError } = require('../utils/errors');
const bcrypt = require('bcryptjs');

/**
 * Create a new user
 * @param {Object} userBody - User data
 * @returns {Promise<User>} Created user
 */
const createUser = async (userBody) => {
  // Check if email already exists
  if (await User.findOne({ email: userBody.email })) {
    throw new ApiError(409, 'Email already taken');
  }

  // Create user
  const user = await User.create(userBody);
  return user;
};

/**
 * Get all users
 * @returns {Promise<Array>} List of users
 */
const getUsers = async () => {
  return User.find();
};

/**
 * Get user by ID
 * @param {string} id - User ID
 * @returns {Promise<User>} User object
 */
const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

/**
 * Update user by ID
 * @param {string} id - User ID
 * @param {Object} updateBody - Fields to update
 * @returns {Promise<User>} Updated user
 */
const updateUserById = async (id, updateBody) => {
  const user = await getUserById(id);

  // If updating email, check if it's already taken
  if (updateBody.email && (await User.findOne({ email: updateBody.email, _id: { $ne: id } }))) {
    throw new ApiError(409, 'Email already taken');
  }

  // If updating password, hash it
  if (updateBody.password) {
    updateBody.password = await bcrypt.hash(updateBody.password, 10);
  }

  // Update user
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Delete user by ID
 * @param {string} id - User ID
 * @returns {Promise<boolean>} True if deleted
 */
const deleteUserById = async (id) => {
  const user = await getUserById(id);
  await user.remove();
  return true;
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUserById,
  deleteUserById,
};
