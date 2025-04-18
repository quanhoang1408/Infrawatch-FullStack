// AreaChart.jsx - Simplified version for development
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

// Temporarily commented out to avoid dependency errors
// import { ResponsiveContainer, AreaChart as RechartsAreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
// import ChartTooltip from './ChartTooltip';
// import ChartLegend from './ChartLegend';
// import Spinner from '../common/Spinner';
// import EmptyState from '../common/EmptyState';
// import '../styles/components/charts/AreaChart.scss';

/**
 * Area chart component for showing trends and proportions
 * @param {array} data - Chart data
 * @param {array} series - Series configuration
 * @param {string} xAxisDataKey - Data key for X axis
 * @param {string} xAxisLabel - Label for X axis
 * @param {string} yAxisLabel - Label for Y axis
 * @param {boolean} grid - Show grid lines
 * @param {boolean} legend - Show legend
 * @param {boolean} stacked - Stack areas on top of each other
 * @param {function} tooltipFormatter - Custom tooltip formatter
 * @param {boolean} loading - Loading state
 * @param {node} emptyStateContent - Content to display when data is empty
 */
const AreaChart = ({
  data = [],
  series = [],
  xAxisDataKey = 'name',
  xAxisLabel,
  yAxisLabel,
  grid = true,
  legend = true,
  stacked = false,
  tooltipFormatter,
  loading = false,
  emptyStateContent,
  height = 300,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-area-chart';
  const classes = [baseClass, className].filter(Boolean).join(' ');

  // Generate unique colors for series if not provided
  const seriesWithColors = useMemo(() => {
    const defaultColors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'];

    return series.map((item, index) => ({
      ...item,
      color: item.color || defaultColors[index % defaultColors.length],
      fillOpacity: item.fillOpacity || 0.6
    }));
  }, [series]);

  // Simplified implementation for development
  return (
    <div className="area-chart-placeholder" style={{
      height: height || 300,
      background: '#f5f5f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      padding: '20px',
      borderRadius: '4px'
    }}>
      <h3 style={{ margin: '0 0 10px 0' }}>AreaChart Placeholder</h3>
      <p>{data?.length || 0} data points</p>
      {data && data.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <p>Latest value: {data[data.length - 1]?.[series?.[0]?.dataKey || 'value']}</p>
        </div>
      )}
    </div>
  );
};

AreaChart.propTypes = {
  data: PropTypes.array,
  series: PropTypes.arrayOf(
    PropTypes.shape({
      dataKey: PropTypes.string.isRequired,
      name: PropTypes.string,
      color: PropTypes.string,
      fillOpacity: PropTypes.number
    })
  ),
  xAxisDataKey: PropTypes.string,
  xAxisLabel: PropTypes.string,
  yAxisLabel: PropTypes.string,
  grid: PropTypes.bool,
  legend: PropTypes.bool,
  stacked: PropTypes.bool,
  tooltipFormatter: PropTypes.func,
  loading: PropTypes.bool,
  emptyStateContent: PropTypes.node,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  className: PropTypes.string
};

export default AreaChart;