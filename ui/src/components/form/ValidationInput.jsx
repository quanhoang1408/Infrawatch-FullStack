// ValidationInput.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import InputWithIcon from './InputWithIcon';

/**
 * Input field with built-in validation
 * @param {string} value - Input value
 * @param {function} onChange - Change handler
 * @param {function} validate - Validation function
 * @param {boolean} validateOnChange - Whether to validate on change
 * @param {boolean} validateOnBlur - Whether to validate on blur
 * @param {function} onValidation - Callback for validation result
 * @param {string} errorMessage - Custom error message
 */
const ValidationInput = ({
  value,
  onChange,
  validate,
  validateOnChange = false,
  validateOnBlur = true,
  onValidation,
  errorMessage,
  ...rest
}) => {
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(false);
  
  // Validate the input value
  const validateInput = (val) => {
    if (validate) {
      const validationResult = validate(val);
      
      if (validationResult === true || validationResult === undefined) {
        setError(null);
        onValidation?.(true);
        return true;
      } else {
        const errorMsg = typeof validationResult === 'string' 
          ? validationResult 
          : errorMessage || 'Invalid value';
        
        setError(errorMsg);
        onValidation?.(false, errorMsg);
        return false;
      }
    }
    
    return true;
  };
  
  // Validate when value changes
  useEffect(() => {
    if (touched && validateOnChange) {
      validateInput(value);
    }
  }, [value, touched, validateOnChange]);
  
  // Handle input change
  const handleChange = (e) => {
    onChange?.(e);
    
    if (!touched) {
      setTouched(true);
    }
  };
  
  // Handle input blur
  const handleBlur = (e) => {
    if (validateOnBlur) {
      validateInput(value);
    }
    
    rest.onBlur?.(e);
  };

  return (
    <InputWithIcon
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      error={!!error}
      icon={error ? <i className="icon-alert-circle" /> : null}
      iconPosition="right"
      {...rest}
    />
  );
};

ValidationInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  validate: PropTypes.func,
  validateOnChange: PropTypes.bool,
  validateOnBlur: PropTypes.bool,
  onValidation: PropTypes.func,
  errorMessage: PropTypes.string
};

export default ValidationInput;