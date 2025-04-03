// Export các hook từ thư mục hooks

// Các hook xác thực và tài khoản
export { useAuth } from './useAuth';

// Các hook thông báo và UI
export { useNotification } from './useNotification';
export { useTheme } from './useTheme';
export { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop, useIsDarkMode } from './useMediaQuery';
export { useWindowSize, useViewport, useScrollHeight } from './useWindowSize';

// Các hook máy ảo và hệ thống
export { useVM } from './useVM';
export { useVMActions } from './useVMActions';
export { useTerminal } from './useTerminal';
export { useCertificate } from './useCertificate';

// Các hook tiện ích
export { useLocalStorage } from './useLocalStorage';
export { useDebounce, useDebouncedCallback, useDebouncedCallbackWithLoading } from './useDebounce';
export { useOnClickOutside, useOnClickOutsideMultiple } from './useOnClickOutside';
export { usePrevious, usePreviousValues, useValueChange } from './usePrevious';
export { useInterval, useControllableInterval, usePolling } from './useInterval';

// Export mặc định là tất cả các hook
export default {
  useAuth,
  useNotification,
  useTheme,
  useVM,
  useVMActions,
  useTerminal,
  useCertificate,
  useLocalStorage,
  useMediaQuery,
  useDebounce,
  useOnClickOutside,
  usePrevious,
  useInterval,
  useWindowSize,
};