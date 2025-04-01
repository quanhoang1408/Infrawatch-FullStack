// Toast.jsx
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './Toast.scss';

/**
 * Toast notification component
 * @param {string} id - Toast ID
 * @param {string} type - Toast type (success, error, warning, info)
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 * @param {number} duration - Duration in milliseconds
 * @param {function} onClose - Close handler
 */
const Toast = ({
  id,
  type = 'info',
  title,
  message,
  duration = 4000,
  onClose,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-toast';
  const classes = [
    baseClass,
    `${baseClass}--${type}`,
    className
  ].filter(Boolean).join(' ');
  
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const [mouseOver, setMouseOver] = useState(false);
  
  // Animate toast on mount
  useEffect(() => {
    // Start visibility animation
    setVisible(true);
    
    // Auto-close toast after duration
    let timer;
    let progressTimer;
    
    const closeToast = () => {
      setVisible(false);
      setTimeout(() => {
        onClose?.(id);
      }, 300); // Wait for exit animation
    };
    
    if (duration && duration > 0) {
      // Progress bar animation
      const startTime = Date.now();
      const endTime = startTime + duration;
      
      progressTimer = setInterval(() => {
        const currentTime = Date.now();
        const timeLeft = Math.max(0, endTime - currentTime);
        const calculatedProgress = (timeLeft / duration) * 100;
        
        setProgress(calculatedProgress);
        
        if (timeLeft <= 0) {
          clearInterval(progressTimer);
        }
      }, 16); // ~60fps
      
      // Close toast after duration
      timer = setTimeout(closeToast, duration);
    }
    
    return () => {
      clearTimeout(timer);
      clearInterval(progressTimer);
    };
  }, [duration, id, onClose]);
  
  // Pause progress and timer on mouse over
  useEffect(() => {
    if (mouseOver) {
      // Stop progress animation
      setProgress((prevProgress) => prevProgress);
    }
  }, [mouseOver]);
  
  // Get icon based on toast type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <i className="icon-check-circle" />;
      case 'error':
        return <i className="icon-x-circle" />;
      case 'warning':
        return <i className="icon-alert-triangle" />;
      case 'info':
      default:
        return <i className="icon-info" />;
    }
  };
  
  // Handle toast close
  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      onClose?.(id);
    }, 300); // Wait for exit animation
  };
  
  // Handle mouse events
  const handleMouseEnter = () => {
    setMouseOver(true);
  };
  
  const handleMouseLeave = () => {
    setMouseOver(false);
  };

  return (
    <div 
      className={`${classes} ${visible ? `${baseClass}--visible` : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      <div className={`${baseClass}__content`}>
        <div className={`${baseClass}__icon`}>
          {getIcon()}
        </div>
        
        <div className={`${baseClass}__text`}>
          {title && <div className={`${baseClass}__title`}>{title}</div>}
          {message && <div className={`${baseClass}__message`}>{message}</div>}
        </div>
        
        <button 
          className={`${baseClass}__close`}
          onClick={handleClose}
          aria-label="Close"
        >
          <i className="icon-x" />
        </button>
      </div>
      
      {duration > 0 && (
        <div 
          className={`${baseClass}__progress`} 
          style={{ width: `${progress}%` }}
        />
      )}
    </div>
  );
};

Toast.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  title: PropTypes.string,
  message: PropTypes.string,
  duration: PropTypes.number,
  onClose: PropTypes.func,
  className: PropTypes.string
};

export default Toast;
