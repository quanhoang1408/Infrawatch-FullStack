// VMStatusBadge.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { StatusBadge } from '../common';

/**
 * Component to display VM status with appropriate styling
 * @param {string} status - VM status
 */
const VMStatusBadge = ({
  status,
  className = '',
  ...rest
}) => {
  // Map VM status to badge type
  const getBadgeType = (status) => {
    const statusMap = {
      'running': 'success',
      'stopped': 'default',
      'creating': 'warning',
      'starting': 'warning',
      'stopping': 'warning',
      'restarting': 'warning',
      'terminating': 'error',
      'terminated': 'error',
      'error': 'error'
    };
    
    return statusMap[status] || 'default';
  };
  
  // Format status text for display
  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    
    // Capitalize first letter of status
    return status.charAt(0).toUpperCase() + status.slice(1);
  };
  
  return (
    <StatusBadge
      status={formatStatus(status)}
      type={getBadgeType(status)}
      className={className}
      {...rest}
    />
  );
};

VMStatusBadge.propTypes = {
  status: PropTypes.string,
  className: PropTypes.string
};

export default VMStatusBadge;