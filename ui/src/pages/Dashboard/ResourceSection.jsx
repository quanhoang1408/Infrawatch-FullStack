import React, { useState, useMemo } from 'react';
import { ResourceUsage } from '../../components/dashboard';
import { Card, CardHeader, CardTitle, CardContent, Tabs } from '../../components/common';
import { LineChart, AreaChart, BarChart } from '../../components/charts';

/**
 * Component hiển thị phần tài nguyên trong Dashboard
 * 
 * @param {Object} props - Props component
 * @param {Object} props.dashboardData - Dữ liệu dashboard
 * @param {Array} props.vms - Danh sách máy ảo
 * @param {string} props.timeRange - Khoảng thời gian
 * @returns {JSX.Element} Component phần tài nguyên
 */
const ResourceSection = ({ dashboardData, vms, timeRange }) => {
  const [selectedResource, setSelectedResource] = useState('cpu');
  const [selectedVMs, setSelectedVMs] = useState([]);
  const [chartType, setChartType] = useState('line');

  // Tính toán dữ liệu cho biểu đồ tổng hợp
  const aggregatedData = useMemo(() => {
    if (!dashboardData || !dashboardData.resourceUsage) {
      return [];
    }

    return dashboardData.resourceUsage[selectedResource] || [];
  }, [dashboardData, selectedResource]);

  // Tính toán dữ liệu cho biểu đồ chi tiết
  const detailedData = useMemo(() => {
    if (!dashboardData || !dashboardData.vmResourceUsage || selectedVMs.length === 0) {
      return [];
    }

    // Lấy dữ liệu của các VM được chọn
    const filtered = {};
    selectedVMs.forEach(vmId => {
      const vmData = dashboardData.vmResourceUsage[vmId];
      if (vmData && vmData[selectedResource]) {
        filtered[vmId] = vmData[selectedResource];
      }
    });

    // Chuyển đổi dữ liệu sang định dạng cho biểu đồ
    const result = [];
    const timestamps = new Set();
    
    // Thu thập tất cả các mốc thời gian
    Object.values(filtered).forEach(data => {
      data.forEach(point => {
        timestamps.add(point.timestamp);
      });
    });
    
    // Sắp xếp các mốc thời gian
    const sortedTimestamps = Array.from(timestamps).sort();
    
    // Tạo dữ liệu cho mỗi mốc thời gian
    sortedTimestamps.forEach(timestamp => {
      const dataPoint = { timestamp: new Date(timestamp).toLocaleString() };
      
      selectedVMs.forEach(vmId => {
        const vmName = vms.find(vm => vm.id === vmId)?.name || vmId;
        const pointData = filtered[vmId]?.find(point => point.timestamp === timestamp);
        dataPoint[vmName] = pointData ? pointData.value : null;
      });
      
      result.push(dataPoint);
    });
    
    return result;
  }, [dashboardData, selectedVMs, selectedResource, vms]);

  // Lấy tên máy ảo từ ID
  const getVMName = (vmId) => {
    const vm = vms.find(vm => vm.id === vmId);
    return vm ? vm.name : vmId;
  };

  // Xử lý khi chọn/bỏ chọn máy ảo
  const handleVMToggle = (vmId) => {
    setSelectedVMs(prev => {
      if (prev.includes(vmId)) {
        return prev.filter(id => id !== vmId);
      } else {
        return [...prev, vmId];
      }
    });
  };

  // Nếu không có dữ liệu
  if (!dashboardData || !dashboardData.resourceUsage) {
    return (
      <section className="dashboard-section resource-section">
        <div className="section-content loading">
          <p>Đang tải dữ liệu tài nguyên...</p>
        </div>
      </section>
    );
  }

  // Tạo các tab tài nguyên
  const resourceTabs = [
    { id: 'cpu', label: 'CPU', icon: 'cpu' },
    { id: 'memory', label: 'Bộ nhớ', icon: 'database' },
    { id: 'disk', label: 'Ổ đĩa', icon: 'hard-drive' },
    { id: 'network', label: 'Mạng', icon: 'wifi' }
  ];

  // Chọn loại biểu đồ
  const renderChart = () => {
    const commonProps = {
      data: detailedData.length > 0 ? detailedData : aggregatedData,
      xAxisKey: 'timestamp',
      height: 300,
      showLegend: true,
      showTooltip: true,
      showGrid: true
    };

    const seriesKeys = detailedData.length > 0 
      ? selectedVMs.map(vmId => getVMName(vmId)) 
      : ['value'];

    switch (chartType) {
      case 'area':
        return <AreaChart {...commonProps} seriesKeys={seriesKeys} />;
      case 'bar':
        return <BarChart {...commonProps} seriesKeys={seriesKeys} />;
      case 'line':
      default:
        return <LineChart {...commonProps} seriesKeys={seriesKeys} />;
    }
  };

  return (
    <section className="dashboard-section resource-section">
      <h2 className="section-title">Sử dụng tài nguyên</h2>
      
      <div className="section-content">
        <div className="resource-usage-overview">
          <ResourceUsage 
            cpuUsage={dashboardData.systemResourceUsage.cpu}
            memoryUsage={dashboardData.systemResourceUsage.memory}
            diskUsage={dashboardData.systemResourceUsage.disk}
            networkUsage={dashboardData.systemResourceUsage.network}
          />
        </div>

        <Card className="resource-chart-card">
          <CardHeader>
            <CardTitle>Biểu đồ sử dụng tài nguyên</CardTitle>
            <div className="chart-controls">
              <div className="chart-type-selector">
                <button 
                  className={`chart-type-btn ${chartType === 'line' ? 'active' : ''}`}
                  onClick={() => setChartType('line')}
                >
                  <i className="fas fa-chart-line"></i>
                </button>
                <button 
                  className={`chart-type-btn ${chartType === 'area' ? 'active' : ''}`}
                  onClick={() => setChartType('area')}
                >
                  <i className="fas fa-chart-area"></i>
                </button>
                <button 
                  className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
                  onClick={() => setChartType('bar')}
                >
                  <i className="fas fa-chart-bar"></i>
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="resource-tabs-container">
              <Tabs 
                tabs={resourceTabs}
                activeTab={selectedResource}
                onChange={setSelectedResource}
              />
              
              <div className="chart-container">
                {renderChart()}
              </div>
              
              <div className="vm-selector">
                <h4>Chọn máy ảo để xem chi tiết:</h4>
                <div className="vm-checkboxes">
                  {vms.map((vm) => (
                    <label key={vm.id} className="vm-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedVMs.includes(vm.id)}
                        onChange={() => handleVMToggle(vm.id)}
                      />
                      <span className={`status-indicator ${vm.status}`}></span>
                      {vm.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="resource-insights">
          <Card className="insights-card">
            <CardHeader>
              <CardTitle>Phân tích tài nguyên</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="insights-list">
                {dashboardData.resourceInsights.map((insight, index) => (
                  <div key={index} className={`insight-item ${insight.type}`}>
                    <div className="insight-icon">
                      <i className={`fas fa-${
                        insight.type === 'alert' 
                          ? 'exclamation-circle' 
                          : insight.type === 'warning' 
                          ? 'exclamation-triangle' 
                          : 'lightbulb'
                      }`}></i>
                    </div>
                    <div className="insight-content">
                      <h4 className="insight-title">{insight.title}</h4>
                      <p className="insight-description">{insight.description}</p>
                      {insight.recommendation && (
                        <p className="insight-recommendation">
                          <strong>Khuyến nghị:</strong> {insight.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {dashboardData.resourceInsights.length === 0 && (
                  <div className="empty-insights">
                    <i className="fas fa-check-circle"></i>
                    <p>Không có phân tích đáng chú ý.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ResourceSection;