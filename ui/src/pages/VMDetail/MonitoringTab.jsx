import React, { useState, useEffect } from 'react';
import { useVM } from '../../hooks';
import { Card, CardHeader, CardTitle, CardContent, Spinner } from '../../components/common';
import { LineChart, AreaChart, GaugeChart } from '../../components/charts';
import { TimeRangeSelector } from '../../components/charts';

/**
 * Component tab giám sát máy ảo
 * 
 * @param {Object} props - Props component
 * @param {Object} props.vm - Thông tin máy ảo
 * @param {number} props.refreshInterval - Thời gian làm mới (ms)
 * @param {Function} props.onRefreshRateChange - Callback khi thay đổi tần suất làm mới
 * @returns {JSX.Element} Component tab giám sát
 */
const MonitoringTab = ({ vm, refreshInterval, onRefreshRateChange }) => {
  const { fetchVMStats, vmStats, loading } = useVM();
  const [timeRange, setTimeRange] = useState('1h');
  const [chartType, setChartType] = useState('line');
  const [metrics, setMetrics] = useState(['cpu', 'memory', 'disk', 'network']);
  
  // Lấy dữ liệu thống kê của VM hiện tại từ context
  const currentStats = vmStats?.[vm.id] || null;

  // Tải dữ liệu thống kê khi timeRange thay đổi
  useEffect(() => {
    fetchVMStats(vm.id, { timeRange, metrics });
  }, [vm.id, timeRange, metrics, fetchVMStats]);

  /**
   * Thay đổi khoảng thời gian hiển thị
   * 
   * @param {string} range - Khoảng thời gian mới
   */
  const handleRangeChange = (range) => {
    setTimeRange(range);
  };

  /**
   * Thay đổi loại biểu đồ
   * 
   * @param {string} type - Loại biểu đồ mới
   */
  const handleChartTypeChange = (type) => {
    setChartType(type);
  };

  /**
   * Định dạng thông tin sử dụng tài nguyên
   * 
   * @param {string} resourceKey - Khóa tài nguyên
   * @param {number} value - Giá trị
   * @returns {string} Giá trị đã định dạng
   */
  const formatResourceUsage = (resourceKey, value) => {
    if (value === undefined || value === null) return 'N/A';
    
    switch (resourceKey) {
      case 'cpu':
        return `${value.toFixed(1)}%`;
      case 'memory':
        return `${value.toFixed(1)}%`;
      case 'disk':
        return `${value.toFixed(1)}%`;
      case 'network':
        return value < 1024 
          ? `${value.toFixed(2)} KB/s` 
          : `${(value / 1024).toFixed(2)} MB/s`;
      default:
        return `${value}`;
    }
  };

  /**
   * Lấy tiêu đề biểu đồ
   * 
   * @param {string} resourceKey - Khóa tài nguyên
   * @returns {string} Tiêu đề biểu đồ
   */
  const getChartTitle = (resourceKey) => {
    switch (resourceKey) {
      case 'cpu': return 'Sử dụng CPU';
      case 'memory': return 'Sử dụng RAM';
      case 'disk': return 'Sử dụng ổ đĩa';
      case 'network': return 'Băng thông mạng';
      default: return resourceKey;
    }
  };

  /**
   * Lấy đơn vị hiển thị
   * 
   * @param {string} resourceKey - Khóa tài nguyên
   * @returns {string} Đơn vị
   */
  const getUnitLabel = (resourceKey) => {
    switch (resourceKey) {
      case 'cpu': return '%';
      case 'memory': return '%';
      case 'disk': return '%';
      case 'network': return 'MB/s';
      default: return '';
    }
  };

  /**
   * Render biểu đồ cho từng loại tài nguyên
   * 
   * @param {string} resourceKey - Khóa tài nguyên
   * @returns {JSX.Element} Component biểu đồ
   */
  const renderResourceChart = (resourceKey) => {
    if (!currentStats || !currentStats[resourceKey] || currentStats[resourceKey].length === 0) {
      return (
        <div className="empty-chart">
          <div className="empty-chart-content">
            <i className="fas fa-chart-line"></i>
            <p>Không có dữ liệu</p>
          </div>
        </div>
      );
    }

    const chartData = currentStats[resourceKey].map(point => ({
      timestamp: new Date(point.timestamp).toLocaleTimeString(),
      value: point.value
    }));

    // Lấy giá trị hiện tại (điểm cuối cùng)
    const currentValue = chartData.length > 0 
      ? chartData[chartData.length - 1].value 
      : 0;

    // Props chung cho các loại biểu đồ
    const commonProps = {
      data: chartData,
      xAxisKey: 'timestamp',
      seriesKeys: ['value'],
      height: 200,
      showLegend: false,
      showTooltip: true,
      showGrid: true,
      yAxisLabel: getUnitLabel(resourceKey)
    };

    // Render loại biểu đồ khác nhau dựa trên chartType
    return (
      <div className="resource-chart">
        <div className="chart-header">
          <div className="current-value">
            <span>Hiện tại:</span>
            <span className="value">{formatResourceUsage(resourceKey, currentValue)}</span>
          </div>
        </div>
        
        <div className="chart-container">
          {chartType === 'line' && <LineChart {...commonProps} />}
          {chartType === 'area' && <AreaChart {...commonProps} />}
          {chartType === 'gauge' && (
            <div className="gauge-chart-container">
              <GaugeChart
                value={currentValue}
                min={0}
                max={resourceKey === 'network' ? 100 : 100}
                height={150}
                label={formatResourceUsage(resourceKey, currentValue)}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="monitoring-tab">
      <div className="monitoring-controls">
        <div className="control-group">
          <TimeRangeSelector 
            value={timeRange}
            onChange={handleRangeChange}
          />
        </div>
        
        <div className="control-group">
          <label>Loại biểu đồ:</label>
          <div className="chart-type-buttons">
            <button 
              className={`chart-type-btn ${chartType === 'line' ? 'active' : ''}`}
              onClick={() => handleChartTypeChange('line')}
            >
              <i className="fas fa-chart-line"></i>
              <span>Line</span>
            </button>
            <button 
              className={`chart-type-btn ${chartType === 'area' ? 'active' : ''}`}
              onClick={() => handleChartTypeChange('area')}
            >
              <i className="fas fa-chart-area"></i>
              <span>Area</span>
            </button>
            <button 
              className={`chart-type-btn ${chartType === 'gauge' ? 'active' : ''}`}
              onClick={() => handleChartTypeChange('gauge')}
            >
              <i className="fas fa-tachometer-alt"></i>
              <span>Gauge</span>
            </button>
          </div>
        </div>
        
        <div className="control-group">
          <label>Tự động làm mới:</label>
          <select 
            value={refreshInterval} 
            onChange={(e) => onRefreshRateChange(Number(e.target.value))}
            className="refresh-select"
          >
            <option value="0">Tắt</option>
            <option value="5000">5 giây</option>
            <option value="10000">10 giây</option>
            <option value="30000">30 giây</option>
            <option value="60000">1 phút</option>
          </select>
        </div>
      </div>

      <div className="charts-grid">
        <Card className="chart-card">
          <CardHeader>
            <CardTitle>{getChartTitle('cpu')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !currentStats ? (
              <div className="chart-loading">
                <Spinner size="medium" />
              </div>
            ) : (
              renderResourceChart('cpu')
            )}
          </CardContent>
        </Card>

        <Card className="chart-card">
          <CardHeader>
            <CardTitle>{getChartTitle('memory')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !currentStats ? (
              <div className="chart-loading">
                <Spinner size="medium" />
              </div>
            ) : (
              renderResourceChart('memory')
            )}
          </CardContent>
        </Card>

        <Card className="chart-card">
          <CardHeader>
            <CardTitle>{getChartTitle('disk')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !currentStats ? (
              <div className="chart-loading">
                <Spinner size="medium" />
              </div>
            ) : (
              renderResourceChart('disk')
            )}
          </CardContent>
        </Card>

        <Card className="chart-card">
          <CardHeader>
            <CardTitle>{getChartTitle('network')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !currentStats ? (
              <div className="chart-loading">
                <Spinner size="medium" />
              </div>
            ) : (
              renderResourceChart('network')
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="performance-insights-card">
        <CardHeader>
          <CardTitle>Phân tích hiệu suất</CardTitle>
        </CardHeader>
        <CardContent>
          {vm.performanceInsights && vm.performanceInsights.length > 0 ? (
            <div className="insights-list">
              {vm.performanceInsights.map((insight, index) => (
                <div key={index} className={`insight-item ${insight.severity}`}>
                  <div className="insight-icon">
                    <i className={`fas fa-${
                      insight.severity === 'critical' 
                        ? 'exclamation-circle' 
                        : insight.severity === 'warning' 
                        ? 'exclamation-triangle' 
                        : 'info-circle'
                    }`}></i>
                  </div>
                  <div className="insight-content">
                    <h4 className="insight-title">{insight.title}</h4>
                    <p className="insight-message">{insight.message}</p>
                    {insight.recommendation && (
                      <div className="recommendation">
                        <strong>Khuyến nghị:</strong> {insight.recommendation}
                      </div>
                    )}
                    <div className="insight-meta">
                      <span>{insight.resourceType}</span>
                      <span>{new Date(insight.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-insights">
              <i className="fas fa-check-circle"></i>
              <p>Không có vấn đề hiệu suất nào được phát hiện</p>
              <p className="hint">Hệ thống đang hoạt động bình thường</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonitoringTab;