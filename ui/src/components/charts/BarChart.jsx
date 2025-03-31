// BarChart.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import ChartTooltip from './ChartTooltip';
import ChartLegend from './ChartLegend';
import Spinner from '../common/Spinner';
import EmptyState from '../common/EmptyState';
import '../styles/components/charts/BarChart.scss';

/**
 * Bar chart component for comparing values
 * @param {array} data - Chart data
 * @param {array} series - Series configuration
 * @param {string} xAxisDataKey - Data key for X axis
 * @param {string} xAxisLabel - Label for X axis
 * @param {string} yAxisLabel - Label for Y axis
 * @param {boolean} grid - Show grid lines
 * @param {boolean} legend - Show legend
 * @param {boolean} stacked - Stack bars on top of each other
 * @param {boolean} horizontal - Display bars horizontally
 * @param {function} tooltipFormatter - Custom tooltip formatter
 * @param {boolean} loading - Loading state
 * @param {node} emptyStateContent - Content to display when data is empty
 */
const BarChart = ({
  data = [],
  series = [],
  xAxisDataKey = 'name',
  xAxisLabel,
  yAxisLabel,
  grid = true,
  legend = true,
  stacked = false,
  horizontal = false,
  tooltipFormatter,
  loading = false,
  emptyStateContent,
  height = 300,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-bar-chart';
  const classes = [baseClass, className].filter(Boolean).join(' ');
  
  // Generate unique colors for series if not provided
  const seriesWithColors = useMemo(() => {
    const defaultColors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'];
    
    return series.map((item, index) => ({
      ...item,
      color: item.color || defaultColors[index % defaultColors.length]
    }));
  }, [series]);
  
  if (loading) {
    return (
      <div className={`${baseClass}__loading`} style={{ height }}>
        <Spinner size="md" />
      </div>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <div className={`${baseClass}__empty`} style={{ height }}>
        <EmptyState
          title="No data available"
          description={emptyStateContent || "There's no data to display for this chart."}
        />
      </div>
    );
  }
  
  return (
    <div className={classes} {...rest}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
          layout={horizontal ? 'vertical' : 'horizontal'}
        >
          {grid && <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid-color)" />}
          
          {horizontal ? (
            <>
              <XAxis
                type="number"
                tick={{ fill: 'var(--text-color-secondary)', fontSize: 12 }}
                tickLine={{ stroke: 'var(--chart-grid-color)' }}
                axisLine={{ stroke: 'var(--chart-grid-color)' }}
                label={xAxisLabel ? { value: xAxisLabel, position: 'bottom', offset: 10 } : undefined}
              />
              <YAxis
                type="category"
                dataKey={xAxisDataKey}
                tick={{ fill: 'var(--text-color-secondary)', fontSize: 12 }}
                tickLine={{ stroke: 'var(--chart-grid-color)' }}
                axisLine={{ stroke: 'var(--chart-grid-color)' }}
                label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'left' } : undefined}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xAxisDataKey}
                tick={{ fill: 'var(--text-color-secondary)', fontSize: 12 }}
                tickLine={{ stroke: 'var(--chart-grid-color)' }}
                axisLine={{ stroke: 'var(--chart-grid-color)' }}
                label={xAxisLabel ? { value: xAxisLabel, position: 'bottom', offset: 10 } : undefined}
              />
              <YAxis
                tick={{ fill: 'var(--text-color-secondary)', fontSize: 12 }}
                tickLine={{ stroke: 'var(--chart-grid-color)' }}
                axisLine={{ stroke: 'var(--chart-grid-color)' }}
                label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'left' } : undefined}
              />
            </>
          )}
          
          <Tooltip content={<ChartTooltip formatter={tooltipFormatter} />} />
          
          {legend && <Legend content={<ChartLegend />} />}
          
          {seriesWithColors.map((s) => (
            <Bar
              key={s.dataKey}
              dataKey={s.dataKey}
              name={s.name || s.dataKey}
              fill={s.color}
              stackId={stacked ? 'stack' : undefined}
              radius={s.radius || [2, 2, 0, 0]}
              barSize={s.barSize}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

BarChart.propTypes = {
  data: PropTypes.array,
  series: PropTypes.arrayOf(
    PropTypes.shape({
      dataKey: PropTypes.string.isRequired,
      name: PropTypes.string,
      color: PropTypes.string,
      radius: PropTypes.arrayOf(PropTypes.number),
      barSize: PropTypes.number
    })
  ),
  xAxisDataKey: PropTypes.string,
  xAxisLabel: PropTypes.string,
  yAxisLabel: PropTypes.string,
  grid: PropTypes.bool,
  legend: PropTypes.bool,
  stacked: PropTypes.bool,
  horizontal: PropTypes.bool,
  tooltipFormatter: PropTypes.func,
  loading: PropTypes.bool,
  emptyStateContent: PropTypes.node,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  className: PropTypes.string
};

export default BarChart;