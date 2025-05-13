import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './Profile.scss';

const Profile = () => {
  const { user, updateUserInContext } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Khởi tạo form với dữ liệu người dùng hiện tại
  React.useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
      });
    }
  }, [form, user]);

  const handleSubmit = async (values) => {
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

  return (
    <div className="profile-page">
      <Card title="Thông tin cá nhân" className="profile-card">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
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
            label="Email"
          >
            <Input
              value={user?.email}
              disabled
              style={{ backgroundColor: '#f5f5f5' }}
            />
            <div className="form-help-text">Email không thể thay đổi</div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              Cập nhật thông tin
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Profile;
