import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  StatCard, 
  ProviderDistribution, 
  SystemHealthCard 
} from '../../components/dashboard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common';

/**
 * Component hiển thị phần tổng quan trong Dashboard
 * 
 * @param {Object} props - Props component
 * @param {Object} props.dashboardData - Dữ liệu dashboard
 * @param {Array} props.vms - Danh sách máy ảo
 * @returns {JSX.Element} Component phần tổng quan
 */
const OverviewSection = ({ dashboardData, vms }) => {
  // Tính toán số lượng máy ảo theo trạng thái
  const vmStatuses = useMemo(() => {
    const statuses = {
      running: 0,
      stopped: 0,
      error: 0,
      total: vms.length
    };

    vms.forEach(vm => {
      if (vm.status === 'running') {
        statuses.running += 1;
      } else if (vm.status === 'stopped') {
        statuses.stopped += 1;
      } else if (vm.status === 'error') {
        statuses.error += 1;
      }
    });

    return statuses;
  }, [vms]);

  // Tính toán phân phối máy ảo theo nhà cung cấp
  const providerDistributionData = useMemo(() => {
    const providers = {};
    vms.forEach(vm => {
      providers[vm.provider] = (providers[vm.provider] || 0) + 1;
    });

    return Object.keys(providers).map(key => ({
      name: key,
      value: providers[key],
      color: getProviderColor(key)
    }));
  }, [vms]);

  // Hàm lấy màu cho từng nhà cung cấp
  function getProviderColor(provider) {
    const colors = {
      'AWS': '#FF9900',
      'Azure': '#0089D6',
      'GCP': '#4285F4',
      'VMware': '#607078'
    };
    return colors[provider] || '#888888';
  }

  // Nếu không có dữ liệu
  if (!dashboardData) {
    return (
      <section className="dashboard-section overview-section">
        <div className="section-content loading">
          <p>Đang tải dữ liệu tổng quan...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-section overview-section">
      <h2 className="section-title">Tổng quan hệ thống</h2>
      
      <div className="section-content">
        <div className="stats-grid">
          <StatCard
            title="Tổng số máy ảo"
            value={vmStatuses.total}
            icon="server"
            color="primary"
            trend={{
              value: dashboardData.vmTrend,
              label: "so với tháng trước",
              direction: dashboardData.vmTrend >= 0 ? "up" : "down"
            }}
            linkTo="/vms"
          />
          
          <StatCard
            title="Máy ảo đang chạy"
            value={vmStatuses.running}
            icon="play-circle"
            color="success"
            percentage={vmStatuses.total > 0 ? Math.round((vmStatuses.running / vmStatuses.total) * 100) : 0}
            linkTo="/vms?status=running"
          />
          
          <StatCard
            title="Máy ảo đã dừng"
            value={vmStatuses.stopped}
            icon="stop-circle"
            color="warning"
            percentage={vmStatuses.total > 0 ? Math.round((vmStatuses.stopped / vmStatuses.total) * 100) : 0}
            linkTo="/vms?status=stopped"
          />
          
          <StatCard
            title="Máy ảo lỗi"
            value={vmStatuses.error}
            icon="alert-triangle"
            color="danger"
            percentage={vmStatuses.total > 0 ? Math.round((vmStatuses.error / vmStatuses.total) * 100) : 0}
            linkTo="/vms?status=error"
          />
        </div>

        <div className="overview-charts">
          <Card className="overview-chart-card">
            <CardHeader>
              <CardTitle>Phân bố theo nhà cung cấp</CardTitle>
            </CardHeader>
            <CardContent>
              <ProviderDistribution data={providerDistributionData} />
            </CardContent>
          </Card>

          <Card className="overview-chart-card">
            <CardHeader>
              <CardTitle>Sức khỏe hệ thống</CardTitle>
            </CardHeader>
            <CardContent>
              <SystemHealthCard 
                cpuHealth={dashboardData.systemHealth.cpu}
                memoryHealth={dashboardData.systemHealth.memory}
                diskHealth={dashboardData.systemHealth.disk}
                networkHealth={dashboardData.systemHealth.network}
              />
            </CardContent>
          </Card>
        </div>

        <div className="overview-alerts">
          <Card className="alerts-card">
            <CardHeader>
              <CardTitle>Cảnh báo hệ thống</CardTitle>
              <Link to="/monitoring/alerts" className="view-all-link">
                Xem tất cả
              </Link>
            </CardHeader>
            <CardContent>
              {dashboardData.alerts && dashboardData.alerts.length > 0 ? (
                <ul className="alert-list">
                  {dashboardData.alerts.slice(0, 5).map((alert, index) => (
                    <li key={index} className={`alert-item ${alert.severity}`}>
                      <div className="alert-icon">
                        <i className={`fas fa-${
                          alert.severity === 'critical' 
                            ? 'exclamation-circle' 
                            : alert.severity === 'warning' 
                            ? 'exclamation-triangle' 
                            : 'info-circle'
                        }`}></i>
                      </div>
                      <div className="alert-content">
                        <h4 className="alert-title">{alert.title}</h4>
                        <p className="alert-description">{alert.message}</p>
                        <div className="alert-meta">
                          <span className="alert-time">{new Date(alert.timestamp).toLocaleString()}</span>
                          <span className="alert-source">{alert.source}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-alerts">
                  <i className="fas fa-check-circle"></i>
                  <p>Không có cảnh báo nào.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default OverviewSection;