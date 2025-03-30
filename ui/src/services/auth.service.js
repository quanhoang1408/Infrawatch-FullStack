import api from './api';

/**
 * Authenticate user and get token
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise} - Response with token and user data
 */
export const loginService = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

/**
 * Register a new user
 * @param {Object} userData - User data (username, password, email, name, etc.)
 * @returns {Promise} - Response with new user data
 */
export const registerService = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

/**
 * Logout user
 * @returns {Promise} - Success response
 */
export const logoutService = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

/**
 * Get current authenticated user data
 * @returns {Promise} - Response with user data
 */
export const getCurrentUserService = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

/**
 * Update user profile
 * @param {Object} userData - User data to update
 * @returns {Promise} - Response with updated user data
 */
export const updateProfileService = async (userData) => {
  const response = await api.patch('/auth/profile', userData);
  return response.data;
};

/**
 * Change user password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise} - Success response
 */
export const changePasswordService = async (currentPassword, newPassword) => {
  const response = await api.post('/auth/change-password', {
    currentPassword,
    newPassword
  });
  return response.data;
};

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise} - Success response
 */
export const requestPasswordResetService = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

/**
 * Reset password with token
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise} - Success response
 */
export const resetPasswordService = async (token, newPassword) => {
  const response = await api.post('/auth/reset-password', {
    token,
    newPassword
  });
  return response.data;
};