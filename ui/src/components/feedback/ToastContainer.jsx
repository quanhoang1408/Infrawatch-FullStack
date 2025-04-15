import React, { useState, useEffect } from 'react';
import Toast from './Toast';
import './ToastContainer.scss';

// Unique ID generator for toasts
const generateId = () => `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Create a global toast event system
export const toast = {
  info: (message, duration) => {
    const event = new CustomEvent('toast', {
      detail: { type: 'info', message, duration, id: generateId() }
    });
    window.dispatchEvent(event);
  },
  success: (message, duration) => {
    const event = new CustomEvent('toast', {
      detail: { type: 'success', message, duration, id: generateId() }
    });
    window.dispatchEvent(event);
  },
  warning: (message, duration) => {
    const event = new CustomEvent('toast', {
      detail: { type: 'warning', message, duration, id: generateId() }
    });
    window.dispatchEvent(event);
  },
  error: (message, duration) => {
    const event = new CustomEvent('toast', {
      detail: { type: 'error', message, duration, id: generateId() }
    });
    window.dispatchEvent(event);
  }
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (event) => {
      const newToast = event.detail;
      setToasts((currentToasts) => [...currentToasts, newToast]);
    };

    window.addEventListener('toast', handleToast);
    return () => window.removeEventListener('toast', handleToast);
  }, []);

  const removeToast = (id) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default ToastContainer;