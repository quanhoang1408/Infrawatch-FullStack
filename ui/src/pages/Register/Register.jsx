import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RegisterForm from './RegisterForm';
import { useAuth, useTheme } from '../../hooks';
import './Register.scss';

/**
 * Component trang đăng ký
 * 
 * @returns {JSX.Element} Component trang đăng ký
 */
const Register = () => {
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Kiểm tra nếu người dùng đã đăng nhập, chuyển hướng đến trang dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className={`register-page ${theme}`}>
      <div className="register-container">
        <div className="register-header">
          <Link to="/" className="logo-link">
            <div className="logo-container">
              <img 
                src="/images/logo.svg" 
                alt="Infrawatch Logo" 
                className="logo" 
              />
              <h1 className="logo-text">Infrawatch</h1>
            </div>
          </Link>
        </div>

        <div className="register-content">
          <div className="register-info-section">
            <h2 className="section-title">Quản lý máy ảo đơn giản và hiệu quả</h2>
            <p className="section-description">
              Infrawatch giúp bạn dễ dàng giám sát và quản lý hạ tầng đám mây trên nhiều nền tảng khác nhau từ một giao diện thống nhất.
            </p>

            <div className="features-list">
              <div className="feature-item">
                <div className="feature-icon">
                  <i className="fas fa-cloud"></i>
                </div>
                <div className="feature-content">
                  <h3>Đa nền tảng</h3>
                  <p>Hỗ trợ AWS, Azure, Google Cloud và VMWare</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div className="feature-content">
                  <h3>Giám sát thời gian thực</h3>
                  <p>Theo dõi tài nguyên và hiệu suất máy ảo</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <i className="fas fa-terminal"></i>
                </div>
                <div className="feature-content">
                  <h3>SSH từ trình duyệt</h3>
                  <p>Truy cập máy ảo trực tiếp từ giao diện web</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <div className="feature-content">
                  <h3>Bảo mật cao</h3>
                  <p>Quản lý SSH certificates tập trung và an toàn</p>
                </div>
              </div>
            </div>

            <div className="testimonial">
              <blockquote>
                "Infrawatch đã giúp chúng tôi tiết kiệm hơn 30% thời gian quản lý hạ tầng đám mây và cải thiện đáng kể hiệu quả vận hành."
              </blockquote>
              <div className="testimonial-author">
                <div className="author-avatar">
                  <img src="/images/avatars/testimonial.jpg" alt="User Avatar" />
                </div>
                <div className="author-info">
                  <p className="author-name">Nguyễn Văn An</p>
                  <p className="author-role">CTO, Tech Solutions</p>
                </div>
              </div>
            </div>
          </div>

          <div className="register-form-section">
            <div className="register-form-container">
              <h2 className="register-title">Tạo tài khoản mới</h2>
              <p className="register-subtitle">Đăng ký để bắt đầu quản lý hạ tầng đám mây của bạn</p>
              
              <RegisterForm />
              
              <div className="login-option">
                <p>
                  Đã có tài khoản?{' '}
                  <Link to="/login" className="login-link">
                    Đăng nhập ngay
                  </Link>
                </p>
              </div>
              
              <div className="register-terms">
                <p>
                  Bằng cách đăng ký, bạn đồng ý với{' '}
                  <Link to="/terms" className="terms-link">
                    Điều khoản dịch vụ
                  </Link>{' '}
                  và{' '}
                  <Link to="/privacy" className="terms-link">
                    Chính sách bảo mật
                  </Link>{' '}
                  của chúng tôi.
                </p>
              </div>
              
              <div className="register-footer">
                <p>&copy; {new Date().getFullYear()} Infrawatch. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;