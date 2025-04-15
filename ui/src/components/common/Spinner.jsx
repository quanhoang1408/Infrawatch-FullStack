import React from 'react';
import './Spinner.scss';

const Spinner = ({ size = 'medium', centered = false }) => {
  const spinnerClasses = `spinner spinner--${size} ${centered ? 'spinner--centered' : ''}`;
  
  return (
    <div className={spinnerClasses}>
      <div className="spinner__circle"></div>
    </div>
  );
};

export default Spinner;