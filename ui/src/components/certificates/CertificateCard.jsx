// CertificateCard.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Card, StatusBadge } from '../common';
import CertificateActions from './CertificateActions';

/**
 * Card component for displaying SSH certificate information
 * @param {object} certificate - Certificate object
 * @param {function} onAction - Handler for certificate actions
 * @param {boolean} loading - Loading state
 */
const CertificateCard = ({
  certificate,
  onAction,
  loading = false,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-certificate-card';
  const classes = [baseClass, className].filter(Boolean).join(' ');

  // Format expiration date
  const formatExpirationDate = (date) => {
    if (!date) return 'N/A';
    
    const expirationDate = new Date(date);
    return expirationDate.toLocaleDateString();
  };

  // Calculate days until expiration
  const getDaysUntilExpiration = (date) => {
    if (!date) return 0;
    
    const expirationDate = new Date(date);
    const today = new Date();
    
    // Set both dates to midnight for accurate day calculation
    expirationDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = expirationDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Determine status based on expiration
  const getStatus = (date) => {
    if (!date) return { type: 'default', label: 'Unknown' };
    
    const daysLeft = getDaysUntilExpiration(date);
    
    if (daysLeft < 0) {
      return { type: 'error', label: 'Expired' };
    } else if (daysLeft <= 7) {
      return { type: 'warning', label: 'Expiring Soon' };
    } else {
      return { type: 'success', label: 'Valid' };
    }
  };

  // Truncate fingerprint for display
  const formatFingerprint = (fingerprint) => {
    if (!fingerprint) return 'N/A';
    
    // Show first 8 and last 8 characters
    if (fingerprint.length > 20) {
      return `${fingerprint.substring(0, 8)}...${fingerprint.substring(fingerprint.length - 8)}`;
    }
    
    return fingerprint;
  };

  if (loading || !certificate) {
    return (
      <Card
        className={classes}
        loading={true}
        {...rest}
      />
    );
  }

  const { type, label } = getStatus(certificate.expiresAt);
  const daysLeft = getDaysUntilExpiration(certificate.expiresAt);

  return (
    <Card
      className={classes}
      {...rest}
      actions={
        <CertificateActions
          certificate={certificate}
          onAction={onAction}
        />
      }
    >
      <div className={`${baseClass}__content`}>
        <div className={`${baseClass}__header`}>
          <div className={`${baseClass}__name`}>{certificate.name}</div>
          <StatusBadge
            status={label}
            type={type}
            className={`${baseClass}__status`}
          />
        </div>
        
        <div className={`${baseClass}__info`}>
          <div className={`${baseClass}__info-row`}>
            <div className={`${baseClass}__info-label`}>Type:</div>
            <div className={`${baseClass}__info-value`}>{certificate.type || 'SSH Key'}</div>
          </div>
          
          <div className={`${baseClass}__info-row`}>
            <div className={`${baseClass}__info-label`}>Fingerprint:</div>
            <div className={`${baseClass}__info-value ${baseClass}__fingerprint`}>
              {formatFingerprint(certificate.fingerprint)}
            </div>
          </div>
          
          <div className={`${baseClass}__info-row`}>
            <div className={`${baseClass}__info-label`}>Created:</div>
            <div className={`${baseClass}__info-value`}>
              {new Date(certificate.createdAt).toLocaleDateString()}
            </div>
          </div>
          
          <div className={`${baseClass}__info-row`}>
            <div className={`${baseClass}__info-label`}>Expires:</div>
            <div className={`${baseClass}__info-value`}>
              {formatExpirationDate(certificate.expiresAt)}
              {daysLeft > 0 && (
                <span className={`${baseClass}__days-left`}>
                  ({daysLeft} day{daysLeft !== 1 ? 's' : ''} left)
                </span>
              )}
            </div>
          </div>
        </div>
        
        {certificate.description && (
          <div className={`${baseClass}__description`}>
            {certificate.description}
          </div>
        )}
      </div>
    </Card>
  );
};

CertificateCard.propTypes = {
  certificate: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string,
    fingerprint: PropTypes.string,
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    expiresAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    description: PropTypes.string
  }),
  onAction: PropTypes.func,
  loading: PropTypes.bool,
  className: PropTypes.string
};

export default CertificateCard;