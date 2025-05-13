import React, { useState, useEffect } from 'react';
import Toast from './Toast';
import './ToastContainer.scss';

// Unique ID generator for toasts
const generateId = () => `toast_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

// Create a global toast event system
export const toast = {
  // Toast type constants
  TYPE: {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error'
  },

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
  },

  // Add update method to handle toast updates
  update: (toastId, options) => {
    const event = new CustomEvent('toast-update', {
      detail: {
        id: toastId,
        ...options
      }
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

    const handleToastUpdate = (event) => {
      const { id, render, type, autoClose } = event.detail;

      setToasts((currentToasts) =>
        currentToasts.map((toast) =>
          toast.id === id
            ? {
                ...toast,
                message: render || toast.message,
                type: type || toast.type,
                duration: autoClose !== undefined ? autoClose : toast.duration
              }
            : toast
        )
      );
    };

    window.addEventListener('toast', handleToast);
    window.addEventListener('toast-update', handleToastUpdate);

    return () => {
      window.removeEventListener('toast', handleToast);
      window.removeEventListener('toast-update', handleToastUpdate);
    };
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