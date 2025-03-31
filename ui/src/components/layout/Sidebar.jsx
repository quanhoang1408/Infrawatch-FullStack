// Sidebar.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from '../common';
import * as ROUTES from '../../constants/routes.constants';
import './Sidebar.scss';

/**
 * Sidebar navigation component
 * @param {boolean} collapsed - Whether sidebar is collapsed
 * @param {function} onToggle - Called when sidebar toggle is clicked
 * @param {object} user - Current user data
 */
const Sidebar = ({ collapsed = false, onToggle, user }) => {
  const location = useLocation();
  
  const navigationItems = [
    {
      title: 'Dashboard',
      items: [
        { 
          path: ROUTES.DASHBOARD, 
          icon: <i className="icon-dashboard" />, 
          text: 'Dashboard' 
        },
        { 
          path: ROUTES.VM_LIST, 
          icon: <i className="icon-vm" />, 
          text: 'Instances' 
        },
        { 
          path: ROUTES.MONITORING, 
          icon: <i className="icon-monitoring" />, 
          text: 'Monitoring' 
        }
      ]
    },
    {
      title: 'Administration',
      items: [
        { 
          path: ROUTES.ACTIVITIES, 
          icon: <i className="icon-activity" />, 
          text: 'Activity Log' 
        },
        { 
          path: ROUTES.SETTINGS, 
          icon: <i className="icon-settings" />, 
          text: 'Settings' 
        }
      ]
    }
  ];
  
  // Only show admin section for users with admin role
  const showAdminSection = user && user.roles && user.roles.includes('admin');
  
  if (showAdminSection) {
    navigationItems.push({
      title: 'Admin',
      items: [
        { 
          path: ROUTES.ADMIN, 
          icon: <i className="icon-admin" />, 
          text: 'Admin Panel' 
        }
      ]
    });
  }

  return (
    <aside className={`iw-sidebar ${collapsed ? 'iw-sidebar--collapsed' : ''}`}>
      <div className="iw-sidebar__header">
        <div className="iw-sidebar__logo">
          <img src="/images/logo.svg" alt="Infrawatch" className="iw-sidebar__logo-icon" />
          {!collapsed && <span className="iw-sidebar__logo-text">Infrawatch</span>}
        </div>
        <Button 
          variant="text"
          className="iw-sidebar__toggle"
          onClick={onToggle}
          icon={collapsed ? <i className="icon-menu-expand" /> : <i className="icon-menu-collapse" />}
        />
      </div>
      
      {!collapsed && user && (
        <div className="iw-sidebar__user">
          <div className="iw-sidebar__user-avatar">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              <div className="iw-sidebar__user-initials">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="iw-sidebar__user-info">
            <div className="iw-sidebar__user-name">{user.name}</div>
            <div className="iw-sidebar__user-role">{user.roles[0]}</div>
          </div>
        </div>
      )}
      
      <nav className="iw-sidebar__nav">
        {navigationItems.map((section, sectionIndex) => (
          <div key={`section-${sectionIndex}`} className="iw-sidebar__menu-section">
            {!collapsed && (
              <div className="iw-sidebar__menu-title">{section.title}</div>
            )}
            <ul className="iw-sidebar__menu">
              {section.items.map((item, itemIndex) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={`item-${sectionIndex}-${itemIndex}`} className="iw-sidebar__menu-item">
                    <NavLink
                      to={item.path}
                      className={({ isActive }) => 
                        `iw-sidebar__menu-link ${isActive ? 'iw-sidebar__menu-link--active' : ''}`
                      }
                      title={collapsed ? item.text : undefined}
                    >
                      <span className="iw-sidebar__menu-item-icon">{item.icon}</span>
                      {!collapsed && <span className="iw-sidebar__menu-item-text">{item.text}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      
      <div className="iw-sidebar__footer">
        <NavLink 
          to={ROUTES.HELP}
          className="iw-sidebar__help-link"
          title={collapsed ? 'Help & Support' : undefined}
        >
          <i className="icon-help" />
          {!collapsed && <span>Help & Support</span>}
        </NavLink>
      </div>
    </aside>
  );
};

Sidebar.propTypes = {
  collapsed: PropTypes.bool,
  onToggle: PropTypes.func,
  user: PropTypes.object
};

export default Sidebar;