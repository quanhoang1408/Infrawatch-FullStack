import React from 'react';
import { NavLink } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import './Sidebar.scss';

const Sidebar = ({ collapsed }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Debug user role
  console.log('Current user:', user);
  console.log('Is admin:', isAdmin);

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__header">
        <NavLink to="/dashboard" className="sidebar__logo">
          <img src="/images/logo.svg" alt="Infrawatch" className="sidebar__logo-img" />
          <span className="sidebar__logo-text">Infrawatch</span>
        </NavLink>
      </div>

      <nav className="sidebar__nav">
        <ul className="sidebar__nav-list">
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
            >
              <span className="sidebar__item-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="sidebar__item-text">Dashboard</span>
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/vm"
              className={({ isActive }) => `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
            >
              <span className="sidebar__item-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V6C22 4.89543 21.1046 4 20 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 9H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="sidebar__item-text">Virtual Machines</span>
            </NavLink>
          </li>

          {isAdmin && (
            <>
              <li>
                <NavLink
                  to="/admin/providers"
                  className={({ isActive }) => `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
                >
                  <span className="sidebar__item-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 12H2M22 12C22 17.5228 17.5228 22 12 22M22 12C22 6.47715 17.5228 2 12 2M2 12C2 17.5228 6.47715 22 12 22M2 12C2 6.47715 6.47715 2 12 2M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22M12 2C9.49872 4.73835 8.07725 8.29203 8 12C8.07725 15.708 9.49872 19.2616 12 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <span className="sidebar__item-text">Nhà cung cấp</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) => `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
                >
                  <span className="sidebar__item-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.55231C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <span className="sidebar__item-text">Người dùng</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/vm-assignments"
                  className={({ isActive }) => `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
                >
                  <span className="sidebar__item-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H14C15.1046 21 16 20.1046 16 19V15M18 14L22 10M22 10L18 6M22 10H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <span className="sidebar__item-text">Phân quyền</span>
                </NavLink>
              </li>
            </>
          )}

          <li>
            <NavLink
              to="/settings"
              className={({ isActive }) => `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
            >
              <span className="sidebar__item-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="sidebar__item-text">Thông tin cá nhân</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;