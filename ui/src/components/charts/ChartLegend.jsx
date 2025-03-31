// ChartLegend.jsx
import React from 'react';
import PropTypes from 'prop-types';
import '../styles/components/charts/ChartLegend.scss';

/**
 * Custom legend component for charts
 * @param {array} payload - Legend data
 * @param {boolean} vertical - Vertical layout
 * @param {array} data - Original chart data (for pie charts)
 * @param {array} colors - Custom colors (for pie charts)
 */
const ChartLegend = ({ 
  payload = [], 
  vertical = false,
  data = [],
  colors = [],
  className = '',
  ...rest 
}) => {
  const baseClass = 'iw-chart-legend';
  const classes = [
    baseClass,
    vertical ? `${baseClass}--vertical` : '',
    className
  ].filter(Boolean).join(' ');
  
  // For pie charts, we need to create our own payload
  const legendItems = payload.length > 0 
    ? payload 
    : data.map((item, index) => ({
        value: item.name,
        color: colors[index % colors.length],
        type: 'rect'
      }));
  
  if (legendItems.length === 0) {
    return null;
  }
  
  return (
    <div className={classes} {...rest}>
      {legendItems.map((entry, index) => (
        <div key={`item-${index}`} className={`${baseClass}__item`}>
          <div 
            className={`${baseClass}__color`} 
            style={{ 
              backgroundColor: entry.color,
              borderRadius: entry.type === 'circle' ? '50%' : '3px'
            }}
          />
          <div className={`${baseClass}__label`}>{entry.value}</div>
        </div>
      ))}
    </div>
  );
};

ChartLegend.propTypes = {
  payload: PropTypes.array,
  vertical: PropTypes.bool,
  data: PropTypes.array,
  colors: PropTypes.array,
  className: PropTypes.string
};

export default ChartLegend;