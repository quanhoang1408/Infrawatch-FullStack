import { useEffect, useRef } from 'react';

/**
 * Hook để phát hiện click bên ngoài một element
 * 
 * @param {Function} handler - Hàm xử lý khi click bên ngoài element
 * @param {boolean} active - Có kích hoạt hook hay không (mặc định là true)
 * @returns {React.RefObject} Ref cần gán vào element cần theo dõi
 */
export const useOnClickOutside = (handler, active = true) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!active) return;

    const listener = (event) => {
      // Không làm gì nếu click trên element hoặc element con
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }

      handler(event);
    };

    // Theo dõi cả sự kiện mousedown và touchstart
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      // Hủy theo dõi khi component unmount hoặc deps thay đổi
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, active]);

  return ref;
};

/**
 * Hook để phát hiện click bên ngoài nhiều element
 * 
 * @param {Function} handler - Hàm xử lý khi click bên ngoài tất cả các element
 * @param {boolean} active - Có kích hoạt hook hay không (mặc định là true)
 * @returns {Function} Hàm để lấy refs cho mỗi element cần theo dõi
 */
export const useOnClickOutsideMultiple = (handler, active = true) => {
  const refs = useRef([]);

  const getRef = (index) => {
    if (!refs.current[index]) {
      refs.current[index] = { current: null };
    }
    return refs.current[index];
  };

  useEffect(() => {
    if (!active) return;

    const listener = (event) => {
      // Kiểm tra xem click có nằm trong bất kỳ element nào không
      const isInside = refs.current.some(
        ref => ref.current && ref.current.contains(event.target)
      );

      if (!isInside) {
        handler(event);
      }
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler, active]);

  return getRef;
};

export default useOnClickOutside;