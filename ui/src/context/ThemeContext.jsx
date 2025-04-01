import React, { createContext, useState, useEffect, useCallback } from 'react';
import { THEME_TYPES, LOCAL_STORAGE_KEYS } from '../constants/theme.constants';

// Tạo context cho theme
export const ThemeContext = createContext();

/**
 * ThemeProvider cung cấp chức năng quản lý theme (sáng/tối) cho toàn bộ ứng dụng
 */
export const ThemeProvider = ({ children }) => {
  // Kiểm tra theme từ localStorage hoặc preference của người dùng
  const getInitialTheme = () => {
    // Kiểm tra theme đã lưu trong localStorage
    const savedTheme = localStorage.getItem(LOCAL_STORAGE_KEYS.THEME);
    if (savedTheme && Object.values(THEME_TYPES).includes(savedTheme)) {
      return savedTheme;
    }

    // Nếu không có trong localStorage, kiểm tra preference của trình duyệt
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDarkMode ? THEME_TYPES.DARK : THEME_TYPES.LIGHT;
  };

  // State lưu trữ theme hiện tại
  const [currentTheme, setCurrentTheme] = useState(getInitialTheme);

  /**
   * Lưu theme vào localStorage và cập nhật thuộc tính data-theme trên html element
   */
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', currentTheme);
    localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, currentTheme);
  }, [currentTheme]);

  /**
   * Lắng nghe thay đổi preference của trình duyệt
   */
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      // Chỉ áp dụng nếu người dùng chưa chọn theme cụ thể (không có trong localStorage)
      if (!localStorage.getItem(LOCAL_STORAGE_KEYS.THEME)) {
        setCurrentTheme(mediaQuery.matches ? THEME_TYPES.DARK : THEME_TYPES.LIGHT);
      }
    };
    
    // Thiết lập event listener
    mediaQuery.addEventListener('change', handleChange);
    
    // Cleanup
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  /**
   * Thay đổi theme
   * @param {string} theme Theme cần thay đổi (light/dark)
   */
  const changeTheme = useCallback((theme) => {
    if (Object.values(THEME_TYPES).includes(theme)) {
      setCurrentTheme(theme);
    } else {
      console.error(`Invalid theme type: ${theme}. Expected: ${Object.values(THEME_TYPES).join(', ')}`);
    }
  }, []);

  /**
   * Toggle giữa light và dark theme
   */
  const toggleTheme = useCallback(() => {
    setCurrentTheme(prevTheme => 
      prevTheme === THEME_TYPES.LIGHT ? THEME_TYPES.DARK : THEME_TYPES.LIGHT
    );
  }, []);

  /**
   * Kiểm tra xem theme hiện tại có phải là dark không
   */
  const isDarkTheme = currentTheme === THEME_TYPES.DARK;

  // Value object chứa tất cả state và functions sẽ được chia sẻ qua context
  const contextValue = {
    currentTheme,
    isDarkTheme,
    changeTheme,
    toggleTheme,
    themeTypes: THEME_TYPES
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;