import React, { useState } from 'react';
import { Card, Tabs, Radio, Progress, Empty, Space } from 'antd';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import dayjs from 'dayjs';

const { TabPane } = Tabs;

/**
 * Resource section component for dashboard
 * 
 * @param {Object} props - Component props
 * @param {Object} props.usage - Resource usage data
 */
const ResourceSection = ({ usage }) => {
  const [timeRange, setTimeRange] = useState('1h');

  // Format timestamp for chart
  const formatTimestamp = (timestamp) => {
    return dayjs(timestamp).format('HH:mm');
  };

  // Format time range for display
  const formatTimeRangeLabel = (range) => {
    switch (range) {
      case '1h':
        return '1 giờ qua';
      case '6h':
        return '6 giờ qua';
      case '24h':
        return '24 giờ qua';
      case '7d':
        return '7 ngày qua';
      default:
        return range;
    }
  };

  // Get progress status based on value
  const getProgressStatus = (value) => {
    if (value >= 90) return 'exception';
    if (value >= 70) return 'warning';
    return 'normal';
  };

  return (
    <Card 
      title="Sử dụng tài nguyên"
      className="resource-section"
      extra={
        <Radio.Group 
          value={timeRange} 
          onChange={e => setTimeRange(e.target.value)}
          size="small"
        >
          <Radio.Button value="1h">1 giờ</Radio.Button>
          <Radio.Button value="6h">6 giờ</Radio.Button>
          <Radio.Button value="24h">24 giờ</Radio.Button>
          <Radio.Button value="7d">7 ngày</Radio.Button>
        </Radio.Group>
      }
    >
      <Tabs defaultActiveKey="cpu">
        <TabPane tab="CPU" key="cpu">
          <div className="resource-chart-container">
            <div className="resource-summary">
              <span className="resource-label">Trung bình:</span>
              <Progress 
                percent={usage?.cpu?.average || 0} 
                status={getProgressStatus(usage?.cpu?.average || 0)}
              />
            </div>
            
            {usage?.cpu?.data && usage.cpu.data.length > 0 ? (
              <div className="resource-chart">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={usage.cpu.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      tickFormatter={formatTimestamp}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} />
                    <RechartsTooltip 
                      formatter={(value) => [`${value}%`, 'CPU']}
                      labelFormatter={(time) => dayjs(time).format('DD/MM/YYYY HH:mm:ss')}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#1890ff" 
                      name="CPU" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty description="Không có dữ liệu" />
            )}
          </div>
        </TabPane>
        
        <TabPane tab="RAM" key="ram">
          <div className="resource-chart-container">
            <div className="resource-summary">
              <span className="resource-label">Trung bình:</span>
              <Progress 
                percent={usage?.ram?.average || 0} 
                status={getProgressStatus(usage?.ram?.average || 0)}
              />
            </div>
            
            {usage?.ram?.data && usage.ram.data.length > 0 ? (
              <div className="resource-chart">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={usage.ram.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      tickFormatter={formatTimestamp}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} />
                    <RechartsTooltip 
                      formatter={(value) => [`${value}%`, 'RAM']}
                      labelFormatter={(time) => dayjs(time).format('DD/MM/YYYY HH:mm:ss')}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#52c41a" 
                      name="RAM" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty description="Không có dữ liệu" />
            )}
          </div>
        </TabPane>
        
        <TabPane tab="Disk" key="disk">
          <div className="resource-chart-container">
            <div className="resource-summary">
              <span className="resource-label">Trung bình:</span>
              <Progress 
                percent={usage?.disk?.average || 0} 
                status={getProgressStatus(usage?.disk?.average || 0)}
              />
            </div>
            
            {usage?.disk?.data && usage.disk.data.length > 0 ? (
              <div className="resource-chart">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={usage.disk.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      tickFormatter={formatTimestamp}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} />
                    <RechartsTooltip 
                      formatter={(value) => [`${value}%`, 'Disk']}
                      labelFormatter={(time) => dayjs(time).format('DD/MM/YYYY HH:mm:ss')}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#faad14" 
                      name="Disk" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty description="Không có dữ liệu" />
            )}
          </div>
        </TabPane>
        
        <TabPane tab="Network" key="network">
          <div className="resource-chart-container">
            <div className="resource-summary">
              <span className="resource-label">Trung bình:</span>
              <Progress 
                percent={usage?.network?.average || 0} 
                status={getProgressStatus(usage?.network?.average || 0)}
              />
            </div>
            
            {usage?.network?.data && usage.network.data.length > 0 ? (
              <div className="resource-chart">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={usage.network.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      tickFormatter={formatTimestamp}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} />
                    <RechartsTooltip 
                      formatter={(value) => [`${value}%`, 'Network']}
                      labelFormatter={(time) => dayjs(time).format('DD/MM/YYYY HH:mm:ss')}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#722ed1" 
                      name="Network" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty description="Không có dữ liệu" />
            )}
          </div>
        </TabPane>
      </Tabs>
      
      <div className="resource-note">
        <p>Dữ liệu được cập nhật cho khoảng thời gian: {formatTimeRangeLabel(timeRange)}</p>
      </div>
    </Card>
  );
};

export default ResourceSection;