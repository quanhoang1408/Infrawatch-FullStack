// Button.jsx - Simplified version for development
import React from 'react';
import PropTypes from 'prop-types';
// import '../styles/components/Button.scss';

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

  // Style mapping
  const variantStyles = {
    primary: {
      backgroundColor: '#2196F3',
      color: 'white',
      border: 'none'
    },
    secondary: {
      backgroundColor: '#757575',
      color: 'white',
      border: 'none'
    },
    danger: {
      backgroundColor: '#F44336',
      color: 'white',
      border: 'none'
    },
    success: {
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none'
    },
    warning: {
      backgroundColor: '#FF9800',
      color: 'white',
      border: 'none'
    },
    text: {
      backgroundColor: 'transparent',
      color: '#2196F3',
      border: 'none'
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#2196F3',
      border: '1px solid #2196F3'
    }
  };

  const sizeStyles = {
    sm: {
      padding: '0.25rem 0.5rem',
      fontSize: '0.875rem'
    },
    md: {
      padding: '0.5rem 1rem',
      fontSize: '1rem'
    },
    lg: {
      padding: '0.75rem 1.5rem',
      fontSize: '1.25rem'
    }
  };

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    textAlign: 'center',
    verticalAlign: 'middle',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    userSelect: 'none',
    borderRadius: '0.25rem',
    transition: 'all 0.2s ease-in-out',
    opacity: disabled || loading ? 0.65 : 1,
    width: fullWidth ? '100%' : 'auto',
    ...variantStyles[variant],
    ...sizeStyles[size]
  };

  const spinnerStyle = {
    display: 'inline-block',
    width: '1rem',
    height: '1rem',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '50%',
    borderTopColor: 'white',
    animation: 'spin 1s linear infinite',
    marginRight: children ? '0.5rem' : 0
  };

  const iconStyle = {
    marginRight: iconPosition === 'left' && children ? '0.5rem' : 0,
    marginLeft: iconPosition === 'right' && children ? '0.5rem' : 0,
    display: 'inline-flex',
    alignItems: 'center'
  };

  return (
    <button
      type={type}
      className={classes}
      style={baseStyle}
      onClick={onClick}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span style={spinnerStyle}></span>}
      {icon && iconPosition === 'left' && <span style={{...iconStyle, order: 1}}>{icon}</span>}
      {children && <span style={{order: 2}}>{children}</span>}
      {icon && iconPosition === 'right' && <span style={{...iconStyle, order: 3}}>{icon}</span>}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
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