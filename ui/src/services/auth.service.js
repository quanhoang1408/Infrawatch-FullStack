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
    
    // Save tokens to storage
    setTokens(tokens.access.token, tokens.refresh.token);
    
    return { user, tokens };
  },

  /**
   * Login a user
   * @param {object} credentials - User login credentials
   * @returns {Promise} - Promise with user data and tokens
   */
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const { user, tokens } = response.data;
    
    // Save tokens to storage
    setTokens(tokens.access.token, tokens.refresh.token);
    
    return { user, tokens };
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
        console.error('Logout error:', error);
      }
    }
    clearTokens();
  },

  /**
   * Get current user info
   * @returns {Promise} - Promise with user data
   */
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export default authService;