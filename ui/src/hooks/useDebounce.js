import { useState, useEffect } from 'react';

/**
 * Hook để debounce giá trị, trả về giá trị sau một khoảng thời gian không thay đổi
 * 
 * @param {*} value - Giá trị cần debounce
 * @param {number} delay - Thời gian delay tính bằng milliseconds (mặc định 500ms)
 * @returns {*} Giá trị đã được debounce
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Tạo timeout để cập nhật giá trị debounce sau delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Hủy timeout nếu giá trị thay đổi hoặc component unmount
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook để cung cấp hàm callback đã được debounce
 * 
 * @param {Function} callback - Hàm callback cần debounce
 * @param {number} delay - Thời gian delay tính bằng milliseconds (mặc định 500ms)
 * @returns {Function} Hàm đã được debounce
 */
export const useDebouncedCallback = (callback, delay = 500) => {
  const [timeoutId, setTimeoutId] = useState(null);

  // Xóa timeout hiện tại
  const clearDebounceTimeout = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };

  // Hủy debounce khi component unmount
  useEffect(() => {
    return clearDebounceTimeout;
  }, []);

  // Trả về hàm đã debounce
  return (...args) => {
    clearDebounceTimeout();
    
    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
    
    setTimeoutId(newTimeoutId);
  };
};

/**
 * Hook để cung cấp hàm debounce với trạng thái loading
 * 
 * @param {Function} callback - Hàm callback cần debounce
 * @param {number} delay - Thời gian delay tính bằng milliseconds (mặc định 500ms)
 * @returns {Array} Mảng gồm [debouncedCallback, isWaiting]
 */
export const useDebouncedCallbackWithLoading = (callback, delay = 500) => {
  const [isWaiting, setIsWaiting] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  // Xóa timeout hiện tại
  const clearDebounceTimeout = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setIsWaiting(false);
    }
  };

  // Hủy debounce khi component unmount
  useEffect(() => {
    return clearDebounceTimeout;
  }, []);

  // Trả về hàm đã debounce và trạng thái đang chờ
  const debouncedCallback = (...args) => {
    clearDebounceTimeout();
    setIsWaiting(true);
    
    const newTimeoutId = setTimeout(() => {
      callback(...args);
      setIsWaiting(false);
    }, delay);
    
    setTimeoutId(newTimeoutId);
  };

  return [debouncedCallback, isWaiting];
};

export default useDebounce;