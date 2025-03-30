import { useState } from 'react';
import { Form, Input, Button, Checkbox, Tooltip } from 'antd';
import { UserOutlined, LockOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import useAuth from '../../hooks/useAuth';

/**
 * Login form component
 */
const LoginForm = () => {
  const [form] = Form.useForm();
  const { login, loading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Handle form submission
   * @param {Object} values - Form values
   */
  const onFinish = async (values) => {
    const { username, password, remember } = values;
    
    // Save username to localStorage if remember is checked
    if (remember) {
      localStorage.setItem('rememberedUsername', username);
    } else {
      localStorage.removeItem('rememberedUsername');
    }
    
    await login(username, password);
  };

  // Get remembered username from localStorage
  const rememberedUsername = localStorage.getItem('rememberedUsername');

  return (
    <Form
      form={form}
      name="login"
      initialValues={{ 
        remember: !!rememberedUsername,
        username: rememberedUsername || '' 
      }}
      onFinish={onFinish}
      size="large"
      layout="vertical"
    >
      <Form.Item
        name="username"
        label="Tên đăng nhập"
        rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
      >
        <Input 
          prefix={<UserOutlined className="site-form-item-icon" />} 
          placeholder="Username" 
          autoComplete="username"
        />
      </Form.Item>

      <Form.Item
        name="password"
        label="Mật khẩu"
        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
        extra={
          <Tooltip title="Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số">
            <QuestionCircleOutlined /> Yêu cầu mật khẩu
          </Tooltip>
        }
      >
        <Input.Password
          prefix={<LockOutlined className="site-form-item-icon" />}
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          autoComplete="current-password"
          visibilityToggle={{ visible: showPassword, onVisibleChange: setShowPassword }}
        />
      </Form.Item>

      {error && (
        <div style={{ color: '#ff4d4f', marginBottom: 24 }}>
          {error}
        </div>
      )}

      <Form.Item>
        <Form.Item name="remember" valuePropName="checked" noStyle>
          <Checkbox>Ghi nhớ đăng nhập</Checkbox>
        </Form.Item>
        <a href="#forgot-password" className="login-form-forgot">
          Quên mật khẩu?
        </a>
      </Form.Item>

      <Form.Item>
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={loading}
          className="login-form-button"
        >
          Đăng nhập
        </Button>
      </Form.Item>
    </Form>
  );
};

export default LoginForm;