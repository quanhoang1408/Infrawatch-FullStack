// NotificationPanel.jsx
import React from 'react';
import PropTypes from 'prop-types';
import './NotificationPanel.scss';
import Button from './Button';

/**
 * Panel that displays system notifications
 * @param {array} notifications - Array of notification objects
 * @param {boolean} visible - Controls panel visibility
 * @param {function} onClose - Called when panel is closed
 * @param {function} onClearAll - Called when clear all button is clicked
 * @param {string} className - Additional class names
 */
const NotificationPanel = ({
  notifications = [],
  visible = false,
  onClose,
  onClearAll,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-notification-panel';
  const classes = [
    baseClass,
    visible ? `${baseClass}--visible` : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...rest}>
      <div className={`${baseClass}__header`}>
        <div className={`${baseClass}__title`}>Notifications</div>
        <div className={`${baseClass}__actions`}>
          {notifications.length > 0 && (
            <Button
              variant="text"
              size="sm"
              onClick={onClearAll}
            >
              Clear All
            </Button>
          )}
          <button className={`${baseClass}__close`} onClick={onClose} aria-label="Close">
            <span>&times;</span>
          </button>
        </div>
      </div>
      <div className={`${baseClass}__content`}>
        {notifications.length === 0 ? (
          <div className={`${baseClass}__empty`}>
            <div className={`${baseClass}__empty-icon`}></div>
            <div className={`${baseClass}__empty-text`}>No notifications</div>
          </div>
        ) : (
          <div className={`${baseClass}__list`}>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`${baseClass}__item ${baseClass}__item--${notification.type}`}
              >
                <div className={`${baseClass}__item-icon`}></div>
                <div className={`${baseClass}__item-content`}>
                  <div className={`${baseClass}__item-title`}>{notification.title}</div>
                  <div className={`${baseClass}__item-message`}>{notification.message}</div>
                  <div className={`${baseClass}__item-time`}>{notification.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

NotificationPanel.propTypes = {
  notifications: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      type: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
      title: PropTypes.string,
      message: PropTypes.string,
      time: PropTypes.string
    })
  ),
  visible: PropTypes.bool,
  onClose: PropTypes.func,
  onClearAll: PropTypes.func,
  className: PropTypes.string
};

export default NotificationPanel;