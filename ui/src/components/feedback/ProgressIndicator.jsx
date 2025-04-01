// ProgressIndicator.jsx
import React from 'react';
import PropTypes from 'prop-types';
import './ProgressIndicator.scss';

/**
 * Component to display progress
 * @param {number} percent - Progress percentage (0-100)
 * @param {string} status - Progress status (normal, success, error, active)
 * @param {boolean} showInfo - Whether to show percentage info
 * @param {string} type - Progress type (line, circle)
 * @param {string} size - Progress size (small, default, large)
 * @param {string} format - Custom format function for percentage display
 * @param {boolean} striped - Whether to show striped effect
 * @param {string} strokeColor - Progress bar color
 * @param {string} trailColor - Trail color
 */
const ProgressIndicator = ({
  percent = 0,
  status = 'normal',
  showInfo = true,
  type = 'line',
  size = 'default',
  format,
  striped = false,
  strokeColor,
  trailColor,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-progress';
  const classes = [
    baseClass,
    `${baseClass}--${type}`,
    `${baseClass}--${size}`,
    `${baseClass}--${status}`,
    striped ? `${baseClass}--striped` : '',
    className
  ].filter(Boolean).join(' ');
  
  // Ensure percent is between 0-100
  const progressPercent = Math.min(100, Math.max(0, percent));
  
  // Format percentage display
  const formatPercent = () => {
    if (format) {
      return format(progressPercent);
    }
    
    if (status === 'success') {
      return <i className="icon-check" />;
    }
    
    if (status === 'error') {
      return <i className="icon-x" />;
    }
    
    return `${Math.round(progressPercent)}%`;
  };
  
  // Get inline styles
  const getProgressStyle = () => {
    const style = { width: `${progressPercent}%` };
    
    if (strokeColor) {
      style.backgroundColor = strokeColor;
    }
    
    return style;
  };
  
  const getTrailStyle = () => {
    return trailColor ? { backgroundColor: trailColor } : {};
  };
  
  // Render line progress
  if (type === 'line') {
    return (
      <div className={classes} {...rest}>
        <div className={`${baseClass}__outer`}>
          <div 
            className={`${baseClass}__trail`}
            style={getTrailStyle()}
          >
            <div 
              className={`${baseClass}__bar`}
              style={getProgressStyle()}
            />
          </div>
        </div>
        
        {showInfo && (
          <div className={`${baseClass}__info`}>
            {formatPercent()}
          </div>
        )}
      </div>
    );
  }
  
  // Render circle progress
  if (type === 'circle') {
    const strokeWidth = size === 'small' ? 6 : (size === 'large' ? 10 : 8);
    const radius = size === 'small' ? 34 : (size === 'large' ? 80 : 60);
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progressPercent / 100) * circumference;
    
    const viewBoxSize = (radius * 2) + (strokeWidth * 2);
    
    return (
      <div className={classes} {...rest}>
        <svg
          className={`${baseClass}__circle-svg`}
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          width={viewBoxSize}
          height={viewBoxSize}
        >
          <circle
            className={`${baseClass}__circle-trail`}
            cx={viewBoxSize / 2}
            cy={viewBoxSize / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            style={getTrailStyle()}
          />
          <circle
            className={`${baseClass}__circle-bar`}
            cx={viewBoxSize / 2}
            cy={viewBoxSize / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${viewBoxSize / 2} ${viewBoxSize / 2})`}
            style={strokeColor ? { stroke: strokeColor } : {}}
          />
        </svg>
        
        {showInfo && (
          <div className={`${baseClass}__circle-info`}>
            {formatPercent()}
          </div>
        )}
      </div>
    );
  }
  
  return null;
};

ProgressIndicator.propTypes = {
  percent: PropTypes.number,
  status: PropTypes.oneOf(['normal', 'success', 'error', 'active']),
  showInfo: PropTypes.bool,
  type: PropTypes.oneOf(['line', 'circle']),
  size: PropTypes.oneOf(['small', 'default', 'large']),
  format: PropTypes.func,
  striped: PropTypes.bool,
  strokeColor: PropTypes.string,
  trailColor: PropTypes.string,
  className: PropTypes.string
};

export default ProgressIndicator;