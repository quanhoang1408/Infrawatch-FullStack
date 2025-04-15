import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Spinner from './Spinner';

const AdminRoute = () => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="admin-route__loading">
        <Spinner size="large" centered />
      </div>
    );
  }

  // Redirect to dashboard if not an admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Render child routes if authenticated and is admin
  return <Outlet />;
};

export default AdminRoute;