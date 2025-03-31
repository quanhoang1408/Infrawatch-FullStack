// ChartTooltip.jsx
import React from 'react';
import PropTypes from 'prop-types';
import '../styles/components/charts/ChartTooltip.scss';

/**
 * Custom tooltip component for charts
 * @param {boolean} active - Whether tooltip is active
 * @param {array} payload - Tooltip data
 * @param {string} label - Tooltip label
 * @param {function} formatter - Custom value formatter
 */
const ChartTooltip = ({ 
  active, 
  payload, 
  label,
  formatter,
  className = '',
  ...rest 
}) => {
  const baseClass = 'iw-chart-tooltip';
  const classes = [baseClass, className].filter(Boolean).join(' ');
  
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  
  return (
    <div className={classes} {...rest}>
      {label && <div className={`${baseClass}__label`}>{label}</div>}
      <div className={`${baseClass}__items`}>
        {payload.map((entry, index) => {
          // Apply formatter if provided
          const [formattedValue, formattedName] = formatter 
            ? formatter(entry.value, entry.name, entry, index) 
            : [entry.value, entry.name];
          
          return (
            <div key={`item-${index}`} className={`${baseClass}__item`}>
              <div 
                className={`${baseClass}__color`} 
                style={{ backgroundColor: entry.color }}
              />
              <div className={`${baseClass}__name`}>{formattedName || entry.name}:</div>
              <div className={`${baseClass}__value`}>{formattedValue}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

ChartTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  formatter: PropTypes.func,
  className: PropTypes.string
};

export default ChartTooltip;