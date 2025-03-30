import { useEffect, useState } from 'react';
import { Row, Col, Card, Spin, Alert } from 'antd';
import { useQuery } from 'react-query';
import { getDashboardStats } from '../../services/dashboard.service';
import OverviewSection from './OverviewSection';
import ResourceSection from './ResourceSection';
import ActivitySection from './ActivitySection';
import './Dashboard.scss';

/**
 * Dashboard page component
 */
const Dashboard = () => {
  const { data, isLoading, error, refetch } = useQuery('dashboardStats', getDashboardStats, {
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true
  });

  // Handle auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Update last refresh time
  useEffect(() => {
    if (data) {
      setLastRefresh(new Date());
    }
  }, [data]);

  // Handle refresh click
  const handleRefresh = () => {
    refetch();
    setLastRefresh(new Date());
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="Đang tải dữ liệu dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <Alert
          message="Lỗi khi tải dữ liệu"
          description="Không thể tải dữ liệu dashboard. Vui lòng thử lại sau."
          type="error"
          showIcon
          action={
            <a onClick={handleRefresh}>Thử lại</a>
          }
        />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <OverviewSection 
            stats={data.overview} 
            onRefresh={handleRefresh} 
            lastRefresh={lastRefresh}
            autoRefresh={autoRefresh}
            onAutoRefreshChange={setAutoRefresh}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <ResourceSection usage={data.resources} />
        </Col>
        <Col xs={24} lg={8}>
          <ActivitySection activities={data.activities} />
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;