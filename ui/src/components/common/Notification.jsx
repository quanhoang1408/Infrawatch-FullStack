// Notification.jsx
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import '../../styles/components/Notification.scss';

/**
 * Notification component for displaying temporary messages
 * @param {string} type - Type of notification (info, success, warning, error)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {number} duration - Duration in milliseconds
 * @param {function} onClose - Called when notification is closed
 * @param {string} className - Additional class names
 */
const Notification = ({
  type = 'info',
  title,
  message,
  duration = 4500,
  onClose,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-notification';
  const classes = [
    baseClass,
    `${baseClass}--${type}`,
    className
  ].filter(Boolean).join(' ');

  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const renderIcon = () => {
    const iconClass = `${baseClass}__icon ${baseClass}__icon--${type}`;

    return <div className={iconClass}></div>;
  };

  return (
    <div className={classes} {...rest}>
      {renderIcon()}
      <div className={`${baseClass}__content`}>
        {title && <div className={`${baseClass}__title`}>{title}</div>}
        {message && <div className={`${baseClass}__message`}>{message}</div>}
      </div>
      <button className={`${baseClass}__close`} onClick={onClose} aria-label="Close">
        <span>&times;</span>
      </button>
    </div>
  );
};

Notification.propTypes = {
  type: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
  title: PropTypes.string,
  message: PropTypes.string,
  duration: PropTypes.number,
  onClose: PropTypes.func,
  className: PropTypes.string
};

export default Notification;