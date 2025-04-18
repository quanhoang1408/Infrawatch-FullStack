// GaugeChart.jsx - Simplified version for development
import React from 'react';
import PropTypes from 'prop-types';

// Temporarily commented out to avoid dependency errors
// import { PieChart, Pie, Cell, ResponsiveContainer, Text } from 'recharts';
// import Spinner from '../common/Spinner';
// import '../styles/components/charts/GaugeChart.scss';

/**
 * Gauge chart component for displaying a single value in a range
 * @param {number} value - Current value
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {array} thresholds - Threshold values for color changes
 * @param {array} colors - Colors for different thresholds
 * @param {string} label - Chart label
 * @param {string} unit - Unit for the value
 * @param {boolean} loading - Loading state
 */
const GaugeChart = ({
  value = 0,
  min = 0,
  max = 100,
  thresholds = [33, 66],
  colors = ['#2ca02c', '#ff7f0e', '#d62728'],
  label,
  unit = '%',
  loading = false,
  height = 200,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-gauge-chart';
  const classes = [baseClass, className].filter(Boolean).join(' ');

  // Ensure value is between min and max
  const normalizedValue = Math.min(Math.max(value, min), max);

  // Calculate percentage of value in range
  const percentage = ((normalizedValue - min) / (max - min)) * 100;

  // Determine color based on thresholds
  const getColor = (value) => {
    if (value <= thresholds[0]) return colors[0];
    if (value <= thresholds[1]) return colors[1];
    return colors[2];
  };

  const color = getColor(percentage);

  // Create data for the gauge
  const data = [
    { name: 'value', value: percentage },
    { name: 'empty', value: 100 - percentage }
  ];

  // Simplified implementation for development
  return (
    <div className="gauge-chart-placeholder" style={{
      height: height || 200,
      width: height || 200,
      margin: '0 auto',
      background: '#f5f5f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      padding: '20px',
      borderRadius: '50%',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: `${percentage}%`,
        background: color,
        transition: 'height 0.5s ease-out'
      }} />
      <div style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          {normalizedValue}{unit}
        </div>
        {label && (
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            {label}
          </div>
        )}
      </div>
    </div>
  );
};

GaugeChart.propTypes = {
  value: PropTypes.number,
  min: PropTypes.number,
  max: PropTypes.number,
  thresholds: PropTypes.arrayOf(PropTypes.number),
  colors: PropTypes.arrayOf(PropTypes.string),
  label: PropTypes.string,
  unit: PropTypes.string,
  loading: PropTypes.bool,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  className: PropTypes.string
};

export default GaugeChart;