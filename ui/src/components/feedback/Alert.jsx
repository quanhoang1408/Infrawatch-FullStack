// Alert.jsx
import React from 'react';
import PropTypes from 'prop-types';
import './Alert.scss';

/**
 * Alert message component
 * @param {string} type - Alert type (success, error, warning, info)
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @param {boolean} closable - Whether the alert can be closed
 * @param {function} onClose - Close handler
 * @param {boolean} showIcon - Whether to show the alert icon
 * @param {node} action - Custom action button or component
 */
const Alert = ({
  type = 'info',
  title,
  message,
  closable = false,
  onClose,
  showIcon = true,
  action,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-alert';
  const classes = [
    baseClass,
    `${baseClass}--${type}`,
    className
  ].filter(Boolean).join(' ');
  
  // Get icon based on alert type
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

  return (
    <div className={classes} role="alert" {...rest}>
      {showIcon && (
        <div className={`${baseClass}__icon`}>
          {getIcon()}
        </div>
      )}
      
      <div className={`${baseClass}__content`}>
        {title && <div className={`${baseClass}__title`}>{title}</div>}
        {message && <div className={`${baseClass}__message`}>{message}</div>}
      </div>
      
      {action && (
        <div className={`${baseClass}__action`}>
          {action}
        </div>
      )}
      
      {closable && (
        <button
          className={`${baseClass}__close`}
          onClick={onClose}
          aria-label="Close"
        >
          <i className="icon-x" />
        </button>
      )}
    </div>
  );
};

Alert.propTypes = {
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  title: PropTypes.string,
  message: PropTypes.node,
  closable: PropTypes.bool,
  onClose: PropTypes.func,
  showIcon: PropTypes.bool,
  action: PropTypes.node,
  className: PropTypes.string
};

export default Alert;