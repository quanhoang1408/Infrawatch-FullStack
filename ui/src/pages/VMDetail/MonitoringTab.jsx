import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Spinner } from '../../components/common/Spinner';
import { ErrorState } from '../../components/common/ErrorState';
import { TimeRangeSelector } from '../../components/charts/TimeRangeSelector';
import { LineChart } from '../../components/charts/LineChart';
import { AreaChart } from '../../components/charts/AreaChart';
import { GaugeChart } from '../../components/charts/GaugeChart';
import { useInterval } from '../../hooks/useInterval';
import { useVM } from '../../hooks/useVM';
import { formatBytes, formatPercentage } from '../../utils/format.utils';

const MonitoringTab = ({ vmId }) => {
  const { getVMMetrics, loading, error } = useVM();
  
  const [timeRange, setTimeRange] = useState('1h');
  const [metrics, setMetrics] = useState(null);
  const [liveUpdates, setLiveUpdates] = useState(true);
  
  // Define polling intervals based on time range
  const getPollingInterval = () => {
    switch (timeRange) {
      case '15m':
      case '1h':
        return 10000; // 10 seconds
      case '6h':
        return 30000; // 30 seconds
      case '1d':
      case '1w':
        return 60000; // 1 minute
      default:
        return 10000;
    }
  };
  
  // Fetch initial metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await getVMMetrics(vmId, timeRange);
        setMetrics(data);
      } catch (err) {
        console.error('Error fetching VM metrics:', err);
      }
    };
    
    fetchMetrics();
  }, [vmId, timeRange, getVMMetrics]);
  
  // Set up polling for live updates
  useInterval(() => {
    const fetchLatestMetrics = async () => {
      if (!liveUpdates) return;
      
      try {
        const data = await getVMMetrics(vmId, timeRange);
        setMetrics(data);
      } catch (err) {
        console.error('Error updating VM metrics:', err);
      }
    };
    
    fetchLatestMetrics();
  }, getPollingInterval());
  
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };
  
  const toggleLiveUpdates = () => {
    setLiveUpdates(prev => !prev);
  };
  
  // Calculate current resource usage
  const getCurrentUsage = () => {
    if (!metrics || !metrics.cpu || metrics.cpu.length === 0) {
      return {
        cpu: 0,
        memory: 0,
        disk: 0,
        network: 0
      };
    }
    
    return {
      cpu: metrics.cpu[metrics.cpu.length - 1].value,
      memory: metrics.memory[metrics.memory.length - 1].value,
      disk: metrics.disk[metrics.disk.length - 1].value,
      network: metrics.network[metrics.network.length - 1].value
    };
  };
  
  if (loading && !metrics) {
    return (
      <div className="monitoring-loading">
        <Spinner />
        <p>Loading monitoring data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <ErrorState 
        title="Failed to load monitoring data"
        message={error.message}
      />
    );
  }
  
  if (!metrics) {
    return (
      <ErrorState 
        title="No monitoring data available"
        message="Unable to retrieve monitoring data for this virtual machine."
      />
    );
  }
  
  const currentUsage = getCurrentUsage();
  
  return (
    <div className="monitoring-tab">
      <div className="monitoring-header">
        <TimeRangeSelector 
          value={timeRange}
          onChange={handleTimeRangeChange}
          options={[
            { value: '15m', label: '15 Minutes' },
            { value: '1h', label: '1 Hour' },
            { value: '6h', label: '6 Hours' },
            { value: '1d', label: '1 Day' },
            { value: '1w', label: '1 Week' }
          ]}
        />
        
        <label className="live-updates-toggle">
          <input 
            type="checkbox" 
            checked={liveUpdates} 
            onChange={toggleLiveUpdates}
          />
          Live Updates
        </label>
      </div>
      
      <div className="current-usage-section">
        <Card title="Current Resource Usage">
          <div className="gauge-charts-container">
            <div className="gauge-chart-item">
              <GaugeChart 
                value={currentUsage.cpu}
                maxValue={100}
                label="CPU"
                unit="%"
                color="#2196F3"
              />
              <div className="gauge-value">
                {formatPercentage(currentUsage.cpu)}
              </div>
            </div>
            
            <div className="gauge-chart-item">
              <GaugeChart 
                value={currentUsage.memory}
                maxValue={100}
                label="Memory"
                unit="%"
                color="#4CAF50"
              />
              <div className="gauge-value">
                {formatPercentage(currentUsage.memory)}
              </div>
            </div>
            
            <div className="gauge-chart-item">
              <GaugeChart 
                value={currentUsage.disk}
                maxValue={100}
                label="Disk"
                unit="%"
                color="#FF9800"
              />
              <div className="gauge-value">
                {formatPercentage(currentUsage.disk)}
              </div>
            </div>
            
            <div className="gauge-chart-item">
              <GaugeChart 
                value={currentUsage.network / 1000000} // Convert to Mbps
                maxValue={1000} // Assume 1 Gbps maximum
                label="Network"
                unit="Mbps"
                color="#9C27B0"
              />
              <div className="gauge-value">
                {formatBytes(currentUsage.network)}/s
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      <div className="charts-grid">
        <Card title="CPU Usage">
          <LineChart 
            data={metrics.cpu}
            dataKey="value"
            xAxisDataKey="timestamp"
            yAxisLabel="%"
            stroke="#2196F3"
            yDomain={[0, 100]}
          />
        </Card>
        
        <Card title="Memory Usage">
          <AreaChart 
            data={metrics.memory}
            dataKey="value"
            xAxisDataKey="timestamp"
            yAxisLabel="%"
            fill="#4CAF50"
            stroke="#4CAF50"
            fillOpacity={0.3}
            yDomain={[0, 100]}
          />
        </Card>
        
        <Card title="Disk Usage">
          <AreaChart 
            data={metrics.disk}
            dataKey="value"
            xAxisDataKey="timestamp"
            yAxisLabel="%"
            fill="#FF9800"
            stroke="#FF9800"
            fillOpacity={0.3}
            yDomain={[0, 100]}
          />
        </Card>
        
        <Card title="Network Traffic">
          <LineChart 
            data={metrics.network}
            dataKey="value"
            xAxisDataKey="timestamp"
            yAxisLabel="Bytes/s"
            stroke="#9C27B0"
            formatYAxis={(value) => formatBytes(value)}
          />
        </Card>
      </div>
      
      {metrics.diskIo && (
        <Card title="Disk I/O">
          <div className="dual-chart">
            <div className="chart-half">
              <h4>Read</h4>
              <LineChart 
                data={metrics.diskIo.filter(d => d.type === 'read')}
                dataKey="value"
                xAxisDataKey="timestamp"
                yAxisLabel="Bytes/s"
                stroke="#00BCD4"
                formatYAxis={(value) => formatBytes(value)}
              />
            </div>
            <div className="chart-half">
              <h4>Write</h4>
              <LineChart 
                data={metrics.diskIo.filter(d => d.type === 'write')}
                dataKey="value"
                xAxisDataKey="timestamp"
                yAxisLabel="Bytes/s"
                stroke="#FF5722"
                formatYAxis={(value) => formatBytes(value)}
              />
            </div>
          </div>
        </Card>
      )}
      
      {metrics.networkIo && (
        <Card title="Network I/O">
          <div className="dual-chart">
            <div className="chart-half">
              <h4>In</h4>
              <LineChart 
                data={metrics.networkIo.filter(d => d.type === 'in')}
                dataKey="value"
                xAxisDataKey="timestamp"
                yAxisLabel="Bytes/s"
                stroke="#3F51B5"
                formatYAxis={(value) => formatBytes(value)}
              />
            </div>
            <div className="chart-half">
              <h4>Out</h4>
              <LineChart 
                data={metrics.networkIo.filter(d => d.type === 'out')}
                dataKey="value"
                xAxisDataKey="timestamp"
                yAxisLabel="Bytes/s"
                stroke="#E91E63"
                formatYAxis={(value) => formatBytes(value)}
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MonitoringTab;