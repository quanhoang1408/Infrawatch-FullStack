// ResourceUsage.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Card } from '../common';
import { LineChart, TimeRangeSelector } from '../charts';
import './ResourceUsage.scss';

/**
 * Component to display resource usage charts (CPU, RAM, Network)
 * @param {array} data - Resource usage data
 * @param {boolean} loading - Loading state
 * @param {function} onTimeRangeChange - Handler for time range changes
 */
const ResourceUsage = ({
  data = [],
  loading = false,
  onTimeRangeChange,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-resource-usage';
  const classes = [baseClass, className].filter(Boolean).join(' ');
  
  // State for selected time range
  const [timeRange, setTimeRange] = useState('24h');
  
  const handleTimeRangeChange = (range) => {
    setTimeRange(range.key);
    onTimeRangeChange?.(range);
  };
  
  // CPU usage chart configuration
  const cpuSeries = [
    { dataKey: 'cpuUsage', name: 'CPU Usage (%)', color: '#1f77b4' }
  ];
  
  // Memory usage chart configuration
  const memorySeries = [
    { dataKey: 'memoryUsage', name: 'Memory Usage (%)', color: '#ff7f0e' }
  ];
  
  // Network chart configuration
  const networkSeries = [
    { dataKey: 'networkIn', name: 'Network In (KB/s)', color: '#2ca02c' },
    { dataKey: 'networkOut', name: 'Network Out (KB/s)', color: '#d62728' }
  ];
  
  return (
    <Card 
      title="Resource Usage"
      className={classes}
      actions={
        <TimeRangeSelector
          onChange={handleTimeRangeChange}
          defaultRange={timeRange}
        />
      }
      {...rest}
    >
      <div className={`${baseClass}__charts`}>
        <div className={`${baseClass}__chart-container`}>
          <div className={`${baseClass}__chart-title`}>CPU Usage</div>
          <div className={`${baseClass}__chart`}>
            <LineChart
              data={data}
              series={cpuSeries}
              xAxisDataKey="timestamp"
              loading={loading}
              height={200}
              tooltipFormatter={(value) => [`${value}%`, 'CPU Usage']}
            />
          </div>
        </div>
        
        <div className={`${baseClass}__chart-container`}>
          <div className={`${baseClass}__chart-title`}>Memory Usage</div>
          <div className={`${baseClass}__chart`}>
            <LineChart
              data={data}
              series={memorySeries}
              xAxisDataKey="timestamp"
              loading={loading}
              height={200}
              tooltipFormatter={(value) => [`${value}%`, 'Memory Usage']}
            />
          </div>
        </div>
        
        <div className={`${baseClass}__chart-container`}>
          <div className={`${baseClass}__chart-title`}>Network Traffic</div>
          <div className={`${baseClass}__chart`}>
            <LineChart
              data={data}
              series={networkSeries}
              xAxisDataKey="timestamp"
              loading={loading}
              height={200}
              tooltipFormatter={(value, name) => {
                return [`${value} KB/s`, name];
              }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

ResourceUsage.propTypes = {
  data: PropTypes.array,
  loading: PropTypes.bool,
  onTimeRangeChange: PropTypes.func,
  className: PropTypes.string
};

export default ResourceUsage;