// InputWithIcon.jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Input field with icon component
 * @param {node} icon - Icon to display
 * @param {string} iconPosition - Position of the icon (left or right)
 * @param {string} type - Input type
 * @param {string} value - Input value
 * @param {function} onChange - Change handler
 * @param {string} placeholder - Input placeholder
 * @param {boolean} disabled - Whether the input is disabled
 * @param {boolean} error - Whether the input has an error
 */
const InputWithIcon = ({
  icon,
  iconPosition = 'left',
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  error = false,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-input-with-icon';
  const classes = [
    baseClass,
    `${baseClass}--${iconPosition}`,
    disabled ? `${baseClass}--disabled` : '',
    error ? `${baseClass}--error` : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {icon && iconPosition === 'left' && (
        <div className={`${baseClass}__icon ${baseClass}__icon--left`}>
          {icon}
        </div>
      )}
      
      <input
        type={type}
        className={`${baseClass}__input`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        {...rest}
      />
      
      {icon && iconPosition === 'right' && (
        <div className={`${baseClass}__icon ${baseClass}__icon--right`}>
          {icon}
        </div>
      )}
    </div>
  );
};

InputWithIcon.propTypes = {
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  className: PropTypes.string
};

export default InputWithIcon;