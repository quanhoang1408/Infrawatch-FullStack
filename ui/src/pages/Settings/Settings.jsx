import React from 'react';
import { Card } from 'antd';
import ProfileSettings from './ProfileSettings';
import './Settings.scss';

/**
 * Settings page component - Simplified to only show profile settings
 */
const Settings = () => {
  return (
    <div className="settings-container">
      <Card className="settings-card">
        <div className="settings-content">
          <ProfileSettings />
        </div>
      </Card>
    </div>
  );
};

export default Settings;