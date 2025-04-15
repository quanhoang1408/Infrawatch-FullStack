import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import LoginForm from './LoginForm';
import { toast } from '../../components/feedback/ToastContainer';
import './Login.scss';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  
  // Get the redirect path from location state or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';
  
  const handleLogin = async (credentials) => {
    setLoading(true);
    
    try {
      await login(credentials);
      
      // Show success toast
      toast.success('Login successful! Redirecting...');
      
      // Navigate to the redirect path
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1000);
    } catch (error) {
      // Show error toast
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login-page">
      <div className="login-page__content">
        <div className="login-page__brand">
          <img src="/images/logo.svg" alt="Infrawatch" className="login-page__logo" />
          <h1>Infrawatch</h1>
        </div>
        
        <div className="auth-form">
          <div className="auth-form__header">
            <h2>Welcome Back</h2>
            <p>Log in to your account to continue</p>
          </div>
          
          <LoginForm onSubmit={handleLogin} loading={loading} />
          
          <div className="auth-form__footer">
            Don't have an account? <Link to="/register">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;