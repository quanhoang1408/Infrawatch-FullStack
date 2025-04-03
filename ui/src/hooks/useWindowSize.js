import { useState, useEffect } from 'react';

/**
 * Hook để theo dõi kích thước cửa sổ
 * 
 * @param {Object} options - Các tùy chọn cho hook
 * @param {number} options.debounceTime - Thời gian debounce (ms) để giảm thiểu số lần cập nhật
 * @param {Object} options.initialSize - Kích thước ban đầu (mặc định là { width: undefined, height: undefined })
 * @returns {Object} Object chứa { width, height } của cửa sổ
 */
export const useWindowSize = (options = {}) => {
  const {
    debounceTime = 250,
    initialSize = { width: undefined, height: undefined }
  } = options;

  const [windowSize, setWindowSize] = useState(initialSize);
  const [timeoutId, setTimeoutId] = useState(null);

  useEffect(() => {
    // Hàm lấy kích thước hiện tại
    const getSize = () => ({
      width: window.innerWidth,
      height: window.innerHeight
    });

    // Handler được debounce để tránh cập nhật quá nhiều lần
    const handleResize = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const id = setTimeout(() => {
        setWindowSize(getSize());
      }, debounceTime);

      setTimeoutId(id);
    };

    // Cập nhật kích thước ban đầu
    setWindowSize(getSize());

    // Thêm event listener để theo dõi thay đổi kích thước
    window.addEventListener('resize', handleResize);

    // Cleanup event listener khi component unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [debounceTime, timeoutId]);

  return windowSize;
};

/**
 * Hook để lấy kích thước của viewport (phần hiển thị của trang)
 * 
 * @returns {Object} Object chứa kích thước viewport (width, height) và các breakpoint
 */
export const useViewport = () => {
  const windowSize = useWindowSize();

  // Xác định các breakpoint phổ biến
  const isXS = windowSize.width < 576;
  const isSM = windowSize.width >= 576 && windowSize.width < 768;
  const isMD = windowSize.width >= 768 && windowSize.width < 992;
  const isLG = windowSize.width >= 992 && windowSize.width < 1200;
  const isXL = windowSize.width >= 1200 && windowSize.width < 1600;
  const isXXL = windowSize.width >= 1600;

  // Nhóm các breakpoint cao hơn
  const isSMPlus = windowSize.width >= 576;
  const isMDPlus = windowSize.width >= 768;
  const isLGPlus = windowSize.width >= 992;
  const isXLPlus = windowSize.width >= 1200;

  // Device groups
  const isMobile = windowSize.width < 768;
  const isTablet = windowSize.width >= 768 && windowSize.width < 992;
  const isDesktop = windowSize.width >= 992;

  return {
    width: windowSize.width,
    height: windowSize.height,
    isXS,
    isSM,
    isMD,
    isLG,
    isXL,
    isXXL,
    isSMPlus,
    isMDPlus,
    isLGPlus,
    isXLPlus,
    isMobile,
    isTablet,
    isDesktop
  };
};

/**
 * Hook để theo dõi chiều cao của trang và viewport
 * 
 * @returns {Object} Object chứa chiều cao của document, viewport, và scroll
 */
export const useScrollHeight = () => {
  const [scrollData, setScrollData] = useState({
    documentHeight: 0,
    viewportHeight: 0,
    scrollTop: 0,
    scrollPercent: 0
  });

  useEffect(() => {
    const updateScrollData = () => {
      const documentHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.body.clientHeight,
        document.documentElement.clientHeight
      );

      const viewportHeight = window.innerHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollPercent = Math.round((scrollTop / (documentHeight - viewportHeight)) * 100);

      setScrollData({
        documentHeight,
        viewportHeight,
        scrollTop,
        scrollPercent: isNaN(scrollPercent) ? 0 : scrollPercent
      });
    };

    // Cập nhật ban đầu
    updateScrollData();

    // Thêm sự kiện scroll và resize
    window.addEventListener('scroll', updateScrollData);
    window.addEventListener('resize', updateScrollData);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', updateScrollData);
      window.removeEventListener('resize', updateScrollData);
    };
  }, []);

  return scrollData;
};

export default useWindowSize;