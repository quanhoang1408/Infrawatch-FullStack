import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { toast } from '../../components/feedback/ToastContainer';
import './ForgotPassword.scss';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate email
    if (!email) {
      setError('Vui lòng nhập email của bạn');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email không hợp lệ');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Gọi API quên mật khẩu
      const response = await api.post('/auth/forgot-password', { email });

      // Trong môi trường thực tế, chúng ta sẽ không nhận được token
      // Ở đây, chúng ta lưu token để dễ dàng kiểm thử
      const resetToken = response.data.token;
      console.log('Reset token for testing:', resetToken);

      setSubmitted(true);
      toast.success('Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn');
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.');
      toast.error('Không thể gửi email đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
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

          {submitted ? (
            <div className="forgot-password__success">
              <div className="forgot-password__success-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>Kiểm tra email của bạn</h3>
              <p>
                Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email <strong>{email}</strong>.
                Vui lòng kiểm tra hộp thư đến của bạn và làm theo hướng dẫn.
              </p>
              <p className="forgot-password__note">
                Nếu bạn không nhận được email trong vòng vài phút, hãy kiểm tra thư mục spam
                hoặc <button onClick={() => setSubmitted(false)} className="forgot-password__resend">thử lại</button>.
              </p>
              <div className="forgot-password__actions">
                <Link to="/login" className="btn btn--primary btn--block">
                  Quay lại đăng nhập
                </Link>
              </div>
            </div>
          ) : (
            <form className="forgot-password-form" onSubmit={handleSubmit}>
              <div className="form__group">
                <label htmlFor="email" className="form__label">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`form__input ${error ? 'has-error' : ''}`}
                  placeholder="Nhập email của bạn"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  disabled={loading}
                  autoComplete="email"
                />
                {error && <span className="form__error">{error}</span>}
              </div>

              <button
                type="submit"
                className={`btn btn--primary btn--block ${loading ? 'btn--loading' : ''}`}
                disabled={loading}
              >
                {loading ? 'Đang gửi...' : 'Gửi hướng dẫn đặt lại mật khẩu'}
              </button>

              <div className="forgot-password__footer">
                <Link to="/login" className="forgot-password__back">
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

export default ForgotPassword;
