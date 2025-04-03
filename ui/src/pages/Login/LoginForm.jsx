import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks';

/**
 * Component form đăng nhập
 * 
 * @returns {JSX.Element} Component form đăng nhập
 */
const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  /**
   * Xác thực form đăng nhập
   * 
   * @returns {boolean} Kết quả xác thực
   */
  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!username.trim()) {
      errors.username = 'Vui lòng nhập tên đăng nhập';
      isValid = false;
    }

    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu';
      isValid = false;
    } else if (password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  /**
   * Xử lý đăng nhập khi submit form
   * 
   * @param {Event} e - Sự kiện submit form
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await login(username, password);
      // Nếu đăng nhập thành công, useAuth sẽ tự động cập nhật trạng thái
      // và component Login sẽ chuyển hướng
    } catch (err) {
      // Lỗi đã được xử lý trong hook useAuth
      console.log('Login error:', err);
    }
  };

  /**
   * Hiển thị hoặc ẩn mật khẩu
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="username">Tên đăng nhập</label>
        <div className="input-wrapper">
          <span className="input-icon">
            <i className="fas fa-user"></i>
          </span>
          <input
            type="text"
            id="username"
            className={`form-control ${formErrors.username ? 'is-invalid' : ''}`}
            placeholder="Nhập tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
        </div>
        {formErrors.username && (
          <div className="error-message">{formErrors.username}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="password">Mật khẩu</label>
        <div className="input-wrapper">
          <span className="input-icon">
            <i className="fas fa-lock"></i>
          </span>
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            className={`form-control ${formErrors.password ? 'is-invalid' : ''}`}
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={togglePasswordVisibility}
          >
            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>
        {formErrors.password && (
          <div className="error-message">{formErrors.password}</div>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
            Đang đăng nhập...
          </>
        ) : (
          'Đăng nhập'
        )}
      </button>

      <div className="social-login">
        <div className="divider">
          <span>Hoặc đăng nhập với</span>
        </div>
        <div className="social-buttons">
          <button type="button" className="btn btn-social btn-google">
            <i className="fab fa-google"></i>
            Google
          </button>
          <button type="button" className="btn btn-social btn-github">
            <i className="fab fa-github"></i>
            GitHub
          </button>
        </div>
      </div>
    </form>
  );
};

export default LoginForm;