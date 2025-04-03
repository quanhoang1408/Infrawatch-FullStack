import { useState, useEffect } from 'react';

/**
 * Hook để kiểm tra trạng thái của media query
 * 
 * @param {string} query - CSS media query cần kiểm tra
 * @returns {boolean} True nếu media query khớp
 */
export const useMediaQuery = (query) => {
  // Tránh lỗi khi server-side rendering
  const getMatches = (query) => {
    // Kiểm tra xem window có sẵn không (tránh lỗi trên SSR)
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState(getMatches(query));

  // Callback xử lý sự thay đổi của media query
  const handleChange = () => {
    setMatches(getMatches(query));
  };

  useEffect(() => {
    const matchMedia = window.matchMedia(query);

    // Khởi tạo trạng thái
    handleChange();

    // Theo dõi các thay đổi
    if (matchMedia.addEventListener) {
      matchMedia.addEventListener('change', handleChange);
    } else {
      // Fallback cho trình duyệt cũ
      matchMedia.addListener(handleChange);
    }

    return () => {
      // Hủy theo dõi khi component unmount
      if (matchMedia.removeEventListener) {
        matchMedia.removeEventListener('change', handleChange);
      } else {
        // Fallback cho trình duyệt cũ
        matchMedia.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
};

/**
 * Hook để kiểm tra kích thước màn hình có phải mobile không
 * 
 * @param {number} maxWidth - Chiều rộng tối đa để xem là mobile (mặc định 768px)
 * @returns {boolean} True nếu màn hình là mobile
 */
export const useIsMobile = (maxWidth = 768) => {
  return useMediaQuery(`(max-width: ${maxWidth}px)`);
};

/**
 * Hook để kiểm tra kích thước màn hình có phải tablet không
 * 
 * @param {number} minWidth - Chiều rộng tối thiểu (mặc định 769px) 
 * @param {number} maxWidth - Chiều rộng tối đa (mặc định 1024px)
 * @returns {boolean} True nếu màn hình là tablet
 */
export const useIsTablet = (minWidth = 769, maxWidth = 1024) => {
  return useMediaQuery(`(min-width: ${minWidth}px) and (max-width: ${maxWidth}px)`);
};

/**
 * Hook để kiểm tra kích thước màn hình có phải desktop không
 * 
 * @param {number} minWidth - Chiều rộng tối thiểu để xem là desktop (mặc định 1025px)
 * @returns {boolean} True nếu màn hình là desktop
 */
export const useIsDesktop = (minWidth = 1025) => {
  return useMediaQuery(`(min-width: ${minWidth}px)`);
};

/**
 * Hook để kiểm tra chế độ dark mode của hệ thống
 * 
 * @returns {boolean} True nếu hệ thống đang sử dụng dark mode
 */
export const useIsDarkMode = () => {
  return useMediaQuery('(prefers-color-scheme: dark)');
};

/**
 * Hook để kiểm tra chế độ tiết kiệm pin của hệ thống
 * 
 * @returns {boolean} True nếu hệ thống đang ở chế độ tiết kiệm pin
 */
export const useIsSavingPower = () => {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
};

/**
 * Hook để kiểm tra thiết bị có hỗ trợ hover không
 * 
 * @returns {boolean} True nếu thiết bị hỗ trợ hover
 */
export const useHasHoverSupport = () => {
  return useMediaQuery('(hover: hover)');
};

export default useMediaQuery;