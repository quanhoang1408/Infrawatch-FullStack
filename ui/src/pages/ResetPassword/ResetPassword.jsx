import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { toast } from '../../components/feedback/ToastContainer';
import './ResetPassword.scss';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Extract token from URL query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tokenParam = queryParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Token không hợp lệ hoặc đã hết hạn');
    }
  }, [location]);

  const validateForm = () => {
    if (!password) {
      setError('Vui lòng nhập mật khẩu mới');
      return false;
    }
    
    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return false;
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        password,
      });
      
      setSuccess(true);
      toast.success('Mật khẩu đã được đặt lại thành công');
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
      toast.error('Không thể đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-page__content">
        <div className="reset-password-page__brand">
          <img src="/images/logo.svg" alt="Infrawatch" className="reset-password-page__logo" />
          <h1>Infrawatch</h1>
        </div>
        
        <div className="auth-form">
          <div className="auth-form__header">
            <h2>Đặt lại mật khẩu</h2>
            <p>Tạo mật khẩu mới cho tài khoản của bạn</p>
          </div>
          
          {success ? (
            <div className="reset-password__success">
              <div className="reset-password__success-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>Mật khẩu đã được đặt lại</h3>
              <p>
                Mật khẩu của bạn đã được đặt lại thành công. Bạn sẽ được chuyển hướng đến trang đăng nhập trong vài giây.
              </p>
              <div className="reset-password__actions">
                <Link to="/login" className="btn btn--primary btn--block">
                  Đăng nhập ngay
                </Link>
              </div>
            </div>
          ) : (
            <form className="reset-password-form" onSubmit={handleSubmit}>
              {!token && (
                <div className="reset-password__error">
                  <p>Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.</p>
                  <Link to="/forgot-password" className="btn btn--primary btn--block">
                    Quên mật khẩu
                  </Link>
                </div>
              )}
              
              {token && (
                <>
                  <div className="form__group">
                    <label htmlFor="password" className="form__label">Mật khẩu mới</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      className={`form__input ${error ? 'has-error' : ''}`}
                      placeholder="Nhập mật khẩu mới"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      disabled={loading}
                      autoComplete="new-password"
                    />
                    <span className="form__hint">Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số</span>
                  </div>
                  
                  <div className="form__group">
                    <label htmlFor="confirmPassword" className="form__label">Xác nhận mật khẩu</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      className={`form__input ${error ? 'has-error' : ''}`}
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError('');
                      }}
                      disabled={loading}
                      autoComplete="new-password"
                    />
                  </div>
                  
                  {error && <div className="form__error-message">{error}</div>}
                  
                  <button
                    type="submit"
                    className={`btn btn--primary btn--block ${loading ? 'btn--loading' : ''}`}
                    disabled={loading || !token}
                  >
                    {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                  </button>
                </>
              )}
              
              <div className="reset-password__footer">
                <Link to="/login" className="reset-password__back">
                  Quay lại đăng nhập
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
