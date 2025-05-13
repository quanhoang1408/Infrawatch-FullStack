import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { SSEProvider } from './context/SSEContext';
import { VMProvider } from './context/VMContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import ToastContainer from './components/feedback/ToastContainer';
import { MainLayout } from './components/layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import VMList from './pages/VMList';
import VMDetail from './pages/VMDetail/VMDetail';
import Terminal from './pages/Terminal';
import Settings from './pages/Settings';
import Providers from './pages/Admin/Providers';
import Users from './pages/Admin/Users';
import VMAssignments from './pages/Admin/VMAssignments';
import NotFound from './pages/NotFound';

// Styles
import './styles/index.scss';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <SSEProvider>
            <VMProvider>
              <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/vm" element={<VMList />} />
                  <Route path="/vm/:vmId" element={<VMDetail />} />
                  <Route path="/vm/:vmId/terminal" element={<Terminal />} />
                  <Route path="/settings/*" element={<Settings />} />

                  {/* Admin routes */}
                  <Route element={<AdminRoute />}>
                    <Route path="/admin/providers" element={<Providers />} />
                    <Route path="/admin/users" element={<Users />} />
                    <Route path="/admin/vm-assignments" element={<VMAssignments />} />
                  </Route>

                  {/* Add more protected routes here in the future */}
                </Route>
              </Route>

              {/* Redirects */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Support for old URL format */}
              <Route path="/vms/:vmId/terminal" element={<Terminal />} />

              {/* Not found route */}
              <Route path="*" element={<NotFound />} />
            </Routes>

            {/* Toast notifications */}
            <ToastContainer />
            </VMProvider>
          </SSEProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;