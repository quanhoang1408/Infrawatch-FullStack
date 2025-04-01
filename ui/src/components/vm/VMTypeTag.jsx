// VMTypeTag.jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Tag to display VM instance type
 * @param {string} type - VM instance type
 */
const VMTypeTag = ({
  type,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-vm-type-tag';
  const classes = [baseClass, className].filter(Boolean).join(' ');
  
  // Get background color based on VM type
  const getTagColor = (type) => {
    // AWS instance types
    if (type?.startsWith('t2.') || type?.startsWith('t3.')) return '#5470c6';
    if (type?.startsWith('m5.') || type?.startsWith('m6.')) return '#91cc75';
    if (type?.startsWith('c5.') || type?.startsWith('c6.')) return '#fac858';
    if (type?.startsWith('r5.') || type?.startsWith('r6.')) return '#ee6666';
    if (type?.startsWith('p3.') || type?.startsWith('g4.')) return '#73c0de';
    
    // Azure VM sizes
    if (type?.startsWith('Standard_B')) return '#5470c6';
    if (type?.startsWith('Standard_D')) return '#91cc75';
    if (type?.startsWith('Standard_F')) return '#fac858';
    if (type?.startsWith('Standard_E')) return '#ee6666';
    if (type?.startsWith('Standard_N')) return '#73c0de';
    
    // Google Cloud machine types
    if (type?.startsWith('e2-')) return '#5470c6';
    if (type?.startsWith('n2-')) return '#91cc75';
    if (type?.startsWith('c2-')) return '#fac858';
    if (type?.startsWith('m2-')) return '#ee6666';
    if (type?.startsWith('a2-')) return '#73c0de';
    
    // Default color for unknown types
    return '#909399';
  };
  
  return (
    <span
      className={classes}
      style={{ backgroundColor: getTagColor(type) }}
      {...rest}
    >
      {type}
    </span>
  );
};

VMTypeTag.propTypes = {
  type: PropTypes.string.isRequired,
  className: PropTypes.string
};

export default VMTypeTag;