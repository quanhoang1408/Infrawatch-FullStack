import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../utils/storage.utils';

// Make sure the URL points to the correct backend server
// Should be defined in .env files for different environments
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Log the API URL in development
if (process.env.NODE_ENV === 'development') {
  console.log('API Base URL:', baseURL);
}

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // In development, log requests
    if (process.env.NODE_ENV === 'development') {
      console.log(`${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    
    const token = getAccessToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is not 401 or request has already been retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Attempt to refresh the token
    originalRequest._retry = true;
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        // No refresh token available, clear tokens and reject
        clearTokens();
        return Promise.reject(error);
      }

      const response = await axios.post(`${baseURL}/auth/refresh-tokens`, {
        refreshToken,
      });

      const { access, refresh } = response.data;
      
      // Save new tokens
      setTokens(access.token, refresh.token);
      
      // Update the authorization header
      originalRequest.headers['Authorization'] = `Bearer ${access.token}`;
      
      // Retry the original request
      return api(originalRequest);
    } catch (refreshError) {
      // Clear tokens on refresh failure
      clearTokens();
      return Promise.reject(refreshError);
    }
  }
);

export default api;