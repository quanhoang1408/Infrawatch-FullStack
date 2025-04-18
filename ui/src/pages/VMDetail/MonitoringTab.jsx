import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../components/common/Card';
import Spinner from '../../components/common/Spinner';
import ErrorState from '../../components/common/ErrorState';
import SimpleTimeRangeSelector from '../../components/charts/SimpleTimeRangeSelector';
import LineChart from '../../components/charts/LineChart';
import AreaChart from '../../components/charts/AreaChart';
import GaugeChart from '../../components/charts/GaugeChart';
import { useInterval } from '../../hooks/useInterval';
import { useVM } from '../../hooks/useVM';
import { useSSEContext } from '../../context/SSEContext';
import monitoringService from '../../services/monitoring.service';
import { formatBytes, formatPercentage } from '../../utils/format.utils';

const MonitoringTab = ({ vmId }) => {
  const { getVMMetrics, loading, error } = useVM();
  const { connected: sseConnected, getLatestMonitoringUpdate } = useSSEContext();

  const [timeRange, setTimeRange] = useState('1h');
  const [metrics, setMetrics] = useState(null);
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

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

  // Fetch monitoring data from API
  const fetchMonitoringData = useCallback(async () => {
    try {
      const data = await monitoringService.getMonitoringData(vmId, { timeRange });
      setMetrics(data);
      setLastUpdateTime(new Date());
    } catch (err) {
      console.error('Error fetching VM metrics:', err);
    }
  }, [vmId, timeRange]);

  // Fetch initial metrics
  useEffect(() => {
    fetchMonitoringData();
  }, [fetchMonitoringData]);

  // Handle real-time updates from SSE
  useEffect(() => {
    if (!liveUpdates || !sseConnected) return;

    // Check for latest monitoring update from SSE
    const monitoringUpdate = getLatestMonitoringUpdate(vmId);

    if (monitoringUpdate && monitoringUpdate.timestamp) {
      // Only update if we have metrics and the update is newer than our last fetch
      if (metrics && (!lastUpdateTime || new Date(monitoringUpdate.timestamp) > lastUpdateTime)) {
        console.log('Updating metrics from SSE event');

        // Update metrics with the latest data point
        const newData = monitoringUpdate.data;

        // Format the new data point
        const newDataPoint = {
          timestamp: new Date(newData.timestamp),
          value: newData.cpu?.usagePercent || 0
        };

        const newMemoryPoint = {
          timestamp: new Date(newData.timestamp),
          value: newData.memory?.usagePercent || 0,
          total: newData.memory?.totalMB || 0,
          used: newData.memory?.usedMB || 0
        };

        const diskData = Array.isArray(newData.disk) && newData.disk.length > 0
          ? newData.disk[0]
          : newData.disk || {};

        const newDiskPoint = {
          timestamp: new Date(newData.timestamp),
          value: diskData.usagePercent || 0,
          total: diskData.totalGB || 0,
          used: diskData.usedGB || 0,
          path: diskData.path || '/'
        };

        const newNetworkPoint = {
          timestamp: new Date(newData.timestamp),
          sent: newData.network?.bytesSent || 0,
          received: newData.network?.bytesRecv || 0
        };

        // Add new data points to the metrics
        setMetrics(prevMetrics => {
          if (!prevMetrics) return prevMetrics;

          return {
            ...prevMetrics,
            cpu: [...prevMetrics.cpu, newDataPoint],
            memory: [...prevMetrics.memory, newMemoryPoint],
            disk: [...prevMetrics.disk, newDiskPoint],
            network: [...prevMetrics.network, newNetworkPoint]
          };
        });

        setLastUpdateTime(new Date(newData.timestamp));
      }
    }
  }, [vmId, metrics, liveUpdates, sseConnected, getLatestMonitoringUpdate, lastUpdateTime]);

  // Set up polling for live updates (fallback if SSE is not connected)
  useInterval(() => {
    if (!liveUpdates || sseConnected) return;

    fetchMonitoringData();
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
      <div style={{
        padding: '40px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
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

  // Define inline styles
  const styles = {
    monitoringTab: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    },
    monitoringHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem'
    },
    monitoringControls: {
      display: 'flex',
      alignItems: 'center',
      gap: '1.5rem',
      flexWrap: 'wrap'
    },
    sseStatus: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '0.875rem',
      padding: '0.25rem 0.75rem',
      borderRadius: '1rem',
      backgroundColor: 'rgba(0, 0, 0, 0.1)'
    },
    sseStatusConnected: {
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      color: '#4CAF50'
    },
    sseStatusDisconnected: {
      backgroundColor: 'rgba(255, 152, 0, 0.1)',
      color: '#FF9800'
    },
    statusIndicator: {
      display: 'inline-block',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      marginRight: '0.5rem'
    },
    liveUpdatesToggle: {
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer'
    },
    lastUpdateTime: {
      fontSize: '0.875rem',
      color: '#666'
    },
    gaugeChartsContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px'
    },
    gaugeChartItem: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center'
    },
    gaugeValue: {
      marginTop: '8px',
      fontSize: '1.25rem',
      fontWeight: 'bold'
    },
    chartsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '20px'
    },
    dualChart: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px'
    },
    chartHalf: {
      display: 'flex',
      flexDirection: 'column'
    }
  };

  return (
    <div style={styles.monitoringTab}>
      <div style={styles.monitoringHeader}>
        <SimpleTimeRangeSelector
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

        <div style={styles.monitoringControls}>
          <div style={{
            ...styles.sseStatus,
            ...(sseConnected ? styles.sseStatusConnected : styles.sseStatusDisconnected)
          }}>
            <span style={{
              ...styles.statusIndicator,
              backgroundColor: sseConnected ? '#4CAF50' : '#FF9800'
            }}></span>
            {sseConnected ? 'Real-time' : 'Polling'}
          </div>

          <label style={styles.liveUpdatesToggle}>
            <input
              type="checkbox"
              checked={liveUpdates}
              onChange={toggleLiveUpdates}
              style={{ marginRight: '0.5rem' }}
            />
            Live Updates
          </label>

          {lastUpdateTime && (
            <div style={styles.lastUpdateTime}>
              Last updated: {lastUpdateTime.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      <div>
        <Card title="Current Resource Usage">
          <div style={styles.gaugeChartsContainer}>
            <div style={styles.gaugeChartItem}>
              <GaugeChart
                value={currentUsage.cpu}
                maxValue={100}
                label="CPU"
                unit="%"
                color="#2196F3"
              />
              <div style={styles.gaugeValue}>
                {formatPercentage(currentUsage.cpu)}
              </div>
            </div>

            <div style={styles.gaugeChartItem}>
              <GaugeChart
                value={currentUsage.memory}
                maxValue={100}
                label="Memory"
                unit="%"
                color="#4CAF50"
              />
              <div style={styles.gaugeValue}>
                {formatPercentage(currentUsage.memory)}
              </div>
            </div>

            <div style={styles.gaugeChartItem}>
              <GaugeChart
                value={currentUsage.disk}
                maxValue={100}
                label="Disk"
                unit="%"
                color="#FF9800"
              />
              <div style={styles.gaugeValue}>
                {formatPercentage(currentUsage.disk)}
              </div>
            </div>

            <div style={styles.gaugeChartItem}>
              <GaugeChart
                value={currentUsage.network / 1000000} // Convert to Mbps
                maxValue={1000} // Assume 1 Gbps maximum
                label="Network"
                unit="Mbps"
                color="#9C27B0"
              />
              <div style={styles.gaugeValue}>
                {formatBytes(currentUsage.network)}/s
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div style={styles.chartsGrid}>
        <Card title="CPU Usage">
          <LineChart
            data={metrics.cpu}
            series={[{ dataKey: 'value', name: 'CPU Usage' }]}
            xAxisDataKey="timestamp"
            yAxisLabel="%"
            stroke="#2196F3"
            yDomain={[0, 100]}
          />
        </Card>

        <Card title="Memory Usage">
          <AreaChart
            data={metrics.memory}
            series={[{ dataKey: 'value', name: 'Memory Usage' }]}
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
            series={[{ dataKey: 'value', name: 'Disk Usage' }]}
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
            series={[{ dataKey: 'sent', name: 'Sent' }, { dataKey: 'received', name: 'Received' }]}
            xAxisDataKey="timestamp"
            yAxisLabel="Bytes/s"
            stroke="#9C27B0"
          />
        </Card>
      </div>

      {metrics.diskIo && (
        <Card title="Disk I/O">
          <div style={styles.dualChart}>
            <div style={styles.chartHalf}>
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
            <div style={styles.chartHalf}>
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
          <div style={styles.dualChart}>
            <div style={styles.chartHalf}>
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
            <div style={styles.chartHalf}>
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