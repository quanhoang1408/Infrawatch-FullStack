
// PieChart.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import ChartTooltip from './ChartTooltip';
import ChartLegend from './ChartLegend';
import Spinner from '../common/Spinner';
import EmptyState from '../common/EmptyState';
import '../styles/components/charts/PieChart.scss';

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
  const baseClass = 'iw-pie-chart';
  const classes = [baseClass, className].filter(Boolean).join(' ');
  
  // Default colors if not provided
  const defaultColors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];
  const pieColors = colors || defaultColors;
  
  // Calculate inner and outer radius based on donut prop
  const outerRadius = "70%";
  const innerRadius = donut ? "50%" : 0;
  
  // Calculate total value for percentage
  const total = useMemo(() => {
    return data.reduce((sum, item) => sum + (Number(item[dataKey]) || 0), 0);
  }, [data, dataKey]);
  
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
  
  // Custom tooltip formatter that includes percentages
  const defaultTooltipFormatter = (value, name) => {
    const percentage = ((value / total) * 100).toFixed(1);
    return [`${value} (${percentage}%)`, name];
  };
  
  const finalTooltipFormatter = tooltipFormatter || defaultTooltipFormatter;
  
  return (
    <div className={classes} {...rest}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            paddingAngle={2}
            label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={pieColors[index % pieColors.length]} 
              />
            ))}
          </Pie>
          
          <Tooltip 
            content={<ChartTooltip formatter={finalTooltipFormatter} />} 
          />
          
          {legend && (
            <Legend 
              content={<ChartLegend vertical data={data} colors={pieColors} />} 
              layout="vertical"
              align="right"
              verticalAlign="middle"
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
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