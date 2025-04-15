import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from '../components/feedback/ToastContainer';

// Create context
const NotificationContext = createContext();

// Custom hook to use notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Provider component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Add a new notification
  const addNotification = useCallback((notification) => {
    const id = Date.now().toString();
    const newNotification = {
      id,
      ...notification,
      timestamp: new Date(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Also show as toast if specified
    if (notification.showToast !== false) {
      const type = notification.type || 'info';
      toast[type](notification.message, notification.duration);
    }
    
    return id;
  }, []);

  // Show success notification
  const showSuccess = useCallback((message, options = {}) => {
    return addNotification({
      message,
      type: 'success',
      ...options
    });
  }, [addNotification]);

  // Show error notification
  const showError = useCallback((message, options = {}) => {
    return addNotification({
      message,
      type: 'error',
      ...options
    });
  }, [addNotification]);

  // Show info notification
  const showInfo = useCallback((message, options = {}) => {
    return addNotification({
      message,
      type: 'info',
      ...options
    });
  }, [addNotification]);

  // Show warning notification
  const showWarning = useCallback((message, options = {}) => {
    return addNotification({
      message,
      type: 'warning',
      ...options
    });
  }, [addNotification]);

  // Mark notification as read
  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  // Remove a notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== id)
    );
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Get unread notifications count
  const unreadCount = notifications.filter(notification => !notification.read).length;

  const value = {
    notifications,
    unreadCount,
    addNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;