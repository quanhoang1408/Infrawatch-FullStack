import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const LoginForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
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
      onSubmit(formData);
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
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
        <div className="form__group-header">
          <label htmlFor="password" className="form__label">Mật khẩu</label>
          <Link to="/forgot-password" className="form__link" tabIndex="-1">Quên mật khẩu?</Link>
        </div>
        <input
          type="password"
          id="password"
          name="password"
          className={`form__input ${errors.password ? 'has-error' : ''}`}
          placeholder="Nhập mật khẩu của bạn"
          value={formData.password}
          onChange={handleChange}
          disabled={loading}
          autoComplete="current-password"
        />
        {errors.password && <span className="form__error">{errors.password}</span>}
      </div>

      <div className="form__group form__check">
        <input
          type="checkbox"
          id="remember"
          name="remember"
          className="form__checkbox"
        />
        <label htmlFor="remember">Ghi nhớ đăng nhập</label>
      </div>

      <button
        type="submit"
        className={`btn btn--primary btn--block ${loading ? 'btn--loading' : ''}`}
        disabled={loading}
      >
        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>
    </form>
  );
};

export default LoginForm;