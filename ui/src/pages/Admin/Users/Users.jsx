import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import api from '../../../services/api';
import Spinner from '../../../components/common/Spinner';
import EmptyState from '../../../components/common/EmptyState';
import ErrorState from '../../../components/common/ErrorState';
import UserForm from '../../../components/admin/UserForm';
import './Users.scss';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [addingInProgress, setAddingInProgress] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a new user
  const handleAddUser = async (userData) => {
    setAddingInProgress(true);

    try {
      const response = await api.post('/admin/users', userData);
      setUsers([...users, response.data]);
      setIsAddingUser(false);
      message.success('Người dùng đã được thêm thành công');
    } catch (err) {
      console.error('Error adding user:', err);
      message.error(err.response?.data?.message || 'Không thể thêm người dùng');
    } finally {
      setAddingInProgress(false);
    }
  };

  // Đã xóa phương thức handleEditUser

  // Handle deleting a user
  const handleDeleteUser = async (userId) => {
    try {
      console.log('Deleting user with ID:', userId);

      // Sử dụng fetch thay vì axios để loại trừ vấn đề với thư viện axios
      const response = await fetch(`${api.defaults.baseURL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update users list
      setUsers(users.filter(user => user._id !== userId));
      message.success('Người dùng đã được xóa thành công');
    } catch (err) {
      console.error('Error deleting user:', err);

      // Hiển thị thông báo lỗi chi tiết hơn
      let errorMessage = 'Không thể xóa người dùng';

      if (err.response) {
        // Lỗi từ server
        errorMessage += ': ' + (err.response.data?.message || err.response.statusText);
        console.error('Server error details:', err.response.data);
      } else if (err.request) {
        // Lỗi network - không nhận được phản hồi từ server
        errorMessage += ': Lỗi kết nối đến server. Vui lòng kiểm tra kết nối mạng của bạn.';
        console.error('Network error details:', err.request);
      } else {
        // Lỗi khác
        errorMessage += ': ' + err.message;
      }

      message.error(errorMessage);
    }
  };

  // Đã xóa phương thức editUser

  // Table columns
  const columns = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div className="user-name">
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
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span className={`status-badge status-${status}`}>
          {status === 'active' ? 'Hoạt động' :
           status === 'inactive' ? 'Không hoạt động' : 'Đã khóa'}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          danger
          onClick={() => {
            Modal.confirm({
              title: 'Xác nhận xóa người dùng',
              content: `Bạn có chắc chắn muốn xóa người dùng ${record.name}?`,
              okText: 'Xóa',
              okType: 'danger',
              cancelText: 'Hủy',
              onOk: () => handleDeleteUser(record._id),
            });
          }}
        >
          Xóa
        </Button>
      ),
    },
  ];

  // Render content based on state
  const renderContent = () => {
    if (loading) {
      return (
        <div className="users__loading">
          <Spinner size="large" />
        </div>
      );
    }

    if (error) {
      return (
        <ErrorState
          title="Không thể tải danh sách người dùng"
          message="Đã xảy ra lỗi khi tải danh sách người dùng. Vui lòng thử lại."
          error={error}
          retryAction={fetchUsers}
        />
      );
    }

    if (users.length === 0 && !isAddingUser) {
      return (
        <EmptyState
          title="Chưa có người dùng nào"
          message="Thêm người dùng để họ có thể truy cập hệ thống."
          actionButton={
            <Button type="primary" onClick={() => setIsAddingUser(true)}>
              Thêm người dùng
            </Button>
          }
        />
      );
    }

    return (
      <Table
        columns={columns}
        dataSource={users}
        rowKey="_id"
        pagination={{ pageSize: 10 }}
      />
    );
  };

  return (
    <div className="users">
      <div className="users__header">
        <h1 className="users__title">Quản lý người dùng</h1>
        {!isAddingUser && users.length > 0 && (
          <div className="users__actions">
            <Button
              type="primary"
              onClick={() => setIsAddingUser(true)}
            >
              Thêm người dùng
            </Button>
          </div>
        )}
      </div>

      <div className="users__content">
        {isAddingUser ? (
          <UserForm
            onSubmit={handleAddUser}
            onCancel={() => setIsAddingUser(false)}
            loading={addingInProgress}
          />
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
};

export default Users;
