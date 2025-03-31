// AreaChart.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { ResponsiveContainer, AreaChart as RechartsAreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import ChartTooltip from './ChartTooltip';
import ChartLegend from './ChartLegend';
import Spinner from '../common/Spinner';
import EmptyState from '../common/EmptyState';
import '../styles/components/charts/AreaChart.scss';

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
        <RechartsAreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
        >
          {grid && <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid-color)" />}
          
          <XAxis
            dataKey={xAxisDataKey}
            label={xAxisLabel ? { value: xAxisLabel, position: 'bottom', offset: 10 } : undefined}
            tick={{ fill: 'var(--text-color-secondary)', fontSize: 12 }}
            tickLine={{ stroke: 'var(--chart-grid-color)' }}
            axisLine={{ stroke: 'var(--chart-grid-color)' }}
          />
          
          <YAxis
            label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'left' } : undefined}
            tick={{ fill: 'var(--text-color-secondary)', fontSize: 12 }}
            tickLine={{ stroke: 'var(--chart-grid-color)' }}
            axisLine={{ stroke: 'var(--chart-grid-color)' }}
          />
          
          <Tooltip content={<ChartTooltip formatter={tooltipFormatter} />} />
          
          {legend && <Legend content={<ChartLegend />} />}
          
          {seriesWithColors.map((s) => (
            <Area
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              name={s.name || s.dataKey}
              stroke={s.color}
              fill={s.color}
              fillOpacity={s.fillOpacity}
              strokeWidth={2}
              stackId={stacked ? 'stack' : undefined}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
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