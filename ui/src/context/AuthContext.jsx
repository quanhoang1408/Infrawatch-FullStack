import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import { isAuthenticated, clearTokens } from '../utils/storage.utils';

// Create the context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Check if user is already logged in on app load
  useEffect(() => {
    const initAuth = async () => {
      if (isAuthenticated()) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (err) {
          console.error('Không thể lấy dữ liệu người dùng:', err);
          clearTokens();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Register user
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.register(userData);
      // Don't set user after registration - user needs to login separately
      setLoading(false);
      return result;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Đăng ký thất bại');
      throw err;
    }
  };

  // Login user
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.login(credentials);
      setUser(result.user);
      setLoading(false);
      return result;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
      throw err;
    }
  };

  // Logout user
  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      navigate('/login');
    } catch (err) {
      console.error('Lỗi đăng xuất:', err);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};