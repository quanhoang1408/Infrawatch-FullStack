import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from '../../components/feedback/ToastContainer';
import './ForgotPassword.scss';

const ForgotPassword = () => {
  // Hiển thị thông báo tính năng đang phát triển
  const handleSubmit = (e) => {
    e.preventDefault();
    toast.info('Tính năng đặt lại mật khẩu đang được phát triển thêm. Vui lòng thử lại sau.');
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-page__content">
        <div className="forgot-password-page__brand">
          <img src="/images/logo.svg" alt="Infrawatch" className="forgot-password-page__logo" />
          <h1>Infrawatch</h1>
        </div>

        <div className="auth-form">
          <div className="auth-form__header">
            <h2>Quên mật khẩu</h2>
            <p>Nhập email của bạn để đặt lại mật khẩu</p>
          </div>

          <form className="forgot-password-form" onSubmit={handleSubmit}>
            <div className="form__group">
              <label htmlFor="email" className="form__label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form__input"
                placeholder="Nhập email của bạn"
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              className="btn btn--primary btn--block"
            >
              Gửi hướng dẫn đặt lại mật khẩu
            </button>

            <div className="forgot-password__footer">
              <Link to="/login" className="forgot-password__back">
                Quay lại đăng nhập
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
