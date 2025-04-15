import React from 'react';
import useAuth from '../../hooks/useAuth';
import './Header.scss';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  
  return (
    <header className="header">
      <div className="header__left">
        <button className="header__menu-toggle" onClick={toggleSidebar}>
          <span className="header__menu-icon">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>
      
      <div className="header__right">
        <div className="header__user">
          <div className="header__user-info">
            <span className="header__user-name">{user?.name}</span>
            <span className="header__user-role">{user?.role || 'user'}</span>
          </div>
          <div className="header__user-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="header__dropdown">
            <div className="header__dropdown-content">
              <a href="/settings/profile" className="header__dropdown-item">Profile</a>
              <a href="/settings" className="header__dropdown-item">Settings</a>
              <div className="header__dropdown-divider"></div>
              <button onClick={logout} className="header__dropdown-item header__dropdown-item--danger">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;