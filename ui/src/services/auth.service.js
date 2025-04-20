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
    try {
      const response = await api.post('/auth/login', credentials);
      const { user, tokens } = response.data;

      // Save tokens to storage
      setTokens(tokens.access.token, tokens.refresh.token);

      return { user, tokens };
    } catch (error) {
      console.error('Login error:', error);

      // Only use mock data in development mode and if explicitly allowed
      if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_MOCK_DATA === 'true') {
        console.warn('API login failed, using mock data for development');

        // Mock user and tokens for development
        const mockUser = {
          id: 'mock-user-id',
          email: credentials.email,
          name: 'Test User',
          role: 'admin'
        };

        const mockTokens = {
          access: {
            token: 'mock-access-token',
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          },
          refresh: {
            token: 'mock-refresh-token',
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        };

        // Save mock tokens to storage
        setTokens(mockTokens.access.token, mockTokens.refresh.token);

        return { user: mockUser, tokens: mockTokens };
      }

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
    try {
      const response = await api.get('/auth/me');
      console.log('getCurrentUser response:', response);

      // Check if response is HTML from ngrok
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>') && response.data.includes('ngrok')) {
        console.error('Received HTML from ngrok instead of JSON. This is likely the ngrok warning page.');
        console.error('Please open the ngrok URL in a browser first and accept the warning:');
        console.error(api.defaults.baseURL);

        // Show a more helpful error message
        const error = new Error('Ngrok requires browser confirmation. Please open the ngrok URL in your browser first.');
        error.isNgrokError = true;
        throw error;
      }

      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);

      // Only use mock data in development mode and if explicitly allowed
      if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_MOCK_DATA === 'true') {
        console.warn('API getCurrentUser failed, using mock data for development');
        console.error('Error details:', error);

        // Return mock user for development with admin role
        const mockUser = {
          id: 'mock-user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin'  // Đảm bảo role là 'admin' để hiển thị tab Providers
        };
        console.log('Using mock user:', mockUser);
        return mockUser;
      }

      throw error;
    }
  },
};

export default authService;