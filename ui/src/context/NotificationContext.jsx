import React, { createContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import notificationService from '../services/notification.service';
import { NOTIFICATION_TYPES, NOTIFICATION_TIMEOUT } from '../constants/notification.constants';

// Tạo context cho thông báo
export const NotificationContext = createContext();

/**
 * NotificationProvider cung cấp hệ thống quản lý thông báo cho toàn bộ ứng dụng
 * Bao gồm các loại thông báo: success, error, warning, info
 */
export const NotificationProvider = ({ children }) => {
  // State lưu trữ danh sách các thông báo hiện tại
  const [notifications, setNotifications] = useState([]);
  // State cho thông báo hệ thống (từ server)
  const [systemNotifications, setSystemNotifications] = useState([]);
  // State cho số lượng thông báo chưa đọc
  const [unreadCount, setUnreadCount] = useState(0);

  /**
   * Thêm một thông báo mới vào danh sách
   * @param {string} message Nội dung thông báo
   * @param {string} type Loại thông báo (success, error, warning, info)
   * @param {number} timeout Thời gian hiển thị (ms), mặc định theo NOTIFICATION_TIMEOUT
   * @param {boolean} isAutoClose Có tự động đóng không
   */
  const addNotification = useCallback((message, type = NOTIFICATION_TYPES.INFO, timeout = NOTIFICATION_TIMEOUT, isAutoClose = true) => {
    const id = uuidv4();
    
    // Thêm thông báo mới vào danh sách
    setNotifications(prev => [
      ...prev,
      {
        id,
        message,
        type,
        timestamp: new Date(),
        isAutoClose
      }
    ]);

    // Tự động xóa thông báo sau khoảng thời gian timeout nếu isAutoClose = true
    if (isAutoClose) {
      setTimeout(() => {
        removeNotification(id);
      }, timeout);
    }

    return id;
  }, []);

  /**
   * Xóa một thông báo khỏi danh sách dựa vào id
   * @param {string} id ID của thông báo cần xóa
   */
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  /**
   * Helper functions cho các loại thông báo cụ thể
   */
  const showSuccess = useCallback((message, timeout) => {
    return addNotification(message, NOTIFICATION_TYPES.SUCCESS, timeout);
  }, [addNotification]);

  const showError = useCallback((message, timeout) => {
    return addNotification(message, NOTIFICATION_TYPES.ERROR, timeout);
  }, [addNotification]);

  const showWarning = useCallback((message, timeout) => {
    return addNotification(message, NOTIFICATION_TYPES.WARNING, timeout);
  }, [addNotification]);

  const showInfo = useCallback((message, timeout) => {
    return addNotification(message, NOTIFICATION_TYPES.INFO, timeout);
  }, [addNotification]);

  /**
   * Xóa tất cả các thông báo
   */
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  /**
   * Đánh dấu tất cả thông báo hệ thống là đã đọc
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setSystemNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }, []);

  /**
   * Đánh dấu một thông báo là đã đọc
   * @param {string} id ID của thông báo cần đánh dấu
   */
  const markAsRead = useCallback(async (id) => {
    try {
      await notificationService.markAsRead(id);
      setSystemNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, isRead: true } 
            : notification
        )
      );
      
      // Cập nhật số lượng thông báo chưa đọc
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
    }
  }, []);

  /**
   * Lấy thông báo hệ thống từ server
   */
  const fetchSystemNotifications = useCallback(async () => {
    try {
      const { notifications, unreadCount } = await notificationService.getNotifications();
      setSystemNotifications(notifications);
      setUnreadCount(unreadCount);
    } catch (error) {
      console.error('Error fetching system notifications:', error);
    }
  }, []);

  // Lấy thông báo hệ thống khi component được mount
  useEffect(() => {
    fetchSystemNotifications();
    
    // Thiết lập polling để lấy thông báo mới định kỳ (mỗi 30 giây)
    const intervalId = setInterval(() => {
      fetchSystemNotifications();
    }, 30000);
    
    // Cleanup interval khi component unmount
    return () => clearInterval(intervalId);
  }, [fetchSystemNotifications]);

  // Value object chứa tất cả state và functions sẽ được chia sẻ qua context
  const contextValue = {
    // UI Notifications
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAllNotifications,
    
    // System Notifications
    systemNotifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
    fetchSystemNotifications
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;