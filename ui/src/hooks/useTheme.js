import { useContext, useEffect } from 'react';
import { ThemeContext } from '../context';
import { useLocalStorage } from './useLocalStorage';
import { THEME_KEY } from '../constants/storage.constants';

/**
 * Hook để quản lý theme của ứng dụng (sáng/tối)
 * 
 * @returns {Object} Các phương thức và trạng thái liên quan đến theme
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  const { getItem, setItem } = useLocalStorage();

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  const { theme, setTheme } = context;

  /**
   * Thay đổi theme hiện tại
   * 
   * @param {string} newTheme - Theme mới ('light' hoặc 'dark')
   */
  const changeTheme = (newTheme) => {
    if (newTheme !== 'light' && newTheme !== 'dark') {
      console.error('Invalid theme specified. Use "light" or "dark"');
      return;
    }

    setTheme(newTheme);
    setItem(THEME_KEY, newTheme);
    applyTheme(newTheme);
  };

  /**
   * Chuyển đổi giữa theme sáng và tối
   */
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    changeTheme(newTheme);
  };

  /**
   * Áp dụng theme vào DOM
   * 
   * @param {string} themeName - Tên theme cần áp dụng
   */
  const applyTheme = (themeName) => {
    // Cập nhật class cho body để áp dụng CSS theme tương ứng
    const body = document.body;
    if (themeName === 'dark') {
      body.classList.add('dark-theme');
      body.classList.remove('light-theme');
    } else {
      body.classList.add('light-theme');
      body.classList.remove('dark-theme');
    }
    
    // Cập nhật meta theme-color cho mobile
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content', 
        themeName === 'dark' ? '#1a1a1a' : '#ffffff'
      );
    }
  };

  /**
   * Xác định theme dựa trên tùy chọn hệ thống
   * 
   * @returns {string} - Theme phù hợp ('light' hoặc 'dark')
   */
  const getSystemTheme = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light';
  };

  /**
   * Tự động phát hiện và áp dụng theme dựa trên hệ thống
   */
  const useSystemTheme = () => {
    const systemTheme = getSystemTheme();
    changeTheme(systemTheme);
    
    // Lưu vào localStorage với một flag để biết đang sử dụng theme hệ thống
    setItem(THEME_KEY, 'system');
  };

  // Áp dụng theme mỗi khi component mount hoặc theme thay đổi
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Lắng nghe sự thay đổi theme hệ thống
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      // Chỉ tự động áp dụng nếu đang sử dụng theme hệ thống
      if (getItem(THEME_KEY) === 'system') {
        const newTheme = getSystemTheme();
        setTheme(newTheme);
        applyTheme(newTheme);
      }
    };
    
    // Đăng ký sự kiện cho thay đổi theme hệ thống
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback cho các trình duyệt cũ hơn
      mediaQuery.addListener(handleChange);
    }
    
    // Cleanup sự kiện khi unmount
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  /**
   * Kiểm tra xem hiện tại có đang sử dụng dark theme hay không
   * 
   * @returns {boolean} True nếu đang sử dụng dark theme
   */
  const isDarkTheme = () => theme === 'dark';

  return {
    theme,
    isDarkTheme,
    changeTheme,
    toggleTheme,
    useSystemTheme
  };
};

export default useTheme;