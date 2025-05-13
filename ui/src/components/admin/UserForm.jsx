import React, { useState } from 'react';
import { Form, Input, Select, Button, Space } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import './UserForm.scss';

const { Option } = Select;

const UserForm = ({ user, onSubmit, onCancel, loading, isEditing = false }) => {
  const [form] = Form.useForm();

  // Initialize form with user data if editing
  React.useEffect(() => {
    if (isEditing && user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      });
    }
  }, [form, user, isEditing]);

  const handleSubmit = (values) => {
    onSubmit(values);
  };

  return (
    <div className="user-form">
      <h2 className="user-form__title">
        {isEditing ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
      </h2>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          role: 'user',
          status: 'active',
        }}
      >
        <Form.Item
          name="name"
          label="Họ và tên"
          rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Họ và tên"
            disabled={loading}
          />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Vui lòng nhập email' },
            { type: 'email', message: 'Email không hợp lệ' }
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="Email"
            disabled={loading}
          />
        </Form.Item>

        {!isEditing && (
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu' },
              { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Mật khẩu"
              disabled={loading}
            />
          </Form.Item>
        )}

        <Form.Item
          name="role"
          label="Vai trò"
          rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
        >
          <Select disabled={loading}>
            <Option value="user">Người dùng</Option>
            <Option value="admin">Quản trị viên</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="status"
          label="Trạng thái"
          rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
        >
          <Select disabled={loading}>
            <Option value="active">Hoạt động</Option>
            <Option value="inactive">Không hoạt động</Option>
            <Option value="suspended">Đã khóa</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEditing ? 'Cập nhật' : 'Thêm'}
            </Button>
            <Button onClick={onCancel} disabled={loading}>
              Hủy
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default UserForm;
