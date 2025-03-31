// SparklineChart.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';
import '../styles/components/charts/SparklineChart.scss';

/**
 * Sparkline chart component for compact trend visualization
 * @param {array} data - Chart data
 * @param {string} dataKey - Data key for the line
 * @param {string} color - Line color
 * @param {boolean} showLastValue - Show the last data point as a dot
 * @param {boolean} showMinMax - Show min and max points
 * @param {boolean} fillBelow - Fill area below the line
 */
const SparklineChart = ({
  data = [],
  dataKey = 'value',
  color = '#1f77b4',
  showLastValue = true,
  showMinMax = false,
  fillBelow = false,
  height = 50,
  width = 120,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-sparkline';
  const classes = [baseClass, className].filter(Boolean).join(' ');
  
  if (!data || data.length === 0) {
    return <div className={`${baseClass}__empty`} style={{ width, height }}></div>;
  }
  
  // Get min and max values for highlighting
  const values = data.map(item => Number(item[dataKey]) || 0);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const lastValue = values[values.length - 1];
  
  // Find indices of min and max values
  const minIndex = values.indexOf(minValue);
  const maxIndex = values.indexOf(maxValue);
  
  return (
    <div className={classes} style={{ width, height }} {...rest}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <YAxis hide domain={['auto', 'auto']} />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
            fill={fillBelow ? color : undefined}
            fillOpacity={fillBelow ? 0.2 : undefined}
          />
          
          {/* Show last value as a dot */}
          {showLastValue && (
            <Line
              type="monotone"
              data={[data[data.length - 1]]}
              dataKey={dataKey}
              stroke={color}
              strokeWidth={0}
              dot={{ r: 3, fill: color, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          )}
          
          {/* Show min and max values */}
          {showMinMax && (
            <>
              <Line
                type="monotone"
                data={[data[minIndex]]}
                dataKey={dataKey}
                stroke="transparent"
                strokeWidth={0}
                dot={{ r: 3, fill: '#d62728', strokeWidth: 0 }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                data={[data[maxIndex]]}
                dataKey={dataKey}
                stroke="transparent"
                strokeWidth={0}
                dot={{ r: 3, fill: '#2ca02c', strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

SparklineChart.propTypes = {
  data: PropTypes.array,
  dataKey: PropTypes.string,
  color: PropTypes.string,
  showLastValue: PropTypes.bool,
  showMinMax: PropTypes.bool,
  fillBelow: PropTypes.bool,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  className: PropTypes.string
};

export default SparklineChart;