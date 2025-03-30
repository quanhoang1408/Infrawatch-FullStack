// Modal.jsx
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import '../styles/components/Modal.scss';
import Button from './Button';

/**
 * Modal component for Infrawatch
 * @param {boolean} visible - Controls modal visibility
 * @param {function} onClose - Called when modal is closed
 * @param {string} title - Modal title
 * @param {node} children - Modal content
 * @param {string} width - Modal width
 * @param {string} className - Additional class names
 * @param {boolean} closable - Whether modal can be closed by X button
 * @param {boolean} maskClosable - Whether clicking mask closes modal
 * @param {node} footer - Custom footer content
 * @param {string} okText - Text for OK button
 * @param {string} cancelText - Text for cancel button
 * @param {function} onOk - Called when OK button is clicked
 * @param {boolean} okLoading - Loading state for OK button
 * @param {boolean} okDisabled - Disabled state for OK button
 */
const Modal = ({
  visible = false,
  onClose,
  title,
  children,
  width = '500px',
  className = '',
  closable = true,
  maskClosable = true,
  footer,
  okText = 'OK',
  cancelText = 'Cancel',
  onOk,
  okLoading = false,
  okDisabled = false,
  showFooter = true,
  ...rest
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && visible && closable) {
        onClose?.();
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [visible, closable, onClose]);

  const handleMaskClick = (e) => {
    if (maskClosable && e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const baseClass = 'iw-modal';
  const classes = [
    baseClass,
    visible ? `${baseClass}--visible` : '',
    className
  ].filter(Boolean).join(' ');

  if (!visible) return null;

  return (
    <div className={classes} onClick={handleMaskClick} {...rest}>
      <div className={`${baseClass}__container`} ref={modalRef} style={{ width }}>
        <div className={`${baseClass}__header`}>
          {title && <div className={`${baseClass}__title`}>{title}</div>}
          {closable && (
            <button className={`${baseClass}__close`} onClick={onClose} aria-label="Close">
              <span>&times;</span>
            </button>
          )}
        </div>
        <div className={`${baseClass}__content`}>{children}</div>
        {showFooter && (footer || (
          <div className={`${baseClass}__footer`}>
            <Button variant="secondary" onClick={onClose}>
              {cancelText}
            </Button>
            <Button
              variant="primary"
              onClick={onOk}
              loading={okLoading}
              disabled={okDisabled}
            >
              {okText}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

Modal.propTypes = {
  visible: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.node,
  children: PropTypes.node,
  width: PropTypes.string,
  className: PropTypes.string,
  closable: PropTypes.bool,
  maskClosable: PropTypes.bool,
  footer: PropTypes.node,
  okText: PropTypes.string,
  cancelText: PropTypes.string,
  onOk: PropTypes.func,
  okLoading: PropTypes.bool,
  okDisabled: PropTypes.bool,
  showFooter: PropTypes.bool
};

export default Modal;