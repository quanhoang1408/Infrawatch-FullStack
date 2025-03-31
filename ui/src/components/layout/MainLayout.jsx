// MainLayout.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import { Spinner } from '../common';
import { NotificationPanel } from '../common';
import useNotification from '../../hooks/useNotification';
import './MainLayout.scss';

/**
 * Main layout component that wraps all authenticated pages
 * @param {node} children - Page content
 */
const MainLayout = ({ children }) => {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const { notifications, clearAllNotifications } = useNotification();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationsPanelVisible, setNotificationsPanelVisible] = useState(false);

  // Add theme class to body
  useEffect(() => {
    document.body.className = `theme-${theme}`;
    return () => {
      document.body.className = '';
    };
  }, [theme]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleNotificationsPanel = () => {
    setNotificationsPanelVisible(!notificationsPanelVisible);
  };

  if (loading) {
    return (
      <div className="iw-loading-layout">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`iw-main-layout ${sidebarCollapsed ? 'iw-main-layout--collapsed' : ''}`}>
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={toggleSidebar} 
        user={user}
      />
      
      <div className="iw-main-layout__content">
        <Header 
          user={user}
          onMenuClick={toggleSidebar}
          onNotificationsClick={toggleNotificationsPanel}
          notificationsCount={notifications.length}
        />
        
        <main className="iw-main-layout__main">
          {children || <Outlet />}
        </main>
        
        <Footer />
      </div>
      
      <NotificationPanel
        visible={notificationsPanelVisible}
        onClose={() => setNotificationsPanelVisible(false)}
        notifications={notifications}
        onClearAll={clearAllNotifications}
      />
    </div>
  );
};

MainLayout.propTypes = {
  children: PropTypes.node
};

export default MainLayout;