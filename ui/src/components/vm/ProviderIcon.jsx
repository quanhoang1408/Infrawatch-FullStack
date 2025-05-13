import React from 'react';
import './ProviderIcon.scss';

const ProviderIcon = ({ provider, size = 'md' }) => {
  // Handle undefined or null provider
  const safeProvider = provider || 'unknown';

  const getProviderIcon = () => {
    // Check if provider is defined before calling toLowerCase
    if (!provider) return null;

    switch (safeProvider.toLowerCase()) {
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
    // Check if provider is defined before calling toLowerCase
    if (!provider) return 'var(--text-tertiary)';

    switch (safeProvider.toLowerCase()) {
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
        <img src={iconSrc} alt={`${safeProvider} icon`} className="provider-icon__img" />
      ) : (
        <div className="provider-icon__fallback">
          {safeProvider.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
};

export default ProviderIcon;