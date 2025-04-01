import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/auth.service';
import { LOCAL_STORAGE_KEYS } from '../constants/storage.constants';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes.constants';

// Tạo context cho authentication
export const AuthContext = createContext();

/**
 * AuthProvider component cung cấp trạng thái xác thực và các hàm liên quan
 * cho toàn bộ ứng dụng
 */
export const AuthProvider = ({ children }) => {
  // State quản lý thông tin user, token và trạng thái loading
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  // Kiểm tra xem user đã đăng nhập chưa
  const isAuthenticated = !!token;

  /**
   * Khởi tạo auth state từ localStorage khi component được mount
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Lấy token từ localStorage
        const storedToken = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
        
        if (storedToken) {
          setToken(storedToken);
          
          // Lấy thông tin user từ localStorage hoặc từ API
          const storedUser = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.USER));
          
          if (storedUser) {
            setCurrentUser(storedUser);
          } else {
            // Nếu không có thông tin user trong localStorage, gọi API để lấy
            const userInfo = await authService.getCurrentUser();
            setCurrentUser(userInfo);
            localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(userInfo));
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError(err.message);
        // Nếu có lỗi, xóa token và user từ localStorage
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Thực hiện đăng nhập
   * @param {string} email Email người dùng
   * @param {string} password Mật khẩu
   * @returns {Promise} Kết quả đăng nhập
   */
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(email, password);
      const { token, user } = response;
      
      // Lưu token và thông tin user vào localStorage
      localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(user));
      
      // Cập nhật state
      setToken(token);
      setCurrentUser(user);
      
      return response;
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Thực hiện đăng ký
   * @param {Object} userData Thông tin đăng ký
   * @returns {Promise} Kết quả đăng ký
   */
  const register = useCallback(async (userData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.register(userData);
      return response;
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Thực hiện đăng xuất
   */
  const logout = useCallback(() => {
    // Xóa token và thông tin user từ localStorage
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
    
    // Reset state
    setToken(null);
    setCurrentUser(null);
    
    // Chuyển hướng về trang đăng nhập
    navigate(ROUTES.LOGIN);
  }, [navigate]);

  /**
   * Cập nhật thông tin người dùng
   * @param {Object} updatedUser Thông tin người dùng đã cập nhật
   */
  const updateUser = useCallback((updatedUser) => {
    setCurrentUser(prev => ({ ...prev, ...updatedUser }));
    
    // Cập nhật thông tin trong localStorage
    const storedUser = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.USER));
    if (storedUser) {
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.USER, 
        JSON.stringify({ ...storedUser, ...updatedUser })
      );
    }
  }, []);

  /**
   * Kiểm tra xem người dùng có quyền truy cập tính năng không
   * @param {string} permission Tên quyền cần kiểm tra
   * @returns {boolean} Có quyền hay không
   */
  const hasPermission = useCallback((permission) => {
    if (!currentUser || !currentUser.permissions) {
      return false;
    }
    
    return currentUser.permissions.includes(permission);
  }, [currentUser]);

  // Value object chứa tất cả state và functions sẽ được chia sẻ qua context
  const contextValue = {
    currentUser,
    token,
    isLoading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    hasPermission
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;