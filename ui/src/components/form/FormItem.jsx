
// FormItem.jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Form item component for form layout and validation
 * @param {string} label - Form item label
 * @param {boolean} required - Whether the field is required
 * @param {string} error - Error message
 * @param {node} children - Form control components
 * @param {string} helpText - Help text for the form item
 * @param {string} labelFor - ID of the form control
 * @param {string} className - Additional class names
 */
const FormItem = ({
  label,
  required = false,
  error,
  children,
  helpText,
  labelFor,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-form-item';
  const classes = [
    baseClass,
    error ? `${baseClass}--error` : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...rest}>
      {label && (
        <label
          className={`${baseClass}__label`}
          htmlFor={labelFor}
        >
          <span className={`${baseClass}__label-text`}>{label}</span>
          {required && <span className={`${baseClass}__required`}>*</span>}
        </label>
      )}
      
      <div className={`${baseClass}__content`}>
        {children}
        
        {(error || helpText) && (
          <div className={`${baseClass}__extra`}>
            {error && (
              <div className={`${baseClass}__error`}>
                <i className="icon-alert-circle" />
                <span>{error}</span>
              </div>
            )}
            
            {helpText && !error && (
              <div className={`${baseClass}__help`}>
                {helpText}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

FormItem.propTypes = {
  label: PropTypes.node,
  required: PropTypes.bool,
  error: PropTypes.string,
  children: PropTypes.node,
  helpText: PropTypes.node,
  labelFor: PropTypes.string,
  className: PropTypes.string
};

export default FormItem;