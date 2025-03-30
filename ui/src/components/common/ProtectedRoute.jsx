// ProtectedRoute.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

/**
 * Protects routes that require authentication
 * @param {node} children - The route component to render
 * @param {array} requiredRoles - Roles required to access the route
 */
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading while auth state is being checked
  if (loading) {
    return <div className="iw-loading-page">Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if roles are specified
  if (requiredRoles.length > 0) {
    const userHasRequiredRole = user.roles.some(role => requiredRoles.includes(role));
    
    if (!userHasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Render the protected route
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node,
  requiredRoles: PropTypes.arrayOf(PropTypes.string)
};

export default ProtectedRoute;