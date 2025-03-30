import { createContext, useState, useEffect } from 'react';
import { notification } from 'antd';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initial fetch of notifications
  useEffect(() => {
    // In a real app, we would fetch notifications from an API
    const mockNotifications = [
      {
        id: 1,
        title: 'Hệ thống đã cập nhật',
        message: 'Infrawatch đã được cập nhật lên phiên bản mới nhất.',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        read: false,
        type: 'info'
      },
      {
        id: 2,
        title: 'Máy ảo web-server-01 sắp hết tài nguyên',
        message: 'CPU usage: 85%. Xem xét việc nâng cấp.',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        read: false,
        type: 'warning'
      }
    ];
    
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  }, []);

  // Show notification
  const showNotification = (type, title, message) => {
    notification[type]({
      message: title,
      description: message,
      placement: 'topRight',
    });

    // Add to notifications list
    const newNotification = {
      id: Date.now(),
      title,
      message,
      timestamp: new Date(),
      read: false,
      type
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
    
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    
    setUnreadCount(0);
  };

  // Delete notification
  const deleteNotification = (id) => {
    const notification = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const value = {
    notifications,
    unreadCount,
    showNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};