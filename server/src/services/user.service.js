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
    throw new ApiError(409, 'Email đã được sử dụng');
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
    throw new ApiError(404, 'Không tìm thấy người dùng');
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
  try {
    const user = await getUserById(id);

    // Kiểm tra xem có trường nào được cập nhật không
    if (Object.keys(updateBody).length === 0) {
      throw new ApiError(400, 'Không có thông tin nào được cập nhật');
    }

    // If updating email, check if it's already taken
    if (updateBody.email && (await User.findOne({ email: updateBody.email, _id: { $ne: id } }))) {
      throw new ApiError(409, 'Email đã được sử dụng bởi người dùng khác');
    }

    // If updating password, hash it
    if (updateBody.password) {
      updateBody.password = await bcrypt.hash(updateBody.password, 10);
    }

    // Cập nhật từng trường một cách rõ ràng
    if (updateBody.name) user.name = updateBody.name;
    if (updateBody.email) user.email = updateBody.email;
    if (updateBody.password) user.password = updateBody.password;
    if (updateBody.role) user.role = updateBody.role;
    if (updateBody.status) user.status = updateBody.status;

    await user.save();
    return user;
  } catch (error) {
    // Ghi log lỗi để dễ dàng debug
    console.error('Error updating user:', error);

    // Ném lại lỗi để controller xử lý
    throw error;
  }
};

/**
 * Delete user by ID
 * @param {string} id - User ID
 * @returns {Promise<boolean>} True if deleted
 */
const deleteUserById = async (id) => {
  const { VMAssignment, Token, Activity, Command } = require('../models');
  const user = await getUserById(id);

  // Kiểm tra xem người dùng có VM assignments không
  const vmAssignments = await VMAssignment.find({ userId: id });
  if (vmAssignments.length > 0) {
    throw new ApiError(400, 'Không thể xóa người dùng vì họ đang được gán quyền truy cập vào một số máy ảo. Vui lòng xóa các phân quyền trước.');
  }

  // Xóa tất cả tokens liên quan đến người dùng
  await Token.deleteMany({ user: id });

  // Cập nhật hoạt động để không tham chiếu đến người dùng đã xóa
  // Không xóa hoạt động vì chúng vẫn có giá trị lịch sử
  await Activity.updateMany({ user: id }, { $unset: { user: 1 } });

  // Cập nhật lệnh để không tham chiếu đến người dùng đã xóa
  await Command.updateMany({ createdBy: id }, { $unset: { createdBy: 1 } });

  // Xóa người dùng
  await User.deleteOne({ _id: id });

  return true;
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUserById,
  deleteUserById,
};
