import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, message, Space, Card, Tabs } from 'antd';
import { UserOutlined, DesktopOutlined, LinkOutlined, DisconnectOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import Spinner from '../../../components/common/Spinner';
import EmptyState from '../../../components/common/EmptyState';
import ErrorState from '../../../components/common/ErrorState';
import { ProviderIcon } from '../../../components/vm';
import './VMAssignments.scss';

const { TabPane } = Tabs;

const VMAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [vms, setVMs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('1');

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch all required data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch assignments, users, and VMs in parallel
      const [assignmentsRes, usersRes, vmsRes] = await Promise.all([
        api.get('/admin/vm-assignments'),
        api.get('/admin/users'),
        api.get('/vms')
      ]);
      
      setAssignments(assignmentsRes.data);
      setUsers(usersRes.data);
      setVMs(vmsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a new assignment
  const handleAddAssignment = async (values) => {
    try {
      const response = await api.post('/admin/vm-assignments', {
        vmId: values.vmId,
        userId: values.userId
      });
      
      // Update assignments list
      setAssignments([...assignments, response.data]);
      setIsAddingAssignment(false);
      form.resetFields();
      message.success('Phân quyền máy ảo đã được thêm thành công');
    } catch (err) {
      console.error('Error adding assignment:', err);
      message.error(err.response?.data?.message || 'Không thể thêm phân quyền máy ảo');
    }
  };

  // Handle removing an assignment
  const handleRemoveAssignment = async (vmId, userId) => {
    try {
      await api.post('/admin/vm-assignments/unassign', {
        vmId,
        userId
      });
      
      // Update assignments list
      setAssignments(assignments.filter(
        assignment => !(assignment.vmId._id === vmId && assignment.userId._id === userId)
      ));
      
      message.success('Phân quyền máy ảo đã được xóa thành công');
    } catch (err) {
      console.error('Error removing assignment:', err);
      message.error(err.response?.data?.message || 'Không thể xóa phân quyền máy ảo');
    }
  };

  // Columns for assignments table
  const assignmentsColumns = [
    {
      title: 'Người dùng',
      dataIndex: ['userId', 'name'],
      key: 'userName',
      render: (text, record) => (
        <div className="user-info">
          <div className="user-avatar">{text.charAt(0).toUpperCase()}</div>
          <div>
            <div className="user-name">{text}</div>
            <div className="user-email">{record.userId.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Máy ảo',
      dataIndex: ['vmId', 'name'],
      key: 'vmName',
      render: (text, record) => (
        <div className="vm-info">
          <ProviderIcon provider={record.vmId.provider} size="md" />
          <div>
            <div className="vm-name">{text}</div>
            <div className="vm-id">{record.vmId.instanceId}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Phân quyền bởi',
      dataIndex: ['assignedBy', 'name'],
      key: 'assignedBy',
    },
    {
      title: 'Ngày phân quyền',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="primary" 
          danger
          icon={<DisconnectOutlined />}
          onClick={() => {
            Modal.confirm({
              title: 'Xác nhận xóa phân quyền',
              content: `Bạn có chắc chắn muốn xóa quyền truy cập của người dùng ${record.userId.name} đến máy ảo ${record.vmId.name}?`,
              okText: 'Xóa',
              okType: 'danger',
              cancelText: 'Hủy',
              onOk: () => handleRemoveAssignment(record.vmId._id, record.userId._id),
            });
          }}
        >
          Xóa phân quyền
        </Button>
      ),
    },
  ];

  // Columns for user-centric view
  const userVMsColumns = [
    {
      title: 'Người dùng',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <div className="user-info">
          <div className="user-avatar">{text.charAt(0).toUpperCase()}</div>
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <span className={`role-badge role-${role}`}>
          {role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
        </span>
      ),
    },
    {
      title: 'Máy ảo được phân quyền',
      key: 'assignedVMs',
      render: (_, user) => {
        const userAssignments = assignments.filter(
          assignment => assignment.userId._id === user._id
        );
        
        if (userAssignments.length === 0) {
          return <span className="no-vms">Chưa có máy ảo nào</span>;
        }
        
        return (
          <div className="assigned-vms">
            {userAssignments.map(assignment => (
              <div key={assignment.vmId._id} className="assigned-vm">
                <ProviderIcon provider={assignment.vmId.provider} size="sm" />
                <span>{assignment.vmId.name}</span>
                <Button 
                  type="text" 
                  danger
                  icon={<DisconnectOutlined />}
                  onClick={() => handleRemoveAssignment(assignment.vmId._id, user._id)}
                />
              </div>
            ))}
          </div>
        );
      },
    },
  ];

  // Render assignment form
  const renderAssignmentForm = () => (
    <Card className="assignment-form-card">
      <h2 className="assignment-form-title">Thêm phân quyền máy ảo mới</h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleAddAssignment}
      >
        <Form.Item
          name="userId"
          label="Người dùng"
          rules={[{ required: true, message: 'Vui lòng chọn người dùng' }]}
        >
          <Select
            placeholder="Chọn người dùng"
            showSearch
            optionFilterProp="children"
          >
            {users.map(user => (
              <Select.Option key={user._id} value={user._id}>
                {user.name} ({user.email})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item
          name="vmId"
          label="Máy ảo"
          rules={[{ required: true, message: 'Vui lòng chọn máy ảo' }]}
        >
          <Select
            placeholder="Chọn máy ảo"
            showSearch
            optionFilterProp="children"
          >
            {vms.map(vm => (
              <Select.Option key={vm._id} value={vm._id}>
                {vm.name} ({vm.instanceId})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Thêm phân quyền
            </Button>
            <Button onClick={() => setIsAddingAssignment(false)}>
              Hủy
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );

  // Render content based on state
  const renderContent = () => {
    if (loading) {
      return (
        <div className="assignments__loading">
          <Spinner size="large" />
        </div>
      );
    }

    if (error) {
      return (
        <ErrorState
          title="Không thể tải dữ liệu"
          message="Đã xảy ra lỗi khi tải dữ liệu phân quyền. Vui lòng thử lại."
          error={error}
          retryAction={fetchData}
        />
      );
    }

    if (isAddingAssignment) {
      return renderAssignmentForm();
    }

    return (
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Tất cả phân quyền" key="1">
          {assignments.length === 0 ? (
            <EmptyState
              title="Chưa có phân quyền nào"
              message="Thêm phân quyền để cho phép người dùng truy cập máy ảo."
              actionButton={
                <Button type="primary" onClick={() => setIsAddingAssignment(true)}>
                  Thêm phân quyền
                </Button>
              }
            />
          ) : (
            <Table 
              columns={assignmentsColumns} 
              dataSource={assignments} 
              rowKey={record => `${record.vmId._id}-${record.userId._id}`}
              pagination={{ pageSize: 10 }}
            />
          )}
        </TabPane>
        <TabPane tab="Theo người dùng" key="2">
          <Table 
            columns={userVMsColumns} 
            dataSource={users} 
            rowKey="_id"
            pagination={{ pageSize: 10 }}
          />
        </TabPane>
      </Tabs>
    );
  };

  return (
    <div className="vm-assignments">
      <div className="vm-assignments__header">
        <h1 className="vm-assignments__title">Phân quyền máy ảo</h1>
        {!isAddingAssignment && (
          <div className="vm-assignments__actions">
            <Button
              type="primary"
              icon={<LinkOutlined />}
              onClick={() => setIsAddingAssignment(true)}
            >
              Thêm phân quyền
            </Button>
          </div>
        )}
      </div>

      <div className="vm-assignments__content">
        {renderContent()}
      </div>
    </div>
  );
};

export default VMAssignments;
