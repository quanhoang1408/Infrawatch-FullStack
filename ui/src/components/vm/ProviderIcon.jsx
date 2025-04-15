import React from 'react';
import './ProviderIcon.scss';

const ProviderIcon = ({ provider, size = 'md' }) => {
  const getProviderIcon = () => {
    switch (provider.toLowerCase()) {
      case 'aws':
        return '/images/providers/aws.svg';
      case 'azure':
        return '/images/providers/azure.svg';
      case 'gcp':
        return '/images/providers/gcp.svg';
      case 'vmware':
        return '/images/providers/vmware.svg';
      default:
        return null;
    }
  };

  const getProviderColor = () => {
    switch (provider.toLowerCase()) {
      case 'aws':
        return 'var(--aws-color)';
      case 'azure':
        return 'var(--azure-color)';
      case 'gcp':
        return 'var(--gcp-color)';
      case 'vmware':
        return 'var(--vmware-color)';
      default:
        return 'var(--text-tertiary)';
    }
  };

  const iconSrc = getProviderIcon();
  const providerColor = getProviderColor();

  return (
    <div className={`provider-icon provider-icon--${size}`} style={{ '--provider-color': providerColor }}>
      {iconSrc ? (
        <img src={iconSrc} alt={`${provider} icon`} className="provider-icon__img" />
      ) : (
        <div className="provider-icon__fallback">
          {provider.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
};

export default ProviderIcon;