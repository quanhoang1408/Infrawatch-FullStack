// StatusBadge.jsx
import React from 'react';
import PropTypes from 'prop-types';
import '../styles/components/StatusBadge.scss';

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

  return (
    <span className={classes} {...rest}>
      <span className={`${baseClass}__dot`}></span>
      <span className={`${baseClass}__text`}>{status}</span>
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