// CertificateDetail.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Card, Button, Spinner, StatusBadge } from '../common';
import CertificateActions from './CertificateActions';

/**
 * Detailed view for a single certificate
 * @param {object} certificate - Certificate object
 * @param {function} onAction - Handler for certificate actions
 * @param {function} onBack - Handler for back button
 * @param {boolean} loading - Loading state
 */
const CertificateDetail = ({
  certificate,
  onAction,
  onBack,
  loading = false,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-certificate-detail';
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

  // Format fingerprint for display
  const formatFingerprint = (fingerprint) => {
    if (!fingerprint) return 'N/A';
    
    // Format as groups of characters separated by colons
    if (fingerprint.includes(':')) return fingerprint;
    
    // If it's a raw string, format it with colons every 2 characters
    return fingerprint.match(/.{1,2}/g)?.join(':') || fingerprint;
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
    <div className={classes} {...rest}>
      <div className={`${baseClass}__header`}>
        <Button
          variant="text"
          icon={<i className="icon-arrow-left" />}
          onClick={onBack}
        >
          Back to Certificates
        </Button>
      </div>
      
      <Card>
        <div className={`${baseClass}__content`}>
          <div className={`${baseClass}__title-row`}>
            <h2 className={`${baseClass}__title`}>{certificate.name}</h2>
            <div className={`${baseClass}__actions`}>
              <StatusBadge
                status={label}
                type={type}
                className={`${baseClass}__status`}
              />
              <CertificateActions
                certificate={certificate}
                onAction={onAction}
              />
            </div>
          </div>
          
          <div className={`${baseClass}__info-grid`}>
            <div className={`${baseClass}__info-item`}>
              <div className={`${baseClass}__info-label`}>Type</div>
              <div className={`${baseClass}__info-value`}>{certificate.type || 'SSH Key'}</div>
            </div>
            
            <div className={`${baseClass}__info-item`}>
              <div className={`${baseClass}__info-label`}>Created</div>
              <div className={`${baseClass}__info-value`}>
                {new Date(certificate.createdAt).toLocaleDateString()}
              </div>
            </div>
            
            <div className={`${baseClass}__info-item`}>
              <div className={`${baseClass}__info-label`}>Last Used</div>
              <div className={`${baseClass}__info-value`}>
                {certificate.lastUsedAt 
                  ? new Date(certificate.lastUsedAt).toLocaleDateString() 
                  : 'Never'}
              </div>
            </div>
            
            <div className={`${baseClass}__info-item`}>
              <div className={`${baseClass}__info-label`}>Expires</div>
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
            <div className={`${baseClass}__description-section`}>
              <div className={`${baseClass}__section-title`}>Description</div>
              <div className={`${baseClass}__description`}>
                {certificate.description}
              </div>
            </div>
          )}
          
          <div className={`${baseClass}__section`}>
            <div className={`${baseClass}__section-title`}>Fingerprint</div>
            <div className={`${baseClass}__fingerprint`}>
              {formatFingerprint(certificate.fingerprint)}
            </div>
          </div>
          
          {certificate.vms && certificate.vms.length > 0 && (
            <div className={`${baseClass}__section`}>
              <div className={`${baseClass}__section-title`}>
                Associated VMs ({certificate.vms.length})
              </div>
              <ul className={`${baseClass}__vm-list`}>
                {certificate.vms.map(vm => (
                  <li key={vm.id} className={`${baseClass}__vm-item`}>
                    <i className="icon-server" />
                    <span>{vm.name}</span>
                    {vm.ipAddress && (
                      <span className={`${baseClass}__vm-ip`}>
                        ({vm.ipAddress})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

CertificateDetail.propTypes = {
  certificate: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string,
    fingerprint: PropTypes.string,
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    expiresAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    lastUsedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    description: PropTypes.string,
    vms: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      ipAddress: PropTypes.string
    }))
  }),
  onAction: PropTypes.func,
  onBack: PropTypes.func,
  loading: PropTypes.bool,
  className: PropTypes.string
};

export default CertificateDetail;