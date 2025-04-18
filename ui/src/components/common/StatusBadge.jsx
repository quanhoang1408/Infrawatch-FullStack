// StatusBadge.jsx
import React from 'react';
import PropTypes from 'prop-types';
// import '../styles/components/StatusBadge.scss';

/**
 * Status badge for displaying statuses
 * @param {string} status - Status value
 * @param {string} type - Badge type (custom styling)
 * @param {string} className - Additional class names
 */
const StatusBadge = ({
  status,
  type,
  className = '',
  ...rest
}) => {
  // Use type if provided, otherwise derive from status
  const badgeType = type || getBadgeTypeFromStatus(status);

  const baseClass = 'iw-status-badge';
  const classes = [
    baseClass,
    `${baseClass}--${badgeType}`,
    className
  ].filter(Boolean).join(' ');

  // Define status colors
  const statusColors = {
    success: {
      background: 'rgba(76, 175, 80, 0.1)',
      color: '#4CAF50',
      border: '1px solid rgba(76, 175, 80, 0.2)'
    },
    warning: {
      background: 'rgba(255, 152, 0, 0.1)',
      color: '#FF9800',
      border: '1px solid rgba(255, 152, 0, 0.2)'
    },
    error: {
      background: 'rgba(244, 67, 54, 0.1)',
      color: '#F44336',
      border: '1px solid rgba(244, 67, 54, 0.2)'
    },
    info: {
      background: 'rgba(33, 150, 243, 0.1)',
      color: '#2196F3',
      border: '1px solid rgba(33, 150, 243, 0.2)'
    },
    default: {
      background: 'rgba(117, 117, 117, 0.1)',
      color: '#757575',
      border: '1px solid rgba(117, 117, 117, 0.2)'
    }
  };

  // Get the appropriate color scheme
  const colorScheme = statusColors[badgeType] || statusColors.default;

  // Define the style
  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.25rem 0.75rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    ...colorScheme
  };

  const dotStyle = {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    marginRight: '0.5rem',
    backgroundColor: colorScheme.color
  };

  return (
    <span className={classes} style={style} {...rest}>
      <span style={dotStyle}></span>
      <span>{status}</span>
    </span>
  );
};

// Map status to badge type if not explicitly provided
const getBadgeTypeFromStatus = (status) => {
  const statusLower = status?.toLowerCase() || '';

  if (['running', 'active', 'online', 'healthy', 'on', 'succeeded', 'success'].includes(statusLower)) {
    return 'success';
  }

  if (['stopped', 'stopping', 'inactive', 'offline', 'off', 'disconnected'].includes(statusLower)) {
    return 'default';
  }

  if (['pending', 'creating', 'provisioning', 'initializing'].includes(statusLower)) {
    return 'warning';
  }

  if (['error', 'failed', 'terminated', 'critical', 'unhealthy'].includes(statusLower)) {
    return 'error';
  }

  return 'default';
};

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info', 'default']),
  className: PropTypes.string
};

export default StatusBadge;