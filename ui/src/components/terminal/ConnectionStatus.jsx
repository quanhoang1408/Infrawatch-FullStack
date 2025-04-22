// ConnectionStatus.jsx
import React from 'react';
import PropTypes from 'prop-types';
import './ConnectionStatus.scss';

/**
 * Component to display terminal connection status
 * @param {boolean} connected - Connection status
 * @param {boolean} connecting - Connecting status
 */
const ConnectionStatus = ({
  connected,
  connecting,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-connection-status';
  const classes = [baseClass, className].filter(Boolean).join(' ');

  // Get status text and class
  const getStatusInfo = () => {
    if (connecting) {
      return {
        text: 'Connecting...',
        statusClass: `${baseClass}__indicator--connecting`
      };
    }

    if (connected) {
      return {
        text: 'Connected',
        statusClass: `${baseClass}__indicator--connected`
      };
    }

    return {
      text: 'Disconnected',
      statusClass: `${baseClass}__indicator--disconnected`
    };
  };

  const { text, statusClass } = getStatusInfo();

  return (
    <div className={classes} {...rest}>
      <div className={`${baseClass}__indicator ${statusClass}`} />
      <div className={`${baseClass}__text`}>{text}</div>
    </div>
  );
};

ConnectionStatus.propTypes = {
  connected: PropTypes.bool,
  connecting: PropTypes.bool,
  className: PropTypes.string
};

export default ConnectionStatus;