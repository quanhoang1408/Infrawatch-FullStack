import React from 'react';
import { Card, List, Tag, Typography, Space, Avatar, Empty, Button } from 'antd';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  ReloadOutlined, 
  KeyOutlined, 
  CodeOutlined, 
  PlusCircleOutlined,
  UserOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Enable relative time plugin
dayjs.extend(relativeTime);

const { Text } = Typography;

/**
 * Activity section component for dashboard
 * 
 * @param {Object} props - Component props
 * @param {Array} props.activities - Activities data
 */
const ActivitySection = ({ activities }) => {
  const navigate = useNavigate();

  // Get activity icon based on type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'vm_start':
        return <PlayCircleOutlined style={{ color: '#52c41a' }} />;
      case 'vm_stop':
        return <PauseCircleOutlined style={{ color: '#faad14' }} />;
      case 'vm_restart':
        return <ReloadOutlined style={{ color: '#1890ff' }} />;
      case 'ssh_key_update':
        return <KeyOutlined style={{ color: '#722ed1' }} />;
      case 'ssh_access':
        return <CodeOutlined style={{ color: '#fa541c' }} />;
      case 'vm_create':
        return <PlusCircleOutlined style={{ color: '#13c2c2' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#8c8c8c' }} />;
    }
  };

  // Get activity tag based on type
  const getActivityTag = (type) => {
    switch (type) {
      case 'vm_start':
        return <Tag color="success">Khởi động</Tag>;
      case 'vm_stop':
        return <Tag color="warning">Tắt</Tag>;
      case 'vm_restart':
        return <Tag color="processing">Khởi động lại</Tag>;
      case 'ssh_key_update':
        return <Tag color="purple">SSH Key</Tag>;
      case 'ssh_access':
        return <Tag color="orange">SSH</Tag>;
      case 'vm_create':
        return <Tag color="cyan">Tạo mới</Tag>;
      default:
        return <Tag>Khác</Tag>;
    }
  };

  // Navigate to VM detail page
  const navigateToVM = (vmId) => {
    navigate(`/vms/${vmId}`);
  };

  // Format timestamp as relative time
  const formatTime = (timestamp) => {
    return dayjs(timestamp).fromNow();
  };

  return (
    <Card 
      title="Hoạt động gần đây" 
      className="activity-section"
      extra={
        <Button 
          type="link" 
          size="small" 
          onClick={() => navigate('/activities')}
        >
          Xem tất cả
        </Button>
      }
    >
      {activities && activities.length > 0 ? (
        <List
          className="activity-list"
          dataSource={activities}
          renderItem={(item) => (
            <List.Item className="activity-item">
              <List.Item.Meta
                avatar={
                  <Avatar 
                    icon={getActivityIcon(item.type)} 
                    style={{ backgroundColor: 'transparent' }}
                  />
                }
                title={
                  <Space size={4}>
                    {getActivityTag(item.type)}
                    <span 
                      className="vm-name" 
                      onClick={() => navigateToVM(item.vmId)}
                    >
                      {item.vmName}
                    </span>
                  </Space>
                }
                description={
                  <div className="activity-details">
                    <div className="activity-message">{item.message}</div>
                    <div className="activity-meta">
                      <Space size={12}>
                        <span>
                          <UserOutlined /> {item.user}
                        </span>
                        <span>
                          <ClockCircleOutlined /> {formatTime(item.timestamp)}
                        </span>
                      </Space>
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty description="Không có hoạt động nào" />
      )}
    </Card>
  );
};

export default ActivitySection;