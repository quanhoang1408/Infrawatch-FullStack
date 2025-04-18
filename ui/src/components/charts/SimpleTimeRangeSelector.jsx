import React from 'react';
import PropTypes from 'prop-types';

/**
 * Simple TimeRangeSelector component for development
 */
const SimpleTimeRangeSelector = ({ 
  value, 
  onChange, 
  options = [
    { value: '15m', label: '15 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '6h', label: '6 Hours' },
    { value: '1d', label: '1 Day' },
    { value: '1w', label: '1 Week' }
  ],
  className = '', 
  ...rest 
}) => {
  return (
    <div 
      className={`time-range-selector ${className}`} 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
      {...rest}
    >
      <span style={{ fontSize: '0.875rem', color: '#666' }}>Time Range:</span>
      <div 
        style={{
          display: 'flex',
          border: '1px solid #ddd',
          borderRadius: '4px',
          overflow: 'hidden'
        }}
      >
        {options.map(option => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            style={{
              padding: '6px 12px',
              border: 'none',
              background: value === option.value ? '#2196F3' : '#f5f5f5',
              color: value === option.value ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: value === option.value ? 'bold' : 'normal',
              borderRight: '1px solid #ddd'
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

SimpleTimeRangeSelector.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  className: PropTypes.string
};

export default SimpleTimeRangeSelector;
