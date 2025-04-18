// PieChart.jsx - Simplified version for development
import React from 'react';
import PropTypes from 'prop-types';
// import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
// import ChartTooltip from './ChartTooltip';
// import ChartLegend from './ChartLegend';
// import Spinner from '../common/Spinner';
// import EmptyState from '../common/EmptyState';
// import '../styles/components/charts/PieChart.scss';

/**
 * Pie chart component for showing proportions
 * @param {array} data - Chart data
 * @param {string} dataKey - Key for values
 * @param {string} nameKey - Key for segment names
 * @param {array} colors - Custom colors for segments
 * @param {boolean} donut - Render as donut chart
 * @param {boolean} legend - Show legend
 * @param {function} tooltipFormatter - Custom tooltip formatter
 * @param {boolean} loading - Loading state
 * @param {node} emptyStateContent - Content to display when data is empty
 */
const PieChart = ({
  data = [],
  dataKey = 'value',
  nameKey = 'name',
  colors,
  donut = false,
  legend = true,
  tooltipFormatter,
  loading = false,
  emptyStateContent,
  height = 300,
  className = '',
  ...rest
}) => {
  // Default colors if not provided
  const defaultColors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];

  // Calculate total value
  const total = data.reduce((sum, item) => sum + (Number(item[dataKey]) || 0), 0);

  // Simplified implementation for development
  return (
    <div
      className={`pie-chart ${className}`}
      style={{
        height: height,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      {...rest}
    >
      <div
        style={{
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          position: 'relative',
          overflow: 'hidden',
          background: '#f5f5f5'
        }}
      >
        {data && data.length > 0 ? (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {data.map((item, index) => {
              const percentage = total > 0 ? (item[dataKey] / total) * 100 : 0;
              const color = colors ? colors[index % colors.length] : defaultColors[index % defaultColors.length];

              // Create a simple pie slice using conic-gradient
              return (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: `conic-gradient(${color} 0% ${percentage}%, transparent ${percentage}% 100%)`,
                    transform: `rotate(${index > 0 ? data.slice(0, index).reduce((sum, d) => sum + (d[dataKey] / total) * 360, 0) : 0}deg)`
                  }}
                />
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            No data available
          </div>
        )}
      </div>

      {data && data.length > 0 && (
        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          {data.map((item, index) => {
            const percentage = total > 0 ? (item[dataKey] / total) * 100 : 0;
            const color = colors ? colors[index % colors.length] : defaultColors[index % defaultColors.length];

            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: color,
                    borderRadius: '2px'
                  }}
                />
                <span style={{ fontSize: '0.875rem' }}>
                  {item[nameKey]} ({percentage.toFixed(1)}%)
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

PieChart.propTypes = {
  data: PropTypes.array,
  dataKey: PropTypes.string,
  nameKey: PropTypes.string,
  colors: PropTypes.array,
  donut: PropTypes.bool,
  legend: PropTypes.bool,
  tooltipFormatter: PropTypes.func,
  loading: PropTypes.bool,
  emptyStateContent: PropTypes.node,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  className: PropTypes.string
};

export default PieChart;