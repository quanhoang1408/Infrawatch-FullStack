import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, Badge, theme } from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  BellOutlined,
  LogoutOutlined,
  SettingOutlined,
  BulbOutlined
} from '@ant-design/icons';
import routes from '../../routes';
import useAuth from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import NotificationPanel from '../common/NotificationPanel';
import './MainLayout.scss';

const { Header, Sider, Content } = Layout;

/**
 * Main layout component with sidebar, header, and content
 */
const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const { user, logout } = useAuth();
  const { theme: currentTheme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  // Get current pathname for active menu item
  const pathname = location.pathname;

  // Build menu items from routes
  const buildMenuItems = (routes) => {
    return routes
      .filter(route => route.showInMenu)
      .map(route => {
        const item = {
          key: route.path,
          icon: route.icon,
          label: route.name,
        };

        if (route.children) {
          item.children = buildMenuItems(route.children);
        }

        return item;
      });
  };

  const menuItems = buildMenuItems(routes);

  // Get current page title from routes
  const getCurrentPageTitle = () => {
    // Find in main routes
    let current = routes.find(route => 
      pathname === route.path || pathname.startsWith(`${route.path}/`));
    
    if (!current) return 'Infrawatch';
    
    // Check for child routes if exists
    if (current.children) {
      const childRoute = current.children.find(route => pathname === route.path);
      if (childRoute) {
        return `${current.name} - ${childRoute.name}`;
      }
    }
    
    return current.name;
  };

  // User menu items
  const userMenuItems = [
    {
      key: 'profile',
      label: 'Thông tin cá nhân',
      icon: <UserOutlined />,
      onClick: () => navigate('/settings/profile')
    },
    {
      key: 'settings',
      label: 'Cài đặt',
      icon: <SettingOutlined />,
      onClick: () => navigate('/settings')
    },
    {
      key: 'theme',
      label: currentTheme === 'light' ? 'Chế độ tối' : 'Chế độ sáng',
      icon: <BulbOutlined />,
      onClick: toggleTheme
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
      icon: <LogoutOutlined />,
      onClick: logout
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme={currentTheme}
        width={250}
        style={{
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          zIndex: 999,
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
        }}
      >
        <div className="logo">
          {collapsed ? 'IW' : 'Infrawatch'}
        </div>
        <Menu
          theme={currentTheme}
          mode="inline"
          selectedKeys={[pathname]}
          defaultOpenKeys={['/settings']}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: 0,
            background: token.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 1,
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <h2 style={{ margin: 0 }}>{getCurrentPageTitle()}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginRight: '24px' }}>
            <Badge count={5} dot>
              <Button 
                type="text" 
                icon={<BellOutlined />} 
                style={{ fontSize: '16px' }}
                onClick={() => setNotificationVisible(!notificationVisible)}
              />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ cursor: 'pointer', marginLeft: '16px', display: 'flex', alignItems: 'center' }}>
                <Avatar style={{ marginRight: '8px' }} icon={<UserOutlined />} />
                <span>{user?.name || 'Admin'}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: token.colorBgContainer,
            borderRadius: token.borderRadius,
            minHeight: 280,
            overflow: 'auto'
          }}
        >
          <Outlet />
        </Content>
      </Layout>
      
      {notificationVisible && (
        <NotificationPanel 
          visible={notificationVisible} 
          onClose={() => setNotificationVisible(false)} 
        />
      )}
    </Layout>
  );
};

export default MainLayout;