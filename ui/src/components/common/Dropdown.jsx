// Dropdown.jsx
import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../styles/components/Dropdown.scss';
import useOnClickOutside from '../../hooks/useOnClickOutside';

/**
 * Dropdown component for Infrawatch
 * @param {node} trigger - Element that triggers the dropdown
 * @param {node} children - Dropdown content
 * @param {string} placement - Dropdown placement (top, right, bottom, left)
 * @param {boolean} visible - Controlled visibility
 * @param {function} onVisibleChange - Callback when visibility changes
 * @param {string} className - Additional class names
 */
const Dropdown = ({
  trigger,
  children,
  placement = 'bottom-left',
  visible: controlledVisible,
  onVisibleChange,
  className = '',
  closeOnClick = true,
  ...rest
}) => {
  const isControlled = controlledVisible !== undefined;
  const [uncontrolledVisible, setUncontrolledVisible] = useState(false);
  
  const visible = isControlled ? controlledVisible : uncontrolledVisible;
  
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  const handleToggle = () => {
    if (isControlled) {
      onVisibleChange?.(!controlledVisible);
    } else {
      setUncontrolledVisible(!uncontrolledVisible);
    }
  };

  const handleClose = () => {
    if (isControlled) {
      onVisibleChange?.(false);
    } else {
      setUncontrolledVisible(false);
    }
  };

  useOnClickOutside(containerRef, handleClose);

  const baseClass = 'iw-dropdown';
  const classes = [
    baseClass,
    visible ? `${baseClass}--open` : '',
    className
  ].filter(Boolean).join(' ');

  const menuClasses = [
    `${baseClass}__menu`,
    `${baseClass}__menu--${placement}`,
    visible ? `${baseClass}__menu--visible` : ''
  ].filter(Boolean).join(' ');

  const handleMenuClick = (e) => {
    if (closeOnClick) {
      handleClose();
    }
  };

  return (
    <div className={classes} ref={containerRef} {...rest}>
      <div className={`${baseClass}__trigger`} onClick={handleToggle}>
        {trigger}
      </div>
      <div className={menuClasses} ref={dropdownRef} onClick={handleMenuClick}>
        {children}
      </div>
    </div>
  );
};

Dropdown.Item = function DropdownItem({ children, onClick, className = '', disabled = false, ...rest }) {
  const baseClass = 'iw-dropdown-item';
  const classes = [
    baseClass,
    disabled ? `${baseClass}--disabled` : '',
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (disabled) return;
    onClick?.(e);
  };

  return (
    <div className={classes} onClick={handleClick} {...rest}>
      {children}
    </div>
  );
};

Dropdown.Divider = function DropdownDivider({ className = '', ...rest }) {
  const classes = ['iw-dropdown-divider', className].filter(Boolean).join(' ');
  
  return <div className={classes} {...rest} />;
};

Dropdown.propTypes = {
  trigger: PropTypes.node.isRequired,
  children: PropTypes.node,
  placement: PropTypes.oneOf(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'left-top', 'left-bottom', 'right-top', 'right-bottom']),
  visible: PropTypes.bool,
  onVisibleChange: PropTypes.func,
  className: PropTypes.string,
  closeOnClick: PropTypes.bool
};

Dropdown.Item.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func,
  className: PropTypes.string,
  disabled: PropTypes.bool
};

Dropdown.Divider.propTypes = {
  className: PropTypes.string
};

export default Dropdown;