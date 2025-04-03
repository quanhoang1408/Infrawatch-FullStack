import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useNotification } from '../../hooks';

/**
 * Component form đăng ký
 * 
 * @returns {JSX.Element} Component form đăng ký
 */
const RegisterForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    company: '',
    jobTitle: '',
    agreeTerms: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const { register, loading, error } = useAuth();
  const { showSuccess } = useNotification();
  const navigate = useNavigate();

  /**
   * Cập nhật giá trị form khi người dùng nhập
   * 
   * @param {Event} e - Sự kiện change của input
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Xóa lỗi khi người dùng bắt đầu sửa trường đó
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  /**
   * Xác thực form đăng ký cho bước 1
   * 
   * @returns {boolean} Kết quả xác thực
   */
  const validateStep1 = () => {
    const errors = {};
    let isValid = true;

    if (!formData.fullName.trim()) {
      errors.fullName = 'Vui lòng nhập họ và tên';
      isValid = false;
    }

    if (!formData.email.trim()) {
      errors.email = 'Vui lòng nhập email';
      isValid = false;
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
      isValid = false;
    }

    if (!formData.username.trim()) {
      errors.username = 'Vui lòng nhập tên đăng nhập';
      isValid = false;
    } else if (formData.username.length < 4) {
      errors.username = 'Tên đăng nhập phải có ít nhất 4 ký tự';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  /**
   * Xác thực form đăng ký cho bước 2
   * 
   * @returns {boolean} Kết quả xác thực
   */
  const validateStep2 = () => {
    const errors = {};
    let isValid = true;

    if (!formData.password) {
      errors.password = 'Vui lòng nhập mật khẩu';
      isValid = false;
    } else if (formData.password.length < 8) {
      errors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
      isValid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Mật khẩu phải bao gồm chữ hoa, chữ thường và số';
      isValid = false;
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      isValid = false;
    }

    if (!formData.agreeTerms) {
      errors.agreeTerms = 'Bạn phải đồng ý với điều khoản dịch vụ';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  /**
   * Xử lý chuyển sang bước tiếp theo
   */
  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  /**
   * Xử lý quay lại bước trước
   */
  const handlePrevStep = () => {
    setStep(1);
  };

  /**
   * Xử lý đăng ký khi submit form
   * 
   * @param {Event} e - Sự kiện submit form
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (step === 1) {
      handleNextStep();
      return;
    }

    if (!validateStep2()) {
      return;
    }

    try {
      await register(formData);
      showSuccess(
        'Đăng ký thành công',
        'Tài khoản của bạn đã được tạo, vui lòng đăng nhập để tiếp tục.'
      );
      navigate('/login');
    } catch (err) {
      // Lỗi đã được xử lý trong hook useAuth
      console.log('Registration error:', err);
    }
  };

  /**
   * Hiển thị hoặc ẩn mật khẩu
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  /**
   * Hiển thị hoặc ẩn mật khẩu xác nhận
   */
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <form className="register-form" onSubmit={handleSubmit} noValidate>
      {step === 1 ? (
        // Step 1: Thông tin cơ bản
        <>
          <div className="form-group">
            <label htmlFor="fullName">Họ và tên</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <i className="fas fa-user"></i>
              </span>
              <input
                type="text"
                id="fullName"
                name="fullName"
                className={`form-control ${formErrors.fullName ? 'is-invalid' : ''}`}
                placeholder="Nhập họ và tên của bạn"
                value={formData.fullName}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            {formErrors.fullName && (
              <div className="error-message">{formErrors.fullName}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <i className="fas fa-envelope"></i>
              </span>
              <input
                type="email"
                id="email"
                name="email"
                className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                placeholder="Nhập địa chỉ email của bạn"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            {formErrors.email && (
              <div className="error-message">{formErrors.email}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="username">Tên đăng nhập</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <i className="fas fa-at"></i>
              </span>
              <input
                type="text"
                id="username"
                name="username"
                className={`form-control ${formErrors.username ? 'is-invalid' : ''}`}
                placeholder="Tạo tên đăng nhập"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            {formErrors.username && (
              <div className="error-message">{formErrors.username}</div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="company">Công ty (Không bắt buộc)</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <i className="fas fa-building"></i>
                </span>
                <input
                  type="text"
                  id="company"
                  name="company"
                  className="form-control"
                  placeholder="Tên công ty"
                  value={formData.company}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="jobTitle">Chức danh (Không bắt buộc)</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <i className="fas fa-briefcase"></i>
                </span>
                <input
                  type="text"
                  id="jobTitle"
                  name="jobTitle"
                  className="form-control"
                  placeholder="Vị trí công việc"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={handleNextStep}
            disabled={loading}
          >
            Tiếp theo
          </button>
        </>
      ) : (
        // Step 2: Thông tin bảo mật
        <>
          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <i className="fas fa-lock"></i>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                className={`form-control ${formErrors.password ? 'is-invalid' : ''}`}
                placeholder="Tạo mật khẩu"
                value={formData.password}
                onChange={handleChange}
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
            <div className="password-strength">
              <div className="strength-meter">
                <div
                  className={`strength-meter-fill ${
                    formData.password.length > 0
                      ? formData.password.length < 8
                        ? 'weak'
                        : /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)
                        ? 'strong'
                        : 'medium'
                      : ''
                  }`}
                  style={{
                    width: formData.password.length > 0
                      ? formData.password.length < 8
                        ? '30%'
                        : /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)
                        ? '100%'
                        : '60%'
                      : '0%'
                  }}
                ></div>
              </div>
              <div className="strength-text">
                {formData.password.length > 0 && (
                  <span className={
                    formData.password.length < 8
                      ? 'weak'
                      : /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)
                      ? 'strong'
                      : 'medium'
                  }>
                    {formData.password.length < 8
                      ? 'Yếu'
                      : /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)
                      ? 'Mạnh'
                      : 'Trung bình'}
                  </span>
                )}
              </div>
            </div>
            <div className="password-hints">
              <p>Mật khẩu phải đáp ứng các điều kiện sau:</p>
              <ul>
                <li className={formData.password.length >= 8 ? 'valid' : ''}>
                  <i className={`fas ${formData.password.length >= 8 ? 'fa-check' : 'fa-times'}`}></i>
                  Ít nhất 8 ký tự
                </li>
                <li className={/[A-Z]/.test(formData.password) ? 'valid' : ''}>
                  <i className={`fas ${/[A-Z]/.test(formData.password) ? 'fa-check' : 'fa-times'}`}></i>
                  Ít nhất một chữ hoa
                </li>
                <li className={/[a-z]/.test(formData.password) ? 'valid' : ''}>
                  <i className={`fas ${/[a-z]/.test(formData.password) ? 'fa-check' : 'fa-times'}`}></i>
                  Ít nhất một chữ thường
                </li>
                <li className={/\d/.test(formData.password) ? 'valid' : ''}>
                  <i className={`fas ${/\d/.test(formData.password) ? 'fa-check' : 'fa-times'}`}></i>
                  Ít nhất một chữ số
                </li>
              </ul>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <i className="fas fa-lock"></i>
              </span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                className={`form-control ${formErrors.confirmPassword ? 'is-invalid' : ''}`}
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={toggleConfirmPasswordVisibility}
              >
                <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            {formErrors.confirmPassword && (
              <div className="error-message">{formErrors.confirmPassword}</div>
            )}
          </div>

          <div className="form-group checkbox-group">
            <div className="custom-checkbox">
              <input
                type="checkbox"
                id="agreeTerms"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                disabled={loading}
              />
              <label htmlFor="agreeTerms">
                Tôi đồng ý với <a href="/terms" target="_blank" rel="noopener noreferrer">Điều khoản dịch vụ</a> và <a href="/privacy" target="_blank" rel="noopener noreferrer">Chính sách bảo mật</a>
              </label>
            </div>
            {formErrors.agreeTerms && (
              <div className="error-message">{formErrors.agreeTerms}</div>
            )}
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handlePrevStep}
              disabled={loading}
            >
              Quay lại
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                  Đang đăng ký...
                </>
              ) : (
                'Đăng ký'
              )}
            </button>
          </div>
        </>
      )}

      <div className="social-register">
        <div className="divider">
          <span>Hoặc đăng ký với</span>
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

export default RegisterForm;