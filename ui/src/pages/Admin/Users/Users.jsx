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
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [addingInProgress, setAddingInProgress] = useState(false);
  const [editingInProgress, setEditingInProgress] = useState(false);

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

  // Handle editing a user
  const handleEditUser = async (userData) => {
    setEditingInProgress(true);

    try {
      // Chỉ gửi các trường đã được thay đổi
      const updatedFields = {};

      // Kiểm tra từng trường và chỉ thêm vào nếu có giá trị
      if (userData.name) updatedFields.name = userData.name;
      if (userData.email) updatedFields.email = userData.email;
      if (userData.role) updatedFields.role = userData.role;
      if (userData.status) updatedFields.status = userData.status;
      if (userData.password) updatedFields.password = userData.password;

      // Đảm bảo có ít nhất một trường được cập nhật
      if (Object.keys(updatedFields).length === 0) {
        throw new Error('Không có thông tin nào được thay đổi');
      }

      console.log('Updating user with data:', updatedFields);

      const response = await api.patch(`/admin/users/${currentUser._id}`, updatedFields);

      // Update users list
      setUsers(users.map(user =>
        user._id === currentUser._id ? response.data : user
      ));

      setIsEditingUser(false);
      setCurrentUser(null);
      message.success('Người dùng đã được cập nhật thành công');
    } catch (err) {
      console.error('Error updating user:', err);
      message.error(err.response?.data?.message || 'Không thể cập nhật người dùng: ' + (err.response?.data?.message || err.message));
    } finally {
      setEditingInProgress(false);
    }
  };

  // Handle deleting a user
  const handleDeleteUser = async (userId) => {
    try {
      console.log('Deleting user with ID:', userId);
      await api.delete(`/admin/users/${userId}`);

      // Update users list
      setUsers(users.filter(user => user._id !== userId));
      message.success('Người dùng đã được xóa thành công');
    } catch (err) {
      console.error('Error deleting user:', err);
      // Hiển thị thông báo lỗi chi tiết hơn
      message.error(err.response?.data?.message || 'Không thể xóa người dùng: ' + (err.message || ''));
    }
  };

  // Edit user
  const editUser = (user) => {
    setCurrentUser(user);
    setIsEditingUser(true);
  };

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
        <Space size="middle">
          <Button type="primary" onClick={() => editUser(record)}>
            Sửa
          </Button>
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
        </Space>
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
        ) : isEditingUser ? (
          <UserForm
            user={currentUser}
            onSubmit={handleEditUser}
            onCancel={() => {
              setIsEditingUser(false);
              setCurrentUser(null);
            }}
            loading={editingInProgress}
            isEditing
          />
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
};

export default Users;
