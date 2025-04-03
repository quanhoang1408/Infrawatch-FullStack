import { useEffect, useRef } from 'react';

/**
 * Hook để lưu giá trị trước đó của một biến
 * 
 * @param {*} value - Giá trị hiện tại
 * @returns {*} Giá trị trước đó
 */
export const usePrevious = (value) => {
  const ref = useRef();

  useEffect(() => {
    // Cập nhật ref.current sau mỗi lần render
    ref.current = value;
  }, [value]);

  // Trả về giá trị trước đó (từ lần render trước)
  return ref.current;
};

/**
 * Hook để lưu nhiều giá trị trước đó
 * 
 * @param {Object} values - Object chứa các giá trị cần lưu
 * @returns {Object} Object chứa các giá trị trước đó
 */
export const usePreviousValues = (values) => {
  const ref = useRef({});

  useEffect(() => {
    // Cập nhật ref.current sau mỗi lần render
    Object.keys(values).forEach((key) => {
      ref.current[key] = values[key];
    });
  }, [values]);

  // Trả về object chứa các giá trị trước đó
  return ref.current;
};

/**
 * Hook để theo dõi sự thay đổi của một giá trị
 * 
 * @param {*} value - Giá trị cần theo dõi
 * @returns {Object} Object chứa giá trị hiện tại, giá trị trước đó, và có thay đổi không
 */
export const useValueChange = (value) => {
  const previousValue = usePrevious(value);
  const hasChanged = previousValue !== value;

  return {
    current: value,
    previous: previousValue,
    hasChanged
  };
};

export default usePrevious;