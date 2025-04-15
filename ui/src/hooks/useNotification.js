import { useContext } from 'react';
import NotificationContext from '../context/NotificationContext';

/**
 * Custom hook to use the notification context
 * @returns {Object} Notification context methods and state
 */
const useNotification = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  
  return context;
};

export default useNotification;