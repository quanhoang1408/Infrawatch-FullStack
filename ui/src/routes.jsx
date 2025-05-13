import { Navigate } from 'react-router-dom';
import {
  DashboardOutlined,
  CloudServerOutlined,
  UserOutlined
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import VMList from './pages/VMList';
import VMDetail from './pages/VMDetail';
import Terminal from './pages/Terminal';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Routes configuration for the main application
// This is used for both routing and sidebar navigation
const routes = [
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
    exact: true,
    showInMenu: false
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    element: <Dashboard />,
    icon: <DashboardOutlined />,
    showInMenu: true
  },
  {
    path: '/vms',
    name: 'Máy ảo',
    element: <VMList />,
    icon: <CloudServerOutlined />,
    showInMenu: true
  },
  {
    path: '/vms/:id',
    name: 'Chi tiết máy ảo',
    element: <VMDetail />,
    showInMenu: false
  },
  {
    path: '/vms/:id/terminal',
    name: 'Terminal SSH',
    element: <Terminal />,
    showInMenu: false
  },
  {
    path: '/settings',
    name: 'Thông tin cá nhân',
    element: <Settings />,
    icon: <UserOutlined />,
    showInMenu: true
  },
  {
    path: '*',
    element: <NotFound />,
    showInMenu: false
  }
];

export default routes;