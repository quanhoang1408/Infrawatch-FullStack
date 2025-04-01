import React, { createContext, useState, useEffect, useCallback } from 'react';
import settingsService from '../services/settings.service';
import { LOCAL_STORAGE_KEYS } from '../constants/storage.constants';
import { DEFAULT_SETTINGS } from '../constants/settings.constants';

// Tạo context cho settings
export const SettingsContext = createContext();

/**
 * SettingsProvider cung cấp quản lý cài đặt người dùng cho toàn bộ ứng dụng
 */
export const SettingsProvider = ({ children }) => {
  // State lưu trữ cài đặt người dùng
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  // State theo dõi quá trình tải dữ liệu
  const [isLoading, setIsLoading] = useState(true);
  // State lưu trữ lỗi
  const [error, setError] = useState(null);

  /**
   * Lấy cài đặt người dùng từ API hoặc localStorage
   */
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Kiểm tra xem có cài đặt được lưu trong localStorage không
      const storedSettings = localStorage.getItem(LOCAL_STORAGE_KEYS.SETTINGS);
      
      if (storedSettings) {
        // Nếu có, sử dụng cài đặt từ localStorage
        setSettings(JSON.parse(storedSettings));
      } else {
        // Nếu không, lấy cài đặt từ API
        const userSettings = await settingsService.getSettings();
        setSettings(userSettings);
        
        // Lưu cài đặt vào localStorage
        localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(userSettings));
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err.message);
      
      // Nếu có lỗi, sử dụng cài đặt mặc định
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Cập nhật một cài đặt cụ thể
   * @param {string} key Khóa của cài đặt cần cập nhật
   * @param {any} value Giá trị mới
   */
  const updateSetting = useCallback(async (key, value) => {
    try {
      // Cập nhật state
      setSettings(prev => ({
        ...prev,
        [key]: value
      }));
      
      // Cập nhật localStorage
      const updatedSettings = {
        ...settings,
        [key]: value
      };
      localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
      
      // Đồng bộ với server
      await settingsService.updateSetting(key, value);
      
      return true;
    } catch (err) {
      console.error(`Error updating setting ${key}:`, err);
      setError(err.message);
      
      // Khôi phục giá trị cũ nếu cập nhật server thất bại
      await fetchSettings();
      
      return false;
    }
  }, [settings, fetchSettings]);

  /**
   * Cập nhật nhiều cài đặt cùng lúc
   * @param {Object} newSettings Các cài đặt cần cập nhật
   */
  const updateMultipleSettings = useCallback(async (newSettings) => {
    try {
      // Cập nhật state
      setSettings(prev => ({
        ...prev,
        ...newSettings
      }));
      
      // Cập nhật localStorage
      const updatedSettings = {
        ...settings,
        ...newSettings
      };
      localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
      
      // Đồng bộ với server
      await settingsService.updateMultipleSettings(newSettings);
      
      return true;
    } catch (err) {
      console.error('Error updating multiple settings:', err);
      setError(err.message);
      
      // Khôi phục giá trị cũ nếu cập nhật server thất bại
      await fetchSettings();
      
      return false;
    }
  }, [settings, fetchSettings]);

  /**
   * Reset cài đặt về mặc định
   */
  const resetSettings = useCallback(async () => {
    try {
      // Cập nhật state
      setSettings(DEFAULT_SETTINGS);
      
      // Cập nhật localStorage
      localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      
      // Đồng bộ với server
      await settingsService.resetSettings();
      
      return true;
    } catch (err) {
      console.error('Error resetting settings:', err);
      setError(err.message);
      
      // Khôi phục giá trị cũ nếu reset thất bại
      await fetchSettings();
      
      return false;
    }
  }, [fetchSettings]);

  // Lấy cài đặt khi component được mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Value object chứa tất cả state và functions sẽ được chia sẻ qua context
  const contextValue = {
    settings,
    isLoading,
    error,
    updateSetting,
    updateMultipleSettings,
    resetSettings,
    fetchSettings
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;