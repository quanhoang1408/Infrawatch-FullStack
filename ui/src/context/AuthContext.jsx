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
          console.error('Failed to fetch user data:', err);
          clearTokens();

          // For development: Auto-login with test credentials
          if (process.env.NODE_ENV === 'development') {
            try {
              console.log('Attempting auto-login with test credentials...');
              const result = await authService.login({
                email: 'test@example.com',
                password: 'password123'
              });
              setUser(result.user);
              console.log('Auto-login successful');
            } catch (loginErr) {
              console.error('Auto-login failed:', loginErr);
            }
          }
        }
      } else {
        // For development: Auto-login with test credentials if not authenticated
        if (process.env.NODE_ENV === 'development') {
          try {
            console.log('Attempting auto-login with test credentials...');
            const result = await authService.login({
              email: 'test@example.com',
              password: 'password123'
            });
            setUser(result.user);
            console.log('Auto-login successful');
          } catch (loginErr) {
            console.error('Auto-login failed:', loginErr);
          }
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
      setUser(result.user);
      setLoading(false);
      return result;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Registration failed');
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
      setError(err.response?.data?.message || 'Login failed');
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
      console.error('Logout error:', err);
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