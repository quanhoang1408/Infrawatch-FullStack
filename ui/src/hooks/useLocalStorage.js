import { useState } from 'react';

/**
 * Hook để tương tác với localStorage an toàn và thuận tiện
 * 
 * @returns {Object} Các phương thức và trạng thái liên quan đến localStorage
 */
export const useLocalStorage = () => {
  const [error, setError] = useState(null);

  /**
   * Lấy giá trị từ localStorage
   * 
   * @param {string} key - Khóa lưu trữ
   * @param {*} defaultValue - Giá trị mặc định nếu không tìm thấy khóa
   * @returns {*} Giá trị được lưu trữ hoặc giá trị mặc định
   */
  const getItem = (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      
      if (item === null) {
        return defaultValue;
      }
      
      try {
        // Thử parse dữ liệu JSON
        return JSON.parse(item);
      } catch (e) {
        // Nếu không phải JSON, trả về string
        return item;
      }
    } catch (error) {
      console.error(`Error getting item ${key} from localStorage:`, error);
      setError(error);
      return defaultValue;
    }
  };

  /**
   * Lưu giá trị vào localStorage
   * 
   * @param {string} key - Khóa lưu trữ
   * @param {*} value - Giá trị cần lưu
   * @returns {boolean} True nếu thành công, false nếu thất bại
   */
  const setItem = (key, value) => {
    try {
      // Chuyển đổi dữ liệu phức tạp thành JSON string
      const valueToStore = typeof value === 'object' 
        ? JSON.stringify(value) 
        : String(value);
      
      localStorage.setItem(key, valueToStore);
      return true;
    } catch (error) {
      console.error(`Error setting item ${key} in localStorage:`, error);
      setError(error);
      return false;
    }
  };

  /**
   * Xóa một mục khỏi localStorage
   * 
   * @param {string} key - Khóa cần xóa
   * @returns {boolean} True nếu thành công, false nếu thất bại
   */
  const removeItem = (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing item ${key} from localStorage:`, error);
      setError(error);
      return false;
    }
  };

  /**
   * Xóa tất cả dữ liệu trong localStorage
   * 
   * @returns {boolean} True nếu thành công, false nếu thất bại
   */
  const clear = () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      setError(error);
      return false;
    }
  };

  /**
   * Kiểm tra xem khóa có tồn tại trong localStorage hay không
   * 
   * @param {string} key - Khóa cần kiểm tra
   * @returns {boolean} True nếu khóa tồn tại, false nếu không
   */
  const hasItem = (key) => {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error(`Error checking key ${key} in localStorage:`, error);
      setError(error);
      return false;
    }
  };

  /**
   * Lấy tất cả các khóa trong localStorage
   * 
   * @returns {Array<string>} Danh sách các khóa
   */
  const getKeys = () => {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('Error getting keys from localStorage:', error);
      setError(error);
      return [];
    }
  };

  /**
   * Lấy kích thước hiện tại của localStorage (bytes)
   * 
   * @returns {number} Kích thước tính bằng bytes
   */
  const getSize = () => {
    try {
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        totalSize += (key.length + value.length) * 2; // UTF-16 uses 2 bytes per character
      }
      return totalSize;
    } catch (error) {
      console.error('Error calculating localStorage size:', error);
      setError(error);
      return 0;
    }
  };

  /**
   * Kiểm tra localStorage có khả dụng hay không
   * 
   * @returns {boolean} True nếu localStorage khả dụng
   */
  const isAvailable = () => {
    try {
      const testKey = `_test_${Date.now()}`;
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.error('localStorage is not available:', error);
      setError(error);
      return false;
    }
  };

  return {
    getItem,
    setItem,
    removeItem,
    clear,
    hasItem,
    getKeys,
    getSize,
    isAvailable,
    error
  };
};

export default useLocalStorage;