import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import RegisterForm from './RegisterForm';
import { toast } from '../../components/feedback/ToastContainer';
import './Register.scss';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleRegister = async (userData) => {
    setLoading(true);

    try {
      await register(userData);

      // Show success toast
      toast.success('Đăng ký thành công! Đang chuyển hướng đến trang chủ...');

      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1000);
    } catch (error) {
      // Show error toast
      toast.error(error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-page__content">
        <div className="register-page__brand">
          <img src="/images/logo.svg" alt="Infrawatch" className="register-page__logo" />
          <h1>Infrawatch</h1>
        </div>

        <div className="auth-form">
          <div className="auth-form__header">
            <h2>Tạo tài khoản mới</h2>
            <p>Đăng ký để bắt đầu quản lý hạ tầng của bạn</p>
          </div>

          <RegisterForm onSubmit={handleRegister} loading={loading} />

          <div className="auth-form__footer">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;