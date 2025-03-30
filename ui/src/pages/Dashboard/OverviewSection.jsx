import React from 'react';
import { Row, Col, Card, Statistic, Space, Button, Tooltip, Switch } from 'antd';
import { 
  CloudServerOutlined, 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  ReloadOutlined,
  AmazonOutlined,
  WindowsOutlined,
  GoogleOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

/**
 * Overview section component for dashboard
 * 
 * @param {Object} props - Component props
 * @param {Object} props.stats - Statistics data
 * @param {Function} props.onRefresh - Refresh callback
 * @param {Date} props.lastRefresh - Last refresh time
 * @param {boolean} props.autoRefresh - Auto refresh state
 * @param {Function} props.onAutoRefreshChange - Auto refresh change callback
 */
const OverviewSection = ({ 
  stats, 
  onRefresh, 
  lastRefresh, 
  autoRefresh, 
  onAutoRefreshChange 
}) => {
  // Get provider icon
  const getProviderIcon = (provider) => {
    switch (provider) {
      case 'AWS':
        return <AmazonOutlined />;
      case 'Azure':
        return <WindowsOutlined />;
      case 'GCP':
        return <GoogleOutlined />;
      case 'VMware':
        return <AppstoreOutlined />;
      default:
        return <CloudServerOutlined />;
    }
  };

  // Format last refresh time
  const formatLastRefresh = () => {
    return dayjs(lastRefresh).format('HH:mm:ss');
  };

  return (
    <div className="overview-section">
      <Card
        title="Tổng quan hệ thống"
        extra={
          <Space>
            <span>Cập nhật lúc: {formatLastRefresh()}</span>
            <Tooltip title="Tự động cập nhật">
              <Switch 
                checked={autoRefresh} 
                onChange={onAutoRefreshChange} 
                size="small" 
              />
            </Tooltip>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={onRefresh}
              size="small"
            >
              Làm mới
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic
                title="Tổng số máy ảo"
                value={stats.totalVMs}
                prefix={<CloudServerOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic
                title="Đang chạy"
                value={stats.runningVMs}
                prefix={<PlayCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic
                title="Đã tắt"
                value={stats.stoppedVMs}
                prefix={<PauseCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic
                title="CPU trung bình"
                value={stats.avgCPU || 0}
                suffix="%"
                precision={1}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card title="Phân bố theo nhà cung cấp" size="small" className="provider-card">
              <Row gutter={[16, 16]}>
                {Object.entries(stats.providers || {}).map(([provider, count]) => (
                  <Col xs={12} sm={6} key={provider}>
                    <Card size="small" className="provider-stat-card">
                      <Statistic
                        title={provider}
                        value={count}
                        prefix={getProviderIcon(provider)}
                        valueStyle={{ fontSize: '1.5rem' }}
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default OverviewSection;