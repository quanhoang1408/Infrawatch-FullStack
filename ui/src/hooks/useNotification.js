import { useContext } from 'react';
import { NotificationContext } from '../context';
import { notificationService } from '../services';

/**
 * Hook để quản lý các thông báo trong ứng dụng
 * 
 * @returns {Object} Các phương thức và trạng thái liên quan đến thông báo
 */
export const useNotification = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }

  const { 
    notifications, 
    setNotifications, 
    addNotification, 
    removeNotification, 
    clearAll 
  } = context;

  /**
   * Hiển thị một thông báo mới
   * 
   * @param {Object} notification - Thông tin thông báo
   * @param {string} notification.type - Loại thông báo ('success', 'error', 'warning', 'info')
   * @param {string} notification.message - Tiêu đề thông báo
   * @param {string} notification.description - Mô tả chi tiết
   * @param {number} notification.duration - Thời gian hiển thị (ms), mặc định 3000
   * @param {Function} notification.onClose - Callback khi đóng
   */
  const showNotification = (notification) => {
    const { type, message, description, duration = 3000, onClose } = notification;
    
    const id = Date.now().toString();
    const newNotification = {
      id,
      type,
      message,
      description,
      duration,
      timestamp: new Date(),
      read: false,
      onClose: () => {
        removeNotification(id);
        if (onClose) onClose();
      }
    };
    
    addNotification(newNotification);
    
    // Tự động đóng thông báo sau khoảng thời gian duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    
    return id;
  };

  /**
   * Hiển thị thông báo thành công
   * 
   * @param {string} message - Tiêu đề thông báo
   * @param {string} description - Mô tả chi tiết
   * @param {Object} options - Các tùy chọn bổ sung
   * @returns {string} ID của thông báo
   */
  const showSuccess = (message, description, options = {}) => {
    return showNotification({
      type: 'success',
      message,
      description,
      ...options
    });
  };

  /**
   * Hiển thị thông báo lỗi
   * 
   * @param {string} message - Tiêu đề thông báo
   * @param {string} description - Mô tả chi tiết
   * @param {Object} options - Các tùy chọn bổ sung
   * @returns {string} ID của thông báo
   */
  const showError = (message, description, options = {}) => {
    return showNotification({
      type: 'error',
      message,
      description,
      ...options
    });
  };

  /**
   * Hiển thị thông báo cảnh báo
   * 
   * @param {string} message - Tiêu đề thông báo
   * @param {string} description - Mô tả chi tiết
   * @param {Object} options - Các tùy chọn bổ sung
   * @returns {string} ID của thông báo
   */
  const showWarning = (message, description, options = {}) => {
    return showNotification({
      type: 'warning',
      message,
      description,
      ...options
    });
  };

  /**
   * Hiển thị thông báo thông tin
   * 
   * @param {string} message - Tiêu đề thông báo
   * @param {string} description - Mô tả chi tiết
   * @param {Object} options - Các tùy chọn bổ sung
   * @returns {string} ID của thông báo
   */
  const showInfo = (message, description, options = {}) => {
    return showNotification({
      type: 'info',
      message,
      description,
      ...options
    });
  };

  /**
   * Hiển thị thông báo xác nhận
   * 
   * @param {Object} options - Các tùy chọn của thông báo
   * @param {string} options.title - Tiêu đề thông báo
   * @param {string} options.message - Nội dung thông báo
   * @param {Function} options.onConfirm - Callback khi xác nhận
   * @param {Function} options.onCancel - Callback khi hủy
   * @param {string} options.confirmText - Nội dung nút xác nhận
   * @param {string} options.cancelText - Nội dung nút hủy
   * @returns {string} ID của thông báo
   */
  const showConfirmation = (options) => {
    const {
      title = 'Xác nhận',
      message,
      onConfirm,
      onCancel,
      confirmText = 'Xác nhận',
      cancelText = 'Hủy'
    } = options;
    
    return showNotification({
      type: 'confirm',
      message: title,
      description: message,
      duration: 0, // Không tự đóng
      confirmText,
      cancelText,
      onConfirm,
      onCancel
    });
  };

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   */
  const markAllAsRead = async () => {
    // Cập nhật trạng thái đã đọc cho tất cả thông báo
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      read: true
    }));
    
    setNotifications(updatedNotifications);
    
    // Gửi yêu cầu đến server để đánh dấu đã đọc
    try {
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  /**
   * Đánh dấu một thông báo là đã đọc
   * 
   * @param {string} id - ID của thông báo
   */
  const markAsRead = async (id) => {
    // Cập nhật trạng thái đã đọc cho thông báo cụ thể
    const updatedNotifications = notifications.map(notification => 
      notification.id === id 
        ? { ...notification, read: true } 
        : notification
    );
    
    setNotifications(updatedNotifications);
    
    // Gửi yêu cầu đến server để đánh dấu đã đọc
    try {
      await notificationService.markAsRead(id);
    } catch (error) {
      console.error(`Failed to mark notification ${id} as read:`, error);
    }
  };

  /**
   * Tải các thông báo từ server
   */
  const fetchNotifications = async () => {
    try {
      const fetchedNotifications = await notificationService.getNotifications();
      setNotifications(fetchedNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      showError(
        'Lỗi tải thông báo',
        'Không thể tải thông báo từ server. Vui lòng thử lại sau.'
      );
    }
  };
  
  /**
   * Xóa một thông báo khỏi server
   * 
   * @param {string} id - ID của thông báo cần xóa
   */
  const deleteNotification = async (id) => {
    try {
      // Xóa khỏi state ngay lập tức để giao diện phản hồi nhanh
      removeNotification(id);
      
      // Gửi yêu cầu xóa đến server
      await notificationService.deleteNotification(id);
    } catch (error) {
      console.error(`Failed to delete notification ${id}:`, error);
      // Tải lại thông báo nếu xóa thất bại
      fetchNotifications();
      
      showError(
        'Lỗi xóa thông báo',
        'Không thể xóa thông báo. Vui lòng thử lại sau.'
      );
    }
  };

  /**
   * Đếm số thông báo chưa đọc
   * 
   * @returns {number} Số thông báo chưa đọc
   */
  const getUnreadCount = () => {
    return notifications.filter(notification => !notification.read).length;
  };

  return {
    notifications,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirmation,
    removeNotification,
    clearAll,
    markAllAsRead,
    markAsRead,
    fetchNotifications,
    deleteNotification,
    getUnreadCount
  };
};

export default useNotification;