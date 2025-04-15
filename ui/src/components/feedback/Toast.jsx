import React, { useState, useEffect } from 'react';
import './Toast.scss';

const Toast = ({ type = 'info', message, duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div className={`toast toast--${type} ${visible ? 'toast--visible' : ''}`}>
      <div className="toast__content">
        <span className="toast__message">{message}</span>
      </div>
      <button className="toast__close" onClick={handleClose}>
        ×
      </button>
    </div>
  );
};

export default Toast;