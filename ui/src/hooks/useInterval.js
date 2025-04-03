import { useEffect, useRef } from 'react';

/**
 * Hook để thiết lập setInterval với cleanup tự động
 * 
 * @param {Function} callback - Hàm callback được gọi sau mỗi interval
 * @param {number} delay - Thời gian delay (ms), null để dừng interval
 * @param {boolean} immediate - Có chạy callback ngay lập tức không (mặc định false)
 */
export const useInterval = (callback, delay, immediate = false) => {
  const savedCallback = useRef();

  // Lưu callback mới nhất
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Chạy callback ngay lập tức nếu immediate = true
  useEffect(() => {
    if (immediate && delay !== null && savedCallback.current) {
      savedCallback.current();
    }
  }, [immediate, delay]);

  // Thiết lập interval
  useEffect(() => {
    // Không thiết lập interval nếu delay là null
    if (delay === null) return;

    const id = setInterval(() => {
      savedCallback.current();
    }, delay);

    // Cleanup interval khi unmount hoặc delay thay đổi
    return () => clearInterval(id);
  }, [delay]);
};

/**
 * Hook để thiết lập setInterval có thể tạm dừng và tiếp tục
 * 
 * @param {Function} callback - Hàm callback được gọi sau mỗi interval
 * @param {number} delay - Thời gian delay (ms)
 * @returns {Object} Object với các phương thức pause, resume, và reset
 */
export const useControllableInterval = (callback, delay) => {
  const savedCallback = useRef();
  const intervalId = useRef(null);
  const paused = useRef(false);
  const timeLeft = useRef(delay);
  const lastRun = useRef(Date.now());

  // Lưu callback mới nhất
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Hàm bắt đầu interval
  const startInterval = () => {
    lastRun.current = Date.now();
    intervalId.current = setInterval(() => {
      savedCallback.current();
    }, timeLeft.current);
  };

  // Hàm tạm dừng interval
  const pause = () => {
    if (intervalId.current && !paused.current) {
      clearInterval(intervalId.current);
      timeLeft.current = delay - (Date.now() - lastRun.current);
      paused.current = true;
    }
  };

  // Hàm tiếp tục interval
  const resume = () => {
    if (paused.current) {
      startInterval();
      paused.current = false;
    }
  };

  // Hàm reset interval
  const reset = () => {
    if (intervalId.current) {
      clearInterval(intervalId.current);
    }
    timeLeft.current = delay;
    paused.current = false;
    startInterval();
  };

  // Khởi tạo interval khi component mount và cleanup khi unmount
  useEffect(() => {
    startInterval();

    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  }, [delay]);

  return { pause, resume, reset };
};

/**
 * Hook để thiết lập một polling interval (gọi API định kỳ)
 * 
 * @param {Function} pollingFunction - Hàm async được gọi sau mỗi interval
 * @param {number} delay - Thời gian delay (ms)
 * @param {Object} options - Các tùy chọn như immediate, errorHandler, retryOnError, maxRetries
 * @returns {Object} Object với các phương thức pause, resume, reset và trạng thái
 */
export const usePolling = (pollingFunction, delay, options = {}) => {
  const {
    immediate = true,
    errorHandler = null,
    retryOnError = true,
    maxRetries = 3,
    onSuccess = null,
    onMaxRetriesReached = null
  } = options;

  const savedFunction = useRef();
  const intervalId = useRef(null);
  const paused = useRef(!immediate);
  const retryCount = useRef(0);
  const lastPollTime = useRef(null);
  const isPolling = useRef(false);
  const mountedRef = useRef(true);

  // Lưu function mới nhất
  useEffect(() => {
    savedFunction.current = pollingFunction;
    return () => {
      mountedRef.current = false;
    };
  }, [pollingFunction]);

  // Hàm thực hiện poll
  const executePoll = async () => {
    if (paused.current || isPolling.current) return;

    isPolling.current = true;
    lastPollTime.current = Date.now();

    try {
      const result = await savedFunction.current();
      retryCount.current = 0;
      
      if (onSuccess && mountedRef.current) {
        onSuccess(result);
      }
    } catch (error) {
      if (errorHandler && mountedRef.current) {
        errorHandler(error);
      }

      if (retryOnError) {
        retryCount.current += 1;
        
        if (retryCount.current >= maxRetries) {
          if (onMaxRetriesReached && mountedRef.current) {
            onMaxRetriesReached();
          }
          retryCount.current = 0;
        }
      }
    } finally {
      isPolling.current = false;
    }
  };

  // Hàm tạm dừng polling
  const pause = () => {
    paused.current = true;
    if (intervalId.current) {
      clearInterval(intervalId.current);
      intervalId.current = null;
    }
  };

  // Hàm tiếp tục polling
  const resume = () => {
    paused.current = false;
    if (!intervalId.current) {
      startPolling();
    }
  };

  // Hàm thiết lập interval polling
  const startPolling = () => {
    executePoll(); // Chạy ngay lần đầu nếu immediate = true
    intervalId.current = setInterval(executePoll, delay);
  };

  // Hàm reset polling
  const reset = () => {
    pause();
    retryCount.current = 0;
    resume();
  };

  // Chạy và cleanup polling
  useEffect(() => {
    if (!paused.current) {
      startPolling();
    }

    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  }, [delay]);

  return {
    pause,
    resume,
    reset,
    isPaused: () => paused.current,
    isPolling: () => isPolling.current,
    getRetryCount: () => retryCount.current,
    getLastPollTime: () => lastPollTime.current
  };
};

export default useInterval;