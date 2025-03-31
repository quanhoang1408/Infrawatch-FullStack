// Header.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Dropdown, Button, Search } from '../common';
import useTheme from '../../hooks/useTheme';
import * as ROUTES from '../../constants/routes.constants';
import './Header.scss';

/**
 * Header component for the main layout
 * @param {object} user - Current user data
 * @param {function} onMenuClick - Called when menu button is clicked
 * @param {function} onNotificationsClick - Called when notifications button is clicked
 * @param {number} notificationsCount - Number of unread notifications
 */
const Header = ({ 
  user,
  onMenuClick,
  onNotificationsClick,
  notificationsCount = 0
}) => {
  const { theme, toggleTheme } = useTheme();
  const [searchVisible, setSearchVisible] = useState(false);

  const handleSearch = (query) => {
    console.log('Search:', query);
    // Implement search functionality
  };

  const handleLogout = () => {
    // Implement logout functionality
  };

  const userMenuItems = (
    <>
      <Dropdown.Item>
        <Link to={ROUTES.PROFILE} className="iw-header__dropdown-link">
          <i className="icon-user" />
          <span>Profile</span>
        </Link>
      </Dropdown.Item>
      <Dropdown.Item>
        <Link to={ROUTES.SETTINGS} className="iw-header__dropdown-link">
          <i className="icon-settings" />
          <span>Settings</span>
        </Link>
      </Dropdown.Item>
      <Dropdown.Divider />
      <Dropdown.Item onClick={handleLogout}>
        <div className="iw-header__dropdown-link">
          <i className="icon-logout" />
          <span>Logout</span>
        </div>
      </Dropdown.Item>
    </>
  );

  return (
    <header className="iw-header">
      <div className="iw-header__left">
        <Button
          variant="text"
          className="iw-header__menu-button"
          onClick={onMenuClick}
          icon={<i className="icon-menu" />}
          aria-label="Toggle menu"
        />
        
        <div className="iw-header__breadcrumb-container">
          {/* BreadcrumbNav would go here */}
        </div>
      </div>
      
      <div className="iw-header__right">
        {searchVisible ? (
          <div className="iw-header__search-container">
            <Search
              placeholder="Search..."
              onSearch={handleSearch}
              defaultValue=""
            />
            <Button
              variant="text"
              className="iw-header__search-close"
              onClick={() => setSearchVisible(false)}
              icon={<i className="icon-close" />}
              aria-label="Close search"
            />
          </div>
        ) : (
          <Button
            variant="text"
            className="iw-header__action-button"
            onClick={() => setSearchVisible(true)}
            icon={<i className="icon-search" />}
            aria-label="Search"
          />
        )}
        
        <Button
          variant="text"
          className="iw-header__action-button"
          onClick={toggleTheme}
          icon={<i className={`icon-${theme === 'dark' ? 'sun' : 'moon'}`} />}
          aria-label="Toggle theme"
        />
        
        <div className="iw-header__notifications">
          <Button
            variant="text"
            className="iw-header__action-button"
            onClick={onNotificationsClick}
            icon={<i className="icon-bell" />}
            aria-label="Notifications"
          />
          {notificationsCount > 0 && (
            <span className="iw-header__notification-badge">
              {notificationsCount > 99 ? '99+' : notificationsCount}
            </span>
          )}
        </div>
        
        <div className="iw-header__user">
          <Dropdown
            trigger={
              <button className="iw-header__user-trigger">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="iw-header__user-avatar" />
                ) : (
                  <div className="iw-header__user-initials">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="iw-header__user-name">{user.name}</span>
                <i className="icon-chevron-down iw-header__user-icon" />
              </button>
            }
            placement="bottom-right"
          >
            {userMenuItems}
          </Dropdown>
        </div>
      </div>
    </header>
  );
};

Header.propTypes = {
  user: PropTypes.object.isRequired,
  onMenuClick: PropTypes.func,
  onNotificationsClick: PropTypes.func,
  notificationsCount: PropTypes.number
};

export default Header;