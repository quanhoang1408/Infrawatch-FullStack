// GaugeChart.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { PieChart, Pie, Cell, ResponsiveContainer, Text } from 'recharts';
import Spinner from '../common/Spinner';
import '../styles/components/charts/GaugeChart.scss';

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
  
  if (loading) {
    return (
      <div className={`${baseClass}__loading`} style={{ height }}>
        <Spinner size="md" />
      </div>
    );
  }
  
  // Custom label component at the center of the gauge
  const renderCustomizedLabel = () => {
    return (
      <g>
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className={`${baseClass}__value-text`}
          fill="var(--text-color-primary)"
        >
          {normalizedValue}{unit}
        </text>
        {label && (
          <text
            x="50%"
            y="65%"
            textAnchor="middle"
            dominantBaseline="middle"
            className={`${baseClass}__label-text`}
            fill="var(--text-color-secondary)"
          >
            {label}
          </text>
        )}
      </g>
    );
  };
  
  return (
    <div className={classes} {...rest}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={180}
            endAngle={0}
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="var(--chart-empty-color)" />
          </Pie>
          
          {/* Render the needle */}
          <Pie
            data={[{ name: 'needle', value: 1 }]}
            cx="50%"
            cy="50%"
            startAngle={180 - (percentage * 1.8)}
            endAngle={180 - (percentage * 1.8)}
            innerRadius="0%"
            outerRadius="80%"
            stroke="var(--text-color-primary)"
            strokeWidth={2}
            dataKey="value"
            fill="none"
          />
          
          {/* Custom text label */}
          {renderCustomizedLabel()}
        </PieChart>
      </ResponsiveContainer>
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