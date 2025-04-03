import React, { useEffect, useState } from 'react';
import { useVM, useAuth, useTheme, useInterval } from '../../hooks';
import { dashboardService } from '../../services';
import OverviewSection from './OverviewSection';
import ResourceSection from './ResourceSection';
import ActivitySection from './ActivitySection';
import { PageHeader } from '../../components/layout';
import { Spinner, EmptyState, ErrorState } from '../../components/common';
import './Dashboard.scss';

/**
 * Component trang Dashboard chính
 * 
 * @returns {JSX.Element} Component trang Dashboard
 */
const Dashboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { vms, loading: vmsLoading, error: vmsError, fetchVMs } = useVM();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [filterOptions, setFilterOptions] = useState({
    timeRange: '24h',
    providers: [],
    statuses: []
  });

  /**
   * Tải dữ liệu dashboard từ server
   */
  const fetchDashboardData = async () => {
    try {
      const data = await dashboardService.getDashboardData(filterOptions);
      setDashboardData(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Xử lý khi filter thay đổi
   * 
   * @param {Object} newFilters - Các filter mới
   */
  const handleFilterChange = (newFilters) => {
    setFilterOptions(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  /**
   * Làm mới dữ liệu dashboard
   */
  const refreshDashboard = () => {
    setLoading(true);
    Promise.all([fetchVMs(), fetchDashboardData()]);
  };

  // Tải dữ liệu khi component mount hoặc filter thay đổi
  useEffect(() => {
    Promise.all([fetchVMs(), fetchDashboardData()]);
  }, [filterOptions]);

  // Tự động làm mới dữ liệu sau mỗi 5 phút
  useInterval(() => {
    fetchDashboardData();
  }, 300000); // 5 phút = 300.000ms

  // Nếu cả 2 đều đang tải
  if (loading && vmsLoading) {
    return (
      <div className="dashboard-loading">
        <Spinner size="large" />
        <p>Đang tải dữ liệu dashboard...</p>
      </div>
    );
  }

  // Nếu có lỗi
  if (error || vmsError) {
    return (
      <ErrorState 
        title="Không thể tải dữ liệu Dashboard" 
        message={error || vmsError}
        action={{
          label: "Thử lại",
          onClick: refreshDashboard
        }}
      />
    );
  }

  // Nếu không có máy ảo nào
  if (!vmsLoading && vms.length === 0) {
    return (
      <EmptyState
        icon="server"
        title="Chưa có máy ảo nào"
        message="Bạn chưa có máy ảo nào. Tạo máy ảo mới để bắt đầu."
        action={{
          label: "Tạo máy ảo mới",
          to: "/vms/new"
        }}
      />
    );
  }

  return (
    <div className={`dashboard-page ${theme}`}>
      <PageHeader 
        title={`Xin chào, ${user?.fullName || user?.username || 'User'}`}
        subtitle={`Tổng quan hệ thống của bạn - Cập nhật lần cuối: ${lastUpdated.toLocaleTimeString()}`}
        actions={[
          {
            label: "Làm mới",
            icon: "sync",
            onClick: refreshDashboard
          }
        ]}
      />

      <div className="dashboard-filter-bar">
        <div className="filter-group">
          <label>Khoảng thời gian:</label>
          <select 
            value={filterOptions.timeRange} 
            onChange={(e) => handleFilterChange({ timeRange: e.target.value })}
          >
            <option value="1h">1 giờ</option>
            <option value="6h">6 giờ</option>
            <option value="12h">12 giờ</option>
            <option value="24h">24 giờ</option>
            <option value="7d">7 ngày</option>
            <option value="30d">30 ngày</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Nhà cung cấp:</label>
          <div className="provider-checkboxes">
            {['AWS', 'Azure', 'GCP', 'VMware'].map(provider => (
              <label key={provider} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filterOptions.providers.includes(provider)}
                  onChange={(e) => {
                    const newProviders = e.target.checked 
                      ? [...filterOptions.providers, provider]
                      : filterOptions.providers.filter(p => p !== provider);
                    
                    handleFilterChange({ providers: newProviders });
                  }}
                />
                {provider}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <OverviewSection 
          dashboardData={dashboardData} 
          vms={vms} 
        />
        
        <ResourceSection 
          dashboardData={dashboardData} 
          vms={vms}
          timeRange={filterOptions.timeRange}
        />
        
        <ActivitySection 
          dashboardData={dashboardData}
          vms={vms}
        />
      </div>
    </div>
  );
};

export default Dashboard;