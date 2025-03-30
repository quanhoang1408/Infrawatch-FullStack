import { Navigate } from 'react-router-dom';
import { 
  DashboardOutlined, 
  CloudServerOutlined, 
  SettingOutlined, 
  KeyOutlined, 
  UserOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import VMList from './pages/VMList';
import VMDetail from './pages/VMDetail';
import Terminal from './pages/Terminal';
import Settings from './pages/Settings';
import SSHSettings from './pages/Settings/SSHSettings';
import ProfileSettings from './pages/Settings/ProfileSettings';
import GeneralSettings from './pages/Settings/GeneralSettings';
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
    name: 'Cài đặt',
    element: <Settings />,
    icon: <SettingOutlined />,
    showInMenu: true,
    children: [
      {
        path: '/settings/general',
        name: 'Cài đặt chung',
        element: <GeneralSettings />,
        icon: <SettingOutlined />,
        showInMenu: true
      },
      {
        path: '/settings/profile',
        name: 'Thông tin cá nhân',
        element: <ProfileSettings />,
        icon: <UserOutlined />,
        showInMenu: true
      },
      {
        path: '/settings/ssh',
        name: 'SSH Certificate',
        element: <SSHSettings />,
        icon: <KeyOutlined />,
        showInMenu: true
      },
      {
        path: '/settings/monitoring',
        name: 'Giám sát',
        element: <GeneralSettings />,
        icon: <LineChartOutlined />,
        showInMenu: true
      }
    ]
  },
  {
    path: '*',
    element: <NotFound />,
    showInMenu: false
  }
];

export default routes;