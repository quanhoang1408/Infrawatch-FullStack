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
  console.log('VMAssignments component rendered');

  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [vms, setVMs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('1');

  // Log when isAddingAssignment changes
  useEffect(() => {
    console.log('isAddingAssignment changed:', isAddingAssignment);

    // If we're showing the form, make sure we have fresh data
    if (isAddingAssignment) {
      console.log('Form is being shown, fetching fresh data');
      fetchData();
    }
  }, [isAddingAssignment]);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch all required data
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch assignments and users first
      const [assignmentsRes, usersRes] = await Promise.all([
        api.get('/admin/vm-assignments'),
        api.get('/admin/users')
      ]);

      console.log('Assignments response:', assignmentsRes);
      console.log('Users response:', usersRes);

      // Fetch VMs separately to debug any issues
      let vmsRes;
      try {
        console.log('Fetching VMs from /vm endpoint...');
        vmsRes = await api.get('/vm');
        console.log('VMs response from /vm:', vmsRes);
      } catch (vmError) {
        console.error('Error fetching VMs from /vm:', vmError);

        // Try alternative endpoint if first one fails
        try {
          console.log('Trying alternative endpoint /vms...');
          vmsRes = await api.get('/vms');
          console.log('VMs response from /vms:', vmsRes);
        } catch (altVmError) {
          console.error('Error fetching VMs from /vms:', altVmError);
          vmsRes = { data: [] }; // Set empty array as fallback
        }
      }

      // Log data for debugging
      console.log('Assignments data:', assignmentsRes.data);
      console.log('Users data:', usersRes.data);
      console.log('VMs data:', vmsRes.data);

      // Check if data is in the expected format
      if (Array.isArray(usersRes.data)) {
        console.log('Users data is an array with', usersRes.data.length, 'items');
        if (usersRes.data.length > 0) {
          console.log('First user:', usersRes.data[0]);
          console.log('User has _id property:', usersRes.data[0]._id ? 'Yes' : 'No');
          console.log('User has name property:', usersRes.data[0].name ? 'Yes' : 'No');
          console.log('User has email property:', usersRes.data[0].email ? 'Yes' : 'No');
        }
      } else {
        console.warn('Users data is not an array!', typeof usersRes.data);
      }

      if (Array.isArray(vmsRes.data)) {
        console.log('VMs data is an array with', vmsRes.data.length, 'items');
        if (vmsRes.data.length > 0) {
          console.log('First VM:', vmsRes.data[0]);
          console.log('VM has _id property:', vmsRes.data[0]._id ? 'Yes' : 'No');
          console.log('VM has name property:', vmsRes.data[0].name ? 'Yes' : 'No');
          console.log('VM has instanceId property:', vmsRes.data[0].instanceId ? 'Yes' : 'No');
        }
      } else {
        console.warn('VMs data is not an array!', typeof vmsRes.data);
      }

      // Ensure we're setting arrays
      setAssignments(Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setVMs(Array.isArray(vmsRes.data) ? vmsRes.data : []);
    } catch (err) {
      console.error('Error fetching data:', err);

      // Provide more specific error message
      if (err.response) {
        console.error('Error response:', err.response.status, err.response.data);
        setError(`Lỗi ${err.response.status}: ${err.response.data?.message || err.message}`);
      } else if (err.request) {
        console.error('No response received:', err.request);
        setError('Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.');
      } else {
        setError(err.message || 'Không thể tải dữ liệu');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a new assignment
  const handleAddAssignment = async (values) => {
    try {
      console.log('Adding assignment with values:', values);
      const response = await api.post('/admin/vm-assignments', {
        vmId: values.vmId,
        userId: values.userId
      });

      console.log('Assignment added successfully:', response.data);

      // Fetch all data again to ensure we have fully populated data
      await fetchData();

      setIsAddingAssignment(false);
      form.resetFields();
      message.success('Phân quyền máy ảo đã được thêm thành công');
    } catch (err) {
      console.error('Error adding assignment:', err);

      if (err.response) {
        console.error('Error response:', err.response.status, err.response.data);
        message.error(err.response.data?.message || 'Không thể thêm phân quyền máy ảo');
      } else if (err.request) {
        console.error('No response received:', err.request);
        message.error('Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.');
      } else {
        message.error(err.message || 'Không thể thêm phân quyền máy ảo');
      }
    }
  };

  // Handle removing an assignment
  const handleRemoveAssignment = async (vmId, userId) => {
    try {
      console.log('Removing assignment for VM:', vmId, 'and User:', userId);
      await api.post('/admin/vm-assignments/unassign', {
        vmId,
        userId
      });

      console.log('Assignment removed successfully');

      // Fetch all data again to ensure we have updated data
      await fetchData();

      message.success('Phân quyền máy ảo đã được xóa thành công');
    } catch (err) {
      console.error('Error removing assignment:', err);

      if (err.response) {
        console.error('Error response:', err.response.status, err.response.data);
        message.error(err.response.data?.message || 'Không thể xóa phân quyền máy ảo');
      } else if (err.request) {
        console.error('No response received:', err.request);
        message.error('Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.');
      } else {
        message.error(err.message || 'Không thể xóa phân quyền máy ảo');
      }
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
          <ProviderIcon provider={record.vmId?.provider || 'unknown'} size="md" />
          <div>
            <div className="vm-name">{text}</div>
            <div className="vm-id">{record.vmId?.instanceId || 'N/A'}</div>
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
                <ProviderIcon provider={assignment.vmId?.provider || 'unknown'} size="sm" />
                <span>{assignment.vmId?.name || 'Máy ảo không tên'}</span>
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
  const renderAssignmentForm = () => {
    console.log('Rendering assignment form');
    console.log('Users available:', users.length);
    console.log('VMs available:', vms.length);

    // Check if we have data to show
    const hasUsers = users && users.length > 0;
    const hasVMs = vms && vms.length > 0;

    // Show warning if no data
    if (!hasUsers && !hasVMs) {
      message.warning('Không có dữ liệu người dùng và máy ảo. Vui lòng tải lại dữ liệu hoặc thêm người dùng/máy ảo trước.');
    } else if (!hasUsers) {
      message.warning('Không có dữ liệu người dùng. Vui lòng thêm người dùng trước khi phân quyền.');
    } else if (!hasVMs) {
      message.warning('Không có dữ liệu máy ảo. Vui lòng thêm máy ảo trước khi phân quyền.');
    }

    return (
    <Card className="assignment-form-card">
      <div className="assignment-form-header">
        <h2 className="assignment-form-title">Thêm phân quyền máy ảo mới</h2>
        <div className="assignment-form-actions">
          <Button
            onClick={fetchData}
            icon={<svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor">
              <path d="M909.1 209.3l-56.4 44.1C775.8 155.1 656.2 92 521.9 92 290 92 102.3 279.5 102 511.5 101.7 743.7 289.8 932 521.9 932c181.3 0 335.8-115 394.6-276.1 1.5-4.2-.7-8.9-4.9-10.3l-56.7-19.5c-4.1-1.4-8.6.7-10.1 4.8-1.8 5-3.8 10-5.9 14.9-17.3 41-42.1 77.8-73.7 109.4-31.6 31.6-68.4 56.4-109.3 73.8-42.3 17.9-87.4 27-133.8 27-46.5 0-91.5-9.1-133.8-27-40.9-17.3-77.7-42.1-109.3-73.8-31.6-31.6-56.4-68.4-73.7-109.4-17.9-42.4-27-87.4-27-133.9s9.1-91.5 27-133.9c17.3-41 42.1-77.8 73.7-109.4 31.6-31.6 68.4-56.4 109.3-73.8 42.3-17.9 87.4-27 133.8-27 46.5 0 91.5 9.1 133.8 27 40.9 17.3 77.7 42.1 109.3 73.8 9.9 9.9 19.2 20.4 27.8 31.4l-60.2 47c-5.3 4.1-3.5 12.5 3 14.1l175.6 43c5 1.2 9.9-2.6 9.9-7.7l.8-180.9c-.1-6.6-7.8-10.3-13-6.2z" />
            </svg>}
          >
            Tải lại dữ liệu
          </Button>
          {(!vms || vms.length === 0) && (
            <Button
              type="primary"
              onClick={async () => {
                try {
                  console.log('Trying to fetch VMs from alternative endpoint...');
                  const altEndpoints = ['/vms', '/vm/list', '/admin/vms'];

                  for (const endpoint of altEndpoints) {
                    try {
                      console.log(`Trying endpoint ${endpoint}...`);
                      const response = await api.get(endpoint);
                      console.log(`Response from ${endpoint}:`, response);

                      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                        setVMs(response.data);
                        message.success(`Đã tải ${response.data.length} máy ảo từ ${endpoint}`);
                        break;
                      }
                    } catch (err) {
                      console.error(`Error fetching from ${endpoint}:`, err);
                    }
                  }
                } catch (err) {
                  console.error('Error trying alternative endpoints:', err);
                  message.error('Không thể tải dữ liệu máy ảo từ các endpoint thay thế');
                }
              }}
            >
              Thử tải máy ảo
            </Button>
          )}
          <Button
            onClick={() => {
              console.log('Cancel button clicked');
              setIsAddingAssignment(false);
            }}
          >
            Hủy
          </Button>
        </div>
      </div>
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
            {users && users.length > 0 ? (
              users.map(user => {
                // Check if user has required properties
                if (!user || !user._id || !user.name) {
                  console.warn('Invalid user data:', user);
                  return null;
                }

                // Log each user for debugging
                console.log('Rendering user option:', user._id, user.name, user.email, user.role);

                return (
                  <Select.Option key={user._id} value={user._id}>
                    {user.name} {user.email ? `(${user.email})` : ''} - {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                  </Select.Option>
                );
              })
            ) : (
              <Select.Option disabled value="no-users">Không có người dùng nào</Select.Option>
            )}
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
            {vms && vms.length > 0 ? (
              vms.map(vm => {
                // Check if VM has required properties
                if (!vm || !vm._id) {
                  console.warn('Invalid VM data:', vm);
                  return null;
                }

                // Log each VM for debugging
                console.log('Rendering VM option:', vm);

                // Handle different VM data structures
                const vmName = vm.name || vm.instanceId || 'Máy ảo không tên';
                const vmId = vm.instanceId || '';
                const vmProvider = vm.provider || '';

                return (
                  <Select.Option key={vm._id} value={vm._id}>
                    {vmName} {vmId ? `(${vmId})` : ''} {vmProvider ? `- ${vmProvider}` : ''}
                  </Select.Option>
                );
              })
            ) : (
              <Select.Option disabled value="no-vms">Không có máy ảo nào</Select.Option>
            )}
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
  };

  // Render content based on state
  const renderContent = () => {
    console.log('Rendering content with state:', {
      loading,
      error,
      isAddingAssignment,
      assignmentsCount: assignments.length,
      usersCount: users.length,
      vmsCount: vms.length
    });

    if (loading) {
      console.log('Showing loading spinner');
      return (
        <div className="assignments__loading">
          <Spinner size="large" />
        </div>
      );
    }

    if (error) {
      console.log('Showing error state:', error);
      return (
        <ErrorState
          title="Không thể tải dữ liệu phân quyền"
          message={typeof error === 'string' ? error : "Đã xảy ra lỗi khi tải dữ liệu phân quyền. Vui lòng thử lại."}
          error={error}
          retryAction={fetchData}
        />
      );
    }

    // We now handle isAddingAssignment at a higher level
    // No need to check for it here anymore

    return (
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Tất cả phân quyền" key="1">
          {assignments.length === 0 ? (
            <EmptyState
              title="Chưa có phân quyền nào"
              message="Thêm phân quyền để cho phép người dùng truy cập máy ảo."
              actionButton={
                <Button
                  type="primary"
                  onClick={() => {
                    console.log('Add assignment button clicked (EmptyState)');
                    setIsAddingAssignment(true);
                    console.log('isAddingAssignment set to true');
                  }}
                >
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

  // Determine what to render
  const mainContent = isAddingAssignment
    ? renderAssignmentForm()
    : (
      <div className="vm-assignments__content">
        {renderContent()}
      </div>
    );

  return (
    <div className="vm-assignments">
      <div className="vm-assignments__header">
        <h1 className="vm-assignments__title">Phân quyền máy ảo</h1>
        {!isAddingAssignment && (
          <div className="vm-assignments__actions">
            <Button
              type="primary"
              icon={<LinkOutlined />}
              onClick={() => {
                console.log('Add assignment button clicked (Header)');
                setIsAddingAssignment(true);
                console.log('isAddingAssignment set to true');
              }}
            >
              Thêm phân quyền
            </Button>
          </div>
        )}
      </div>

      {mainContent}
    </div>
  );
};

export default VMAssignments;
