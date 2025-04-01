// CertificateActions.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Dropdown, Button, Tooltip } from '../common';

/**
 * Actions component for certificate management
 * @param {object} certificate - Certificate object
 * @param {function} onAction - Handler for actions
 */
const CertificateActions = ({
  certificate,
  onAction,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-certificate-actions';
  const classes = [baseClass, className].filter(Boolean).join(' ');

  // Handle action click
  const handleAction = (action) => {
    onAction?.(action, certificate);
  };

  // Determine if certificate is expired
  const isExpired = () => {
    if (!certificate?.expiresAt) return false;
    
    const expirationDate = new Date(certificate.expiresAt);
    const today = new Date();
    
    return expirationDate < today;
  };

  // Primary action button (varies based on certificate state)
  const renderPrimaryAction = () => {
    if (isExpired()) {
      return (
        <Tooltip content="Renew Certificate">
          <Button
            variant="primary"
            size="sm"
            icon={<i className="icon-refresh-cw" />}
            className={`${baseClass}__primary-action`}
            onClick={() => handleAction('renew')}
          />
        </Tooltip>
      );
    }
    
    return (
      <Tooltip content="View Details">
        <Button
          variant="text"
          size="sm"
          icon={<i className="icon-eye" />}
          className={`${baseClass}__primary-action`}
          onClick={() => handleAction('view')}
        />
      </Tooltip>
    );
  };

  // Dropdown menu for more actions
  const actionsMenu = (
    <>
      <Dropdown.Item onClick={() => handleAction('view')}>
        <i className="icon-eye" />
        <span>View Details</span>
      </Dropdown.Item>
      
      <Dropdown.Item onClick={() => handleAction('edit')}>
        <i className="icon-edit" />
        <span>Edit</span>
      </Dropdown.Item>
      
      <Dropdown.Item onClick={() => handleAction('renew')}>
        <i className="icon-refresh-cw" />
        <span>Renew</span>
      </Dropdown.Item>
      
      <Dropdown.Item onClick={() => handleAction('download')}>
        <i className="icon-download" />
        <span>Download Public Key</span>
      </Dropdown.Item>
      
      <Dropdown.Divider />
      
      <Dropdown.Item 
        onClick={() => handleAction('deploy')}
        className={`${baseClass}__deploy-action`}
      >
        <i className="icon-upload-cloud" />
        <span>Deploy to VM</span>
      </Dropdown.Item>
      
      <Dropdown.Divider />
      
      <Dropdown.Item 
        onClick={() => handleAction('delete')}
        className={`${baseClass}__delete-action`}
      >
        <i className="icon-trash-2" />
        <span>Delete</span>
      </Dropdown.Item>
    </>
  );

  return (
    <div className={classes} {...rest}>
      {renderPrimaryAction()}
      
      <Dropdown
        trigger={
          <Button
            variant="text"
            size="sm"
            icon={<i className="icon-more-vertical" />}
            className={`${baseClass}__more-action`}
          />
        }
        placement="bottom-right"
      >
        {actionsMenu}
      </Dropdown>
    </div>
  );
};

CertificateActions.propTypes = {
  certificate: PropTypes.object.isRequired,
  onAction: PropTypes.func,
  className: PropTypes.string
};

export default CertificateActions;
