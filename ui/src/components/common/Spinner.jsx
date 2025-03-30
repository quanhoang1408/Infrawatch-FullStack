// Spinner.jsx
import React from 'react';
import PropTypes from 'prop-types';
import '../styles/components/Spinner.scss';

/**
 * Loading spinner component
 * @param {string} size - Spinner size (sm, md, lg)
 * @param {string} color - Spinner color
 * @param {string} className - Additional class names
 */
const Spinner = ({
  size = 'md',
  color = 'primary',
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-spinner';
  const classes = [
    baseClass,
    `${baseClass}--${size}`,
    `${baseClass}--${color}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...rest} role="status">
      <div className={`${baseClass}__circle`}></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

Spinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  color: PropTypes.oneOf(['primary', 'secondary', 'white']),
  className: PropTypes.string
};

export default Spinner;