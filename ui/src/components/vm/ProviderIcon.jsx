// ProviderIcon.jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Icon component for cloud providers
 * @param {string} provider - Provider identifier
 * @param {string} size - Icon size
 */
const ProviderIcon = ({
  provider,
  size = 'md',
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-provider-icon';
  const classes = [
    baseClass,
    `${baseClass}--${size}`,
    `${baseClass}--${provider}`,
    className
  ].filter(Boolean).join(' ');
  
  // Get icon path based on provider
  const getIconPath = (provider) => {
    const icons = {
      'aws': '/images/providers/aws.svg',
      'azure': '/images/providers/azure.svg',
      'gcp': '/images/providers/gcp.svg',
      'vmware': '/images/providers/vmware.svg'
    };
    
    return icons[provider] || '';
  };
  
  return (
    <div className={classes} {...rest}>
      <img
        src={getIconPath(provider)}
        alt={`${provider} logo`}
        className={`${baseClass}__img`}
      />
    </div>
  );
};

ProviderIcon.propTypes = {
  provider: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string
};

export default ProviderIcon;