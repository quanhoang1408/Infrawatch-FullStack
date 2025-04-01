// CertificateList.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Button, EmptyState, Spinner } from '../common';
import CertificateCard from './CertificateCard';

/**
 * List of SSH certificates
 * @param {array} certificates - List of certificate objects
 * @param {function} onAction - Handler for certificate actions
 * @param {function} onAddNew - Handler for adding a new certificate
 * @param {boolean} loading - Loading state
 */
const CertificateList = ({
  certificates = [],
  onAction,
  onAddNew,
  loading = false,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-certificate-list';
  const classes = [baseClass, className].filter(Boolean).join(' ');

  // Render loading state
  if (loading) {
    return (
      <div className={`${baseClass}__loading`}>
        <Spinner size="lg" />
      </div>
    );
  }

  // Render empty state
  if (certificates.length === 0) {
    return (
      <div className={classes} {...rest}>
        <EmptyState
          title="No Certificates Found"
          description="You don't have any SSH certificates yet."
          icon={<i className="icon-key" />}
          actionText="Add Certificate"
          onActionClick={onAddNew}
        />
      </div>
    );
  }

  return (
    <div className={classes} {...rest}>
      <div className={`${baseClass}__header`}>
        <h2 className={`${baseClass}__title`}>SSH Certificates</h2>
        <Button
          variant="primary"
          icon={<i className="icon-plus" />}
          onClick={onAddNew}
        >
          Add Certificate
        </Button>
      </div>
      
      <div className={`${baseClass}__grid`}>
        {certificates.map(certificate => (
          <CertificateCard
            key={certificate.id}
            certificate={certificate}
            onAction={onAction}
          />
        ))}
      </div>
    </div>
  );
};

CertificateList.propTypes = {
  certificates: PropTypes.arrayOf(PropTypes.object),
  onAction: PropTypes.func,
  onAddNew: PropTypes.func,
  loading: PropTypes.bool,
  className: PropTypes.string
};

export default CertificateList;