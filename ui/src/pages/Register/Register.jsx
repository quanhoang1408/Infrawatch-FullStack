import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Typography, Steps, Button } from 'antd';
import { 
  UserOutlined, 
  SolutionOutlined, 
  SafetyCertificateOutlined,
  CheckCircleOutlined 
} from '@ant-design/icons';
import RegisterForm from './RegisterForm';
import useAuth from '../../hooks/useAuth';
import '../Login/Login.scss'; // Reuse login styles

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

/**
 * Register page component
 */
const Register = () => {
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
      <div className="login-content" style={{ maxWidth: 520 }}>
        <Card className="login-card">
          <div className="login-header">
            <div className="logo-text">Infrawatch</div>
            <Text type="secondary" className="subtitle">Đăng ký tài khoản mới</Text>
          </div>
          
          <div style={{ padding: '0 24px 16px' }}>
            <Steps
              size="small"
              current={0}
              items={[
                {
                  title: 'Đăng ký',
                  icon: <UserOutlined />,
                },
                {
                  title: 'Xác thực',
                  icon: <SafetyCertificateOutlined />,
                },
                {
                  title: 'Hoàn tất',
                  icon: <CheckCircleOutlined />,
                },
              ]}
            />
          </div>
          
          <div className="login-form">
            <RegisterForm />
            
            <div className="register-link" style={{ marginTop: 24 }}>
              <Text type="secondary">Đã có tài khoản? </Text>
              <Link to="/login">Đăng nhập</Link>
            </div>
          </div>
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

export default Register;