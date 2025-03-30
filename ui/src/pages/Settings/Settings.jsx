import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Card } from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  KeyOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import GeneralSettings from './GeneralSettings';
import ProfileSettings from './ProfileSettings';
import SSHSettings from './SSHSettings';
import './Settings.scss';

/**
 * Settings page component
 */
const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get current path for active menu item
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('/settings/profile')) return '/settings/profile';
    if (path.includes('/settings/ssh')) return '/settings/ssh';
    if (path.includes('/settings/monitoring')) return '/settings/monitoring';
    return '/settings/general';
  };
  
  const menuItems = [
    {
      key: '/settings/general',
      icon: <SettingOutlined />,
      label: 'Cài đặt chung'
    },
    {
      key: '/settings/profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân'
    },
    {
      key: '/settings/ssh',
      icon: <KeyOutlined />,
      label: 'SSH Certificate'
    },
    {
      key: '/settings/monitoring',
      icon: <LineChartOutlined />,
      label: 'Giám sát'
    }
  ];
  
  return (
    <div className="settings-container">
      <Card className="settings-card">
        <div className="settings-layout">
          <div className="settings-sidebar">
            <Menu
              mode="inline"
              selectedKeys={[getSelectedKey()]}
              items={menuItems}
              onClick={({ key }) => navigate(key)}
              style={{ borderRight: 0 }}
            />
          </div>
          <div className="settings-content">
            <Routes>
              <Route path="/" element={<GeneralSettings />} />
              <Route path="/general" element={<GeneralSettings />} />
              <Route path="/profile" element={<ProfileSettings />} />
              <Route path="/ssh" element={<SSHSettings />} />
              <Route path="/monitoring" element={<GeneralSettings />} />
            </Routes>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;