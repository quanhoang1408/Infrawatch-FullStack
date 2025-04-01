// VMResourceMonitor.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Card } from '../common';
import { LineChart, AreaChart, TimeRangeSelector } from '../charts';

/**
 * Component to monitor VM resource usage
 * @param {string} vmId - VM ID
 * @param {object} resourceData - Resource usage data
 * @param {boolean} loading - Loading state
 * @param {function} onTimeRangeChange - Handler for time range changes
 */
const VMResourceMonitor = ({
  vmId,
  resourceData = {},
  loading = false,
  onTimeRangeChange,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-vm-resource-monitor';
  const classes = [baseClass, className].filter(Boolean).join(' ');
  
  // Default time range
  const [timeRange, setTimeRange] = useState('24h');
  
  // Handle time range change
  const handleTimeRangeChange = (range) => {
    setTimeRange(range.key);
    onTimeRangeChange?.(range);
  };
  
  // Chart configurations
  const cpuSeries = [
    { dataKey: 'value', name: 'CPU Usage (%)', color: '#1f77b4' }
  ];
  
  const memorySeries = [
    { dataKey: 'value', name: 'Memory Usage (%)', color: '#ff7f0e' }
  ];
  
  const diskSeries = [
    { dataKey: 'read', name: 'Disk Read (KB/s)', color: '#2ca02c' },
    { dataKey: 'write', name: 'Disk Write (KB/s)', color: '#d62728' }
  ];
  
  const networkSeries = [
    { dataKey: 'in', name: 'Network In (KB/s)', color: '#9467bd' },
    { dataKey: 'out', name: 'Network Out (KB/s)', color: '#8c564b' }
  ];
  
  return (
    <Card
      title="Resource Usage"
      className={classes}
      loading={loading}
      actions={
        <TimeRangeSelector
          onChange={handleTimeRangeChange}
          defaultRange={timeRange}
        />
      }
      {...rest}
    >
      <div className={`${baseClass}__charts`}>
        <div className={`${baseClass}__chart-row`}>
          <div className={`${baseClass}__chart-container`}>
            <div className={`${baseClass}__chart-title`}>CPU Usage</div>
            <LineChart
              data={resourceData.cpu || []}
              series={cpuSeries}
              xAxisDataKey="timestamp"
              loading={loading}
              height={200}
              tooltipFormatter={(value) => [`${value}%`, 'CPU Usage']}
            />
          </div>
          
          <div className={`${baseClass}__chart-container`}>
            <div className={`${baseClass}__chart-title`}>Memory Usage</div>
            <LineChart
              data={resourceData.memory || []}
              series={memorySeries}
              xAxisDataKey="timestamp"
              loading={loading}
              height={200}
              tooltipFormatter={(value) => [`${value}%`, 'Memory Usage']}
            />
          </div>
        </div>
        
        <div className={`${baseClass}__chart-row`}>
          <div className={`${baseClass}__chart-container`}>
            <div className={`${baseClass}__chart-title`}>Disk I/O</div>
            <AreaChart
              data={resourceData.disk || []}
              series={diskSeries}
              xAxisDataKey="timestamp"
              loading={loading}
              height={200}
              tooltipFormatter={(value, name) => [`${value} KB/s`, name]}
            />
          </div>
          
          <div className={`${baseClass}__chart-container`}>
            <div className={`${baseClass}__chart-title`}>Network Traffic</div>
            <AreaChart
              data={resourceData.network || []}
              series={networkSeries}
              xAxisDataKey="timestamp"
              loading={loading}
              height={200}
              tooltipFormatter={(value, name) => [`${value} KB/s`, name]}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

VMResourceMonitor.propTypes = {
  vmId: PropTypes.string.isRequired,
  resourceData: PropTypes.shape({
    cpu: PropTypes.array,
    memory: PropTypes.array,
    disk: PropTypes.array,
    network: PropTypes.array
  }),
  loading: PropTypes.bool,
  onTimeRangeChange: PropTypes.func,
  className: PropTypes.string
};

export default VMResourceMonitor;