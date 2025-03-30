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
import { useMutation } from 'react-query';
import { updateProfileService, changePasswordService } from '../../services/auth.service';
import useAuth from '../../hooks/useAuth';
import { validationRules } from '../../utils/validation.utils';

const { Title, Text } = Typography;

/**
 * Profile settings component
 */
const ProfileSettings = () => {
  const { user, logout } = useAuth();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [avatar, setAvatar] = useState(null);
  
  // Profile update mutation
  const profileMutation = useMutation(updateProfileService, {
    onSuccess: () => {
      message.success('Thông tin cá nhân đã được cập nhật');
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin cá nhân');
    }
  });
  
  // Password change mutation
  const passwordMutation = useMutation(changePasswordService, {
    onSuccess: () => {
      message.success('Mật khẩu đã được thay đổi. Vui lòng đăng nhập lại.');
      passwordForm.resetFields();
      setTimeout(() => {
        logout();
      }, 2000);
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi thay đổi mật khẩu');
    }
  });
  
  // Update profile handler
  const handleUpdateProfile = (values) => {
    // Add avatar if changed
    const userData = { ...values };
    if (avatar) {
      userData.avatar = avatar;
    }
    
    profileMutation.mutate(userData);
  };
  
  // Change password handler
  const handleChangePassword = (values) => {
    const { currentPassword, newPassword } = values;
    passwordMutation.mutate({ currentPassword, newPassword });
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
            name="username"
            label="Tên đăng nhập"
            rules={[validationRules.required, validationRules.username]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Tên đăng nhập" 
              disabled={true} // Username cannot be changed
            />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="Email"
            rules={[validationRules.required, validationRules.email]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>
          
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[validationRules.phone]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="Số điện thoại" />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={profileMutation.isLoading}
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
              loading={passwordMutation.isLoading}
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