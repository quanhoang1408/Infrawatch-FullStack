// VMConfirmationModal.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from '../common';

/**
 * Confirmation modal for VM actions
 * @param {boolean} visible - Modal visibility
 * @param {function} onClose - Handler for modal close
 * @param {function} onConfirm - Handler for confirmation
 * @param {string} action - Action being confirmed
 * @param {object} vm - VM object
 */
const VMConfirmationModal = ({
  visible = false,
  onClose,
  onConfirm,
  action = '',
  vm,
  loading = false,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-vm-confirmation-modal';
  const classes = [baseClass, className].filter(Boolean).join(' ');
  
  // Get title based on action
  const getTitle = () => {
    const titles = {
      'start': 'Start Virtual Machine',
      'stop': 'Stop Virtual Machine',
      'restart': 'Restart Virtual Machine',
      'terminate': 'Terminate Virtual Machine',
      'default': 'Confirm Action'
    };
    
    return titles[action] || titles.default;
  };
  
  // Get confirmation message based on action
  const getMessage = () => {
    if (!vm) return '';
    
    const messages = {
      'start': `Are you sure you want to start virtual machine "${vm.name}"?`,
      'stop': `Are you sure you want to stop virtual machine "${vm.name}"?`,
      'restart': `Are you sure you want to restart virtual machine "${vm.name}"?`,
      'terminate': `Are you sure you want to permanently delete virtual machine "${vm.name}"? This action cannot be undone.`,
      'default': `Are you sure you want to perform this action on virtual machine "${vm.name}"?`
    };
    
    return messages[action] || messages.default;
  };
  
  // Get button text based on action
  const getButtonText = () => {
    const buttonTexts = {
      'start': 'Start',
      'stop': 'Stop',
      'restart': 'Restart',
      'terminate': 'Terminate',
      'default': 'Confirm'
    };
    
    return buttonTexts[action] || buttonTexts.default;
  };
  
  // Get button variant based on action
  const getButtonVariant = () => {
    return action === 'terminate' ? 'danger' : 'primary';
  };
  
  // Handle confirmation
  const handleConfirm = () => {
    onConfirm?.(action, vm);
  };
  
  // Render warning for terminate action
  const renderTerminateWarning = () => {
    if (action !== 'terminate') return null;
    
    return (
      <div className={`${baseClass}__warning`}>
        <i className="icon-alert-triangle" />
        <p>
          This will permanently delete all data associated with this virtual machine.
          This action cannot be undone.
        </p>
      </div>
    );
  };
  
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={getTitle()}
      className={classes}
      okText={getButtonText()}
      okLoading={loading}
      onOk={handleConfirm}
      cancelText="Cancel"
      {...rest}
    >
      <div className={`${baseClass}__content`}>
        <p className={`${baseClass}__message`}>{getMessage()}</p>
        {renderTerminateWarning()}
        
        {vm && (
          <div className={`${baseClass}__vm-info`}>
            <div className={`${baseClass}__vm-info-item`}>
              <span className={`${baseClass}__vm-info-label`}>VM Name:</span>
              <span className={`${baseClass}__vm-info-value`}>{vm.name}</span>
            </div>
            
            <div className={`${baseClass}__vm-info-item`}>
              <span className={`${baseClass}__vm-info-label`}>VM ID:</span>
              <span className={`${baseClass}__vm-info-value`}>{vm.id}</span>
            </div>
            
            {vm.ipAddress && (
              <div className={`${baseClass}__vm-info-item`}>
                <span className={`${baseClass}__vm-info-label`}>IP Address:</span>
                <span className={`${baseClass}__vm-info-value`}>{vm.ipAddress}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

VMConfirmationModal.propTypes = {
  visible: PropTypes.bool,
  onClose: PropTypes.func,
  onConfirm: PropTypes.func,
  action: PropTypes.oneOf(['start', 'stop', 'restart', 'terminate', '']),
  vm: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    ipAddress: PropTypes.string
  }),
  loading: PropTypes.bool,
  className: PropTypes.string
};

export default VMConfirmationModal;