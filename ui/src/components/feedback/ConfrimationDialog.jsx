// ConfirmationDialog.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from '../common';
import './ConfirmationDialog.scss';

/**
 * Dialog component for confirming actions
 * @param {boolean} visible - Dialog visibility
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {string} confirmText - Text for confirm button
 * @param {string} cancelText - Text for cancel button
 * @param {string} type - Dialog type (info, warning, danger)
 * @param {function} onConfirm - Confirm handler
 * @param {function} onCancel - Cancel handler
 * @param {boolean} loading - Loading state
 * @param {boolean} centered - Whether the dialog is centered
 */
const ConfirmationDialog = ({
  visible = false,
  title = 'Confirm Action',
  message = 'Are you sure you want to perform this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  onConfirm,
  onCancel,
  loading = false,
  centered = true,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-confirmation-dialog';
  const classes = [
    baseClass,
    `${baseClass}--${type}`,
    className
  ].filter(Boolean).join(' ');
  
  // Get icon based on dialog type
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <i className="icon-alert-triangle" />;
      case 'danger':
        return <i className="icon-alert-circle" />;
      case 'info':
      default:
        return <i className="icon-info" />;
    }
  };
  
  // Get button variant based on dialog type
  const getButtonVariant = () => {
    switch (type) {
      case 'warning':
        return 'warning';
      case 'danger':
        return 'danger';
      case 'info':
      default:
        return 'primary';
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onCancel}
      title={title}
      className={classes}
      centered={centered}
      {...rest}
    >
      <div className={`${baseClass}__content`}>
        <div className={`${baseClass}__icon`}>
          {getIcon()}
        </div>
        
        <div className={`${baseClass}__message`}>
          {message}
        </div>
      </div>
      
      <div className={`${baseClass}__footer`}>
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          {cancelText}
        </Button>
        
        <Button
          variant={getButtonVariant()}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};

ConfirmationDialog.propTypes = {
  visible: PropTypes.bool,
  title: PropTypes.string,
  message: PropTypes.node,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  type: PropTypes.oneOf(['info', 'warning', 'danger']),
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
  loading: PropTypes.bool,
  centered: PropTypes.bool,
  className: PropTypes.string
};

export default ConfirmationDialog;