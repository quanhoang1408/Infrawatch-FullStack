import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Typography, Divider, Space, Alert, Tabs } from 'antd';
import { LockOutlined, LoginOutlined } from '@ant-design/icons';
import LoginForm from './LoginForm';
import useAuth from '../../hooks/useAuth';
import './Login.scss';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

/**
 * Login page component
 */
const Login = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="login-container">
      <div className="login-background"></div>
      <div className="login-content">
        <Card className="login-card">
          <div className="login-header">
            <div className="logo-text">Infrawatch</div>
            <Text type="secondary" className="subtitle">Quản lý hạ tầng đám mây tập trung</Text>
          </div>
          
          <Tabs defaultActiveKey="login" centered>
            <TabPane 
              tab={
                <span>
                  <LoginOutlined />
                  Đăng nhập
                </span>
              } 
              key="login"
            >
              <div className="login-form">
                <LoginForm />
                
                <Divider>Hoặc</Divider>
                
                <div className="social-login">
                  <div className="social-button google">
                    <i className="fa fa-google"></i>
                  </div>
                  <div className="social-button facebook">
                    <i className="fa fa-facebook"></i>
                  </div>
                  <div className="social-button github">
                    <i className="fa fa-github"></i>
                  </div>
                </div>
                
                <div className="register-link">
                  <Text type="secondary">Chưa có tài khoản? </Text>
                  <Link to="/register">Đăng ký ngay</Link>
                </div>
              </div>
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <LockOutlined />
                  Quên mật khẩu
                </span>
              } 
              key="forgot"
            >
              <div className="login-form">
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Alert
                    message="Khôi phục mật khẩu"
                    description="Nhập email đăng ký tài khoản của bạn. Chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu đến email của bạn."
                    type="info"
                    showIcon
                  />
                  
                  {/* Forgot password form would go here */}
                  
                  <div className="register-link">
                    <Text type="secondary">Đã nhớ mật khẩu? </Text>
                    <Link to="/login">Đăng nhập</Link>
                  </div>
                </Space>
              </div>
            </TabPane>
          </Tabs>
        </Card>
      </div>
      
      {loading && (
        <div className="login-loading">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
};

export default Login;