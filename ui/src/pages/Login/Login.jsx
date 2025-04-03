import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import LoginForm from './LoginForm';
import { useAuth, useTheme } from '../../hooks';
import './Login.scss';

/**
 * Component trang đăng nhập
 * 
 * @returns {JSX.Element} Component trang đăng nhập
 */
const Login = () => {
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy đường dẫn chuyển hướng từ location state hoặc mặc định là '/dashboard'
  const redirectPath = location.state?.from?.pathname || '/dashboard';

  // Kiểm tra nếu người dùng đã đăng nhập, chuyển hướng đến trang đích
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  return (
    <div className={`login-page ${theme}`}>
      <div className="login-container">
        <div className="login-logo-section">
          <div className="logo-container">
            <img 
              src="/images/logo.svg" 
              alt="Infrawatch Logo" 
              className="logo" 
            />
            <h1 className="logo-text">Infrawatch</h1>
          </div>
          <div className="tagline">
            <h2>Quản lý máy ảo đa nền tảng</h2>
            <p>Giám sát và quản lý máy ảo trên nhiều nền tảng đám mây</p>
          </div>
          <div className="provider-logos">
            <img src="/images/providers/aws.svg" alt="AWS" className="provider-logo" />
            <img src="/images/providers/azure.svg" alt="Azure" className="provider-logo" />
            <img src="/images/providers/gcp.svg" alt="Google Cloud" className="provider-logo" />
            <img src="/images/providers/vmware.svg" alt="VMware" className="provider-logo" />
          </div>
        </div>
        
        <div className="login-form-section">
          <div className="login-form-container">
            <h2 className="login-title">Đăng nhập</h2>
            <p className="login-subtitle">Vui lòng đăng nhập để tiếp tục</p>
            
            <LoginForm />
            
            <div className="login-options">
              <div className="remember-me">
                <input type="checkbox" id="remember-me" />
                <label htmlFor="remember-me">Ghi nhớ đăng nhập</label>
              </div>
              <Link to="/forgot-password" className="forgot-password">
                Quên mật khẩu?
              </Link>
            </div>
            
            <div className="register-option">
              <p>
                Chưa có tài khoản?{' '}
                <Link to="/register" className="register-link">
                  Đăng ký ngay
                </Link>
              </p>
            </div>
            
            <div className="login-footer">
              <p>&copy; {new Date().getFullYear()} Infrawatch. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;