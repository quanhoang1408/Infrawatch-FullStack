import axios from 'axios';
import { message } from 'antd';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    
    // If no response from server
    if (!error.response) {
      message.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.');
      return Promise.reject(error);
    }
    
    // Handle 401 errors (unauthorized)
    if (error.response.status === 401 && !originalRequest._retry) {
      // Avoid infinite loops - only retry once
      originalRequest._retry = true;

      // If not on login page, redirect to login
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        message.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        window.location.href = '/login';
      }
    }
    
    // Handle other common errors
    if (error.response.status === 403) {
      message.error('Bạn không có quyền thực hiện hành động này');
    }
    
    if (error.response.status === 404) {
      message.error('Không tìm thấy tài nguyên yêu cầu');
    }
    
    if (error.response.status === 500) {
      message.error('Lỗi máy chủ. Vui lòng thử lại sau');
    }
    
    return Promise.reject(error);
  }
);

export default api;