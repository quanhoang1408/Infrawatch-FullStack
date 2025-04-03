import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ActivityList } from '../../components/dashboard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common';

/**
 * Component hiển thị phần hoạt động trong Dashboard
 * 
 * @param {Object} props - Props component
 * @param {Object} props.dashboardData - Dữ liệu dashboard
 * @param {Array} props.vms - Danh sách máy ảo
 * @returns {JSX.Element} Component phần hoạt động
 */
const ActivitySection = ({ dashboardData, vms }) => {
  const [activityFilter, setActivityFilter] = useState('all');
  
  // Lọc hoạt động theo loại
  const filteredActivities = dashboardData?.recentActivities?.filter(activity => {
    if (activityFilter === 'all') return true;
    return activity.type === activityFilter;
  }) || [];

  // Nếu không có dữ liệu
  if (!dashboardData || !dashboardData.recentActivities) {
    return (
      <section className="dashboard-section activity-section">
        <div className="section-content loading">
          <p>Đang tải dữ liệu hoạt động...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-section activity-section">
      <h2 className="section-title">Hoạt động gần đây</h2>
      
      <div className="section-content">
        <Card className="activity-list-card">
          <CardHeader>
            <CardTitle>Hoạt động hệ thống</CardTitle>
            <div className="activity-filters">
              <button 
                className={`filter-btn ${activityFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActivityFilter('all')}
              >
                Tất cả
              </button>
              <button 
                className={`filter-btn ${activityFilter === 'vm' ? 'active' : ''}`}
                onClick={() => setActivityFilter('vm')}
              >
                Máy ảo
              </button>
              <button 
                className={`filter-btn ${activityFilter === 'user' ? 'active' : ''}`}
                onClick={() => setActivityFilter('user')}
              >
                Người dùng
              </button>
              <button 
                className={`filter-btn ${activityFilter === 'system' ? 'active' : ''}`}
                onClick={() => setActivityFilter('system')}
              >
                Hệ thống
              </button>
            </div>
            <Link to="/activities" className="view-all-link">
              Xem tất cả
            </Link>
          </CardHeader>
          <CardContent>
            <ActivityList 
              activities={filteredActivities}
              vms={vms}
              maxItems={10}
            />
            
            {filteredActivities.length === 0 && (
              <div className="empty-activities">
                <i className="fas fa-history"></i>
                <p>Không có hoạt động nào thuộc loại đã chọn.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="activity-summary">
          <div className="summary-cards">
            <Card className="summary-card">
              <CardContent>
                <div className="summary-icon">
                  <i className="fas fa-server"></i>
                </div>
                <div className="summary-info">
                  <h3 className="summary-title">Máy ảo đã tạo</h3>
                  <p className="summary-value">{dashboardData.activitySummary.createdVMs}</p>
                  <p className="summary-period">trong 30 ngày qua</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="summary-card">
              <CardContent>
                <div className="summary-icon">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="summary-info">
                  <h3 className="summary-title">Thời gian hoạt động</h3>
                  <p className="summary-value">{dashboardData.activitySummary.uptimeHours}</p>
                  <p className="summary-period">giờ trong tuần qua</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="summary-card">
              <CardContent>
                <div className="summary-icon">
                  <i className="fas fa-terminal"></i>
                </div>
                <div className="summary-info">
                  <h3 className="summary-title">Phiên SSH</h3>
                  <p className="summary-value">{dashboardData.activitySummary.sshSessions}</p>
                  <p className="summary-period">phiên trong tuần qua</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="summary-card">
              <CardContent>
                <div className="summary-icon">
                  <i className="fas fa-user-shield"></i>
                </div>
                <div className="summary-info">
                  <h3 className="summary-title">Cập nhật certificate</h3>
                  <p className="summary-value">{dashboardData.activitySummary.certificateUpdates}</p>
                  <p className="summary-period">trong tháng qua</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="scheduled-tasks-card">
          <CardHeader>
            <CardTitle>Tác vụ đã lên lịch</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.scheduledTasks && dashboardData.scheduledTasks.length > 0 ? (
              <ul className="task-list">
                {dashboardData.scheduledTasks.map((task, index) => (
                  <li key={index} className="task-item">
                    <div className="task-status">
                      <span className={`status-dot ${task.status}`}></span>
                    </div>
                    <div className="task-content">
                      <h4 className="task-title">{task.title}</h4>
                      <p className="task-description">{task.description}</p>
                      <div className="task-meta">
                        <span className="task-time">
                          <i className="fas fa-clock"></i>
                          {task.scheduledTime}
                        </span>
                        <span className="task-target">
                          <i className="fas fa-server"></i>
                          {task.targetVM ? vms.find(vm => vm.id === task.targetVM)?.name || task.targetVM : 'Hệ thống'}
                        </span>
                      </div>
                    </div>
                    <div className="task-actions">
                      <button className="task-action-btn">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button className="task-action-btn">
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-tasks">
                <i className="fas fa-calendar-check"></i>
                <p>Không có tác vụ đã lên lịch.</p>
                <Link to="/tasks/schedule" className="schedule-task-btn">
                  Lên lịch tác vụ mới
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default ActivitySection;