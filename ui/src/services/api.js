import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../utils/storage.utils';

// Make sure the URL points to the correct backend server
// Should be defined in .env files for different environments
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

// Log the API URL in development
if (process.env.NODE_ENV === 'development') {
  console.log('API Base URL:', baseURL);
  console.log('Environment variables:', process.env);
}

// Check if the URL is valid
try {
  new URL(baseURL);
  console.log('API URL is valid');
} catch (error) {
  console.error('Invalid API URL:', baseURL, error);
}

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add CORS settings
  withCredentials: false,
  timeout: 60000, // 60 seconds timeout - tăng timeout để tránh lỗi timeout
  // Thêm cấu hình retry để tự động thử lại khi gặp lỗi network
  maxRetries: 3,
  retryDelay: 1000,
});

// Log all requests in development
if (process.env.NODE_ENV === 'development') {
  axios.interceptors.request.use(request => {
    console.log('Starting Request', request.method, request.url);
    console.log('Request Headers:', request.headers);
    return request;
  });

  axios.interceptors.response.use(response => {
    console.log('Response:', response.status, response.statusText);
    return response;
  }, error => {
    console.error('Response Error:', error.message);
    if (error.response) {
      console.error('Error Status:', error.response.status);
      console.error('Error Headers:', error.response.headers);
      console.error('Error Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    console.error('Error Config:', error.config);
    return Promise.reject(error);
  });
}

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // In development, log requests with more details
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
      console.log('Request Config:', {
        url: config.url,
        method: config.method,
        baseURL: config.baseURL,
        headers: config.headers,
        data: config.data
      });
    }

    const token = getAccessToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling token refresh and network errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Response Success:', {
        url: response.config.url,
        method: response.config.method,
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
    }
    return response;
  },
  async (error) => {
    // Enhanced error logging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      stack: error.stack
    });

    const originalRequest = error.config;

    // Thêm logic retry cho lỗi network
    if (!error.response && error.code === 'ECONNABORTED' && !originalRequest._networkRetry) {
      // Lỗi timeout hoặc network
      originalRequest._networkRetry = (originalRequest._networkRetry || 0) + 1;

      // Chỉ retry tối đa 3 lần
      if (originalRequest._networkRetry <= 3) {
        console.log(`Retrying network request (${originalRequest._networkRetry}/3)...`);

        // Đợi một khoảng thời gian trước khi thử lại
        await new Promise(resolve => setTimeout(resolve, 1000));

        return api(originalRequest);
      }
    }

    // If error is not 401 or request has already been retried for auth, reject
    if (error.response?.status !== 401 || originalRequest._authRetry) {
      return Promise.reject(error);
    }

    // Attempt to refresh the token
    originalRequest._authRetry = true;
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