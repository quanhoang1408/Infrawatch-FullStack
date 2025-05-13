import api from './api';
import { setTokens, clearTokens } from '../utils/storage.utils';

const authService = {
  /**
   * Register a new user
   * @param {object} userData - User registration data
   * @returns {Promise} - Promise with user data and tokens
   */
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    const { user, tokens } = response.data;

    // Don't save tokens after registration - user needs to login separately
    // setTokens(tokens.access.token, tokens.refresh.token);

    return { user, tokens };
  },

  /**
   * Login a user
   * @param {object} credentials - User login credentials
   * @returns {Promise} - Promise with user data and tokens
   */
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { user, tokens } = response.data;

      // Save tokens to storage
      setTokens(tokens.access.token, tokens.refresh.token);

      return { user, tokens };
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      throw error;
    }
  },

  /**
   * Logout the current user
   * @returns {Promise} - Promise with logout result
   */
  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch (error) {
        console.error('Lỗi đăng xuất:', error);
      }
    }
    clearTokens();
  },

  /**
   * Get current user info
   * @returns {Promise} - Promise with user data
   */
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');

      // Check if response is HTML from ngrok
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>') && response.data.includes('ngrok')) {
        console.error('Nhận được HTML từ ngrok thay vì JSON. Đây có thể là trang cảnh báo của ngrok.');
        console.error('Vui lòng mở URL ngrok trong trình duyệt trước và chấp nhận cảnh báo:');
        console.error(api.defaults.baseURL);

        // Show a more helpful error message
        const error = new Error('Ngrok yêu cầu xác nhận trình duyệt. Vui lòng mở URL ngrok trong trình duyệt của bạn trước.');
        error.isNgrokError = true;
        throw error;
      }

      return response.data;
    } catch (error) {
      console.error('Lỗi lấy thông tin người dùng hiện tại:', error);
      throw error;
    }
  },
};

export default authService;