import React, { useState } from 'react';
import {
  Typography,
  Form,
  Input,
  Button,
  Divider,
  message,
  Avatar,
  Upload,
  Space
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  UploadOutlined,
  LockOutlined
} from '@ant-design/icons';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';

const { Title, Text } = Typography;

// Form validation rules
const validationRules = {
  required: { required: true, message: 'Trường này là bắt buộc' },
  email: { type: 'email', message: 'Email không hợp lệ' },
  phone: { pattern: /^[0-9+\-\s()]+$/, message: 'Số điện thoại không hợp lệ' }
};

/**
 * Profile settings component
 */
const ProfileSettings = () => {
  const { user, logout, updateUserInContext } = useAuth();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Update profile handler
  const handleUpdateProfile = async (values) => {
    // Chỉ cập nhật nếu tên đã thay đổi
    if (values.name === user.name) {
      message.info('Tên của bạn không thay đổi');
      return;
    }

    setLoading(true);

    try {
      // Gọi API để cập nhật tên người dùng
      const response = await api.patch('/users/profile', { name: values.name });

      // Cập nhật thông tin người dùng trong context
      updateUserInContext(response.data);

      message.success('Tên của bạn đã được cập nhật thành công');
    } catch (err) {
      console.error('Error updating profile:', err);

      // Hiển thị thông báo lỗi
      let errorMessage = 'Không thể cập nhật thông tin cá nhân';

      if (err.response) {
        errorMessage += ': ' + (err.response.data?.message || err.response.statusText);
      } else if (err.request) {
        errorMessage += ': Lỗi kết nối đến server. Vui lòng kiểm tra kết nối mạng của bạn.';
      } else {
        errorMessage += ': ' + err.message;
      }

      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Change password handler
  const handleChangePassword = async (values) => {
    const { currentPassword, newPassword } = values;

    setPasswordLoading(true);

    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });

      message.success('Mật khẩu đã được thay đổi. Vui lòng đăng nhập lại.');
      passwordForm.resetFields();

      setTimeout(() => {
        logout();
      }, 2000);
    } catch (err) {
      console.error('Error changing password:', err);

      // Hiển thị thông báo lỗi
      let errorMessage = 'Có lỗi xảy ra khi thay đổi mật khẩu';

      if (err.response) {
        errorMessage += ': ' + (err.response.data?.message || err.response.statusText);
      } else if (err.request) {
        errorMessage += ': Lỗi kết nối đến server. Vui lòng kiểm tra kết nối mạng của bạn.';
      } else {
        errorMessage += ': ' + err.message;
      }

      message.error(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Avatar upload props
  const uploadProps = {
    beforeUpload: (file) => {
      // Check file type
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('Bạn chỉ có thể tải lên file hình ảnh!');
        return Upload.LIST_IGNORE;
      }

      // Check file size (2MB max)
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('Hình ảnh phải nhỏ hơn 2MB!');
        return Upload.LIST_IGNORE;
      }

      // Store file
      setAvatar(file);
      return false;
    },
    maxCount: 1
  };

  return (
    <div className="profile-settings">
      <Title level={2}>Thông tin cá nhân</Title>

      <div className="settings-section">
        <div className="avatar-section" style={{ marginBottom: 24, textAlign: 'center' }}>
          <Avatar
            size={100}
            icon={<UserOutlined />}
            src={user?.avatar}
            style={{ marginBottom: 16 }}
          />
          <div>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Thay đổi ảnh đại diện</Button>
            </Upload>
          </div>
        </div>

        <Form
          form={profileForm}
          layout="vertical"
          initialValues={{
            name: user?.name || '',
            username: user?.username || '',
            email: user?.email || '',
            phone: user?.phone || ''
          }}
          onFinish={handleUpdateProfile}
        >
          <Form.Item
            name="name"
            label="Họ và tên"
            rules={[validationRules.required]}
          >
            <Input prefix={<UserOutlined />} placeholder="Họ và tên" />
          </Form.Item>

          <Form.Item
            label="Email"
          >
            <Input
              value={user?.email}
              prefix={<MailOutlined />}
              disabled={true}
              style={{ backgroundColor: '#f5f5f5' }}
            />
            <div className="form-help-text">Email không thể thay đổi</div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
            >
              Cập nhật thông tin
            </Button>
          </Form.Item>
        </Form>
      </div>

      <Divider />

      <div className="settings-section">
        <Title level={3}>Thay đổi mật khẩu</Title>

        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            name="currentPassword"
            label="Mật khẩu hiện tại"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Mật khẩu hiện tại"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                message: 'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường và một số'
              }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Mật khẩu mới"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Xác nhận mật khẩu mới"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              danger
              loading={passwordLoading}
            >
              Thay đổi mật khẩu
            </Button>
          </Form.Item>
        </Form>

        <Text type="secondary">
          Lưu ý: Bạn sẽ được đăng xuất sau khi thay đổi mật khẩu thành công.
        </Text>
      </div>
    </div>
  );
};

export default ProfileSettings;