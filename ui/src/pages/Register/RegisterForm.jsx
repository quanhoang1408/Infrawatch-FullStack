import React, { useState } from 'react';

const RegisterForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name) {
      newErrors.name = 'Vui lòng nhập họ tên';
    }

    if (!formData.email) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      // Remove confirmPassword before submission
      const { confirmPassword, ...registerData } = formData;
      onSubmit(registerData);
    }
  };

  return (
    <form className="register-form" onSubmit={handleSubmit}>
      <div className="form__group">
        <label htmlFor="name" className="form__label">Họ và tên</label>
        <input
          type="text"
          id="name"
          name="name"
          className={`form__input ${errors.name ? 'has-error' : ''}`}
          placeholder="Nhập họ và tên của bạn"
          value={formData.name}
          onChange={handleChange}
          disabled={loading}
          autoComplete="name"
        />
        {errors.name && <span className="form__error">{errors.name}</span>}
      </div>

      <div className="form__group">
        <label htmlFor="email" className="form__label">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          className={`form__input ${errors.email ? 'has-error' : ''}`}
          placeholder="Nhập email của bạn"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
          autoComplete="email"
        />
        {errors.email && <span className="form__error">{errors.email}</span>}
      </div>

      <div className="form__group">
        <label htmlFor="password" className="form__label">Mật khẩu</label>
        <input
          type="password"
          id="password"
          name="password"
          className={`form__input ${errors.password ? 'has-error' : ''}`}
          placeholder="Tạo mật khẩu"
          value={formData.password}
          onChange={handleChange}
          disabled={loading}
          autoComplete="new-password"
        />
        {errors.password && <span className="form__error">{errors.password}</span>}
        <span className="form__hint">Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số</span>
      </div>

      <div className="form__group">
        <label htmlFor="confirmPassword" className="form__label">Xác nhận mật khẩu</label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          className={`form__input ${errors.confirmPassword ? 'has-error' : ''}`}
          placeholder="Nhập lại mật khẩu của bạn"
          value={formData.confirmPassword}
          onChange={handleChange}
          disabled={loading}
          autoComplete="new-password"
        />
        {errors.confirmPassword && <span className="form__error">{errors.confirmPassword}</span>}
      </div>

      <div className="form__group form__check">
        <input
          type="checkbox"
          id="terms"
          name="terms"
          className="form__checkbox"
          required
        />
        <label htmlFor="terms">Tôi đồng ý với <a href="/terms" target="_blank">Điều khoản dịch vụ</a> và <a href="/privacy" target="_blank">Chính sách bảo mật</a></label>
      </div>

      <button
        type="submit"
        className={`btn btn--primary btn--block ${loading ? 'btn--loading' : ''}`}
        disabled={loading}
      >
        {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
      </button>
    </form>
  );
};

export default RegisterForm;