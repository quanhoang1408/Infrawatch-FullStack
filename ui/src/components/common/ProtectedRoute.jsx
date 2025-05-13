import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Spinner from './Spinner';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  // Hiển thị spinner đang tải trong khi kiểm tra xác thực
  if (loading) {
    return (
      <div className="protected-route__loading">
        <Spinner size="large" centered />
      </div>
    );
  }

  // Chuyển hướng đến trang đăng nhập nếu chưa xác thực
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Hiển thị các route con nếu đã xác thực
  return <Outlet />;
};

export default ProtectedRoute;