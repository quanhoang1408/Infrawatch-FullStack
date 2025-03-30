// Button.jsx
import React from 'react';
import PropTypes from 'prop-types';
import '../styles/components/Button.scss';

/**
 * Button component for Infrawatch
 * @param {string} variant - primary, secondary, danger, success, warning, text, outline
 * @param {string} size - sm, md, lg
 * @param {boolean} fullWidth - Makes button take 100% width
 * @param {boolean} loading - Shows loading spinner
 * @param {boolean} disabled - Disables the button
 * @param {function} onClick - Click handler
 * @param {string} type - button type (button, submit, reset)
 * @param {node} children - Button content
 * @param {string} className - Additional class names
 */
const Button = ({ 
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  children,
  className = '',
  icon = null,
  iconPosition = 'left',
  ...rest
}) => {
  const baseClass = 'iw-button';
  const classes = [
    baseClass,
    `${baseClass}--${variant}`,
    `${baseClass}--${size}`,
    fullWidth ? `${baseClass}--full-width` : '',
    loading ? `${baseClass}--loading` : '',
    disabled ? `${baseClass}--disabled` : '',
    icon && !children ? `${baseClass}--icon-only` : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className={`${baseClass}__spinner`}></span>}
      {icon && iconPosition === 'left' && <span className={`${baseClass}__icon ${baseClass}__icon--left`}>{icon}</span>}
      {children && <span className={`${baseClass}__text`}>{children}</span>}
      {icon && iconPosition === 'right' && <span className={`${baseClass}__icon ${baseClass}__icon--right`}>{icon}</span>}
    </button>
  );
};

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success', 'warning', 'text', 'outline']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  fullWidth: PropTypes.bool,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  children: PropTypes.node,
  className: PropTypes.string,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right'])
};

export default Button;