import { useState } from 'react';
import { Form, Input, Button, Select, Checkbox, Tooltip, Divider } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  PhoneOutlined,
  QuestionCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import useAuth from '../../hooks/useAuth';

const { Option } = Select;

/**
 * Register form component
 */
const RegisterForm = () => {
  const [form] = Form.useForm();
  const { register, loading, error } = useAuth();
  const [passwordVisible, setPasswordVisible] = useState(false);

  /**
   * Handle form submission
   * @param {Object} values - Form values
   */
  const onFinish = async (values) => {
    // Remove confirmPassword field
    const { confirmPassword, ...userData } = values;
    await register(userData);
  };

  /**
   * Check if password is strong enough
   * @param {string} password - Password to check
   * @returns {boolean} - True if password is strong
   */
  const validatePasswordStrength = (_, value) => {
    if (!value) {
      return Promise.reject(new Error('Vui lòng nhập mật khẩu!'));
    }
    
    // Password needs to be at least 8 characters
    if (value.length < 8) {
      return Promise.reject(new Error('Mật khẩu phải có ít nhất 8 ký tự!'));
    }
    
    // Password needs to contain at least one uppercase letter, one lowercase letter, and one number
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return Promise.reject(
        new Error('Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số!')
      );
    }
    
    return Promise.resolve();
  };

  return (
    <Form
      form={form}
      name="register"
      onFinish={onFinish}
      layout="vertical"
      scrollToFirstError
    >
      <Form.Item
        name="username"
        label="Tên đăng nhập"
        rules={[
          { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
          { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự!' },
          { max: 20, message: 'Tên đăng nhập không được vượt quá 20 ký tự!' },
          {
            pattern: /^[a-zA-Z0-9_]+$/,
            message: 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới!',
          },
        ]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="Username"
          autoComplete="username"
        />
      </Form.Item>

      <Form.Item
        name="email"
        label="Email"
        rules={[
          { required: true, message: 'Vui lòng nhập email!' },
          { type: 'email', message: 'Email không hợp lệ!' },
        ]}
      >
        <Input
          prefix={<MailOutlined />}
          placeholder="Email"
          autoComplete="email"
        />
      </Form.Item>

      <Form.Item
        name="name"
        label="Họ và tên"
        rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="Họ và tên"
          autoComplete="name"
        />
      </Form.Item>

      <Form.Item
        name="phone"
        label="Số điện thoại"
        rules={[
          { required: true, message: 'Vui lòng nhập số điện thoại!' },
          {
            pattern: /^[0-9]{10,11}$/,
            message: 'Số điện thoại không hợp lệ!',
          },
        ]}
      >
        <Input
          prefix={<PhoneOutlined />}
          placeholder="Số điện thoại"
          autoComplete="tel"
        />
      </Form.Item>

      <Divider orientation="left">Thông tin tài khoản</Divider>

      <Form.Item
        name="password"
        label="Mật khẩu"
        rules={[
          { validator: validatePasswordStrength },
        ]}
        tooltip={{
          title: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số',
          icon: <InfoCircleOutlined />,
        }}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Mật khẩu"
          autoComplete="new-password"
          visibilityToggle={{ visible: passwordVisible, onVisibleChange: setPasswordVisible }}
        />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        label="Xác nhận mật khẩu"
        dependencies={['password']}
        rules={[
          { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
            },
          }),
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Xác nhận mật khẩu"
          autoComplete="new-password"
        />
      </Form.Item>

      <Form.Item
        name="role"
        label={
          <span>
            Vai trò{' '}
            <Tooltip title="Vai trò của bạn trong hệ thống">
              <QuestionCircleOutlined />
            </Tooltip>
          </span>
        }
        initialValue="user"
      >
        <Select placeholder="Chọn vai trò">
          <Option value="user">Người dùng</Option>
          <Option value="admin">Quản trị viên</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="agreement"
        valuePropName="checked"
        rules={[
          {
            validator: (_, value) =>
              value
                ? Promise.resolve()
                : Promise.reject(new Error('Vui lòng đọc và đồng ý với điều khoản sử dụng!')),
          },
        ]}
      >
        <Checkbox>
          Tôi đã đọc và đồng ý với <a href="#">Điều khoản sử dụng</a> và{' '}
          <a href="#">Chính sách bảo mật</a>
        </Checkbox>
      </Form.Item>

      {error && (
        <div style={{ color: '#ff4d4f', marginBottom: 24 }}>
          {error}
        </div>
      )}

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          className="login-form-button"
        >
          Đăng ký
        </Button>
      </Form.Item>
    </Form>
  );
};

export default RegisterForm;