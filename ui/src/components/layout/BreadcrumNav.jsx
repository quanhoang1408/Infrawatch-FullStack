// BreadcrumbNav.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import './BreadcrumbNav.scss';

/**
 * Breadcrumb navigation component
 * @param {array} items - Breadcrumb items
 */
const BreadcrumbNav = ({ items = [] }) => {
  if (items.length === 0) {
    return null;
  }
  
  return (
    <nav className="iw-breadcrumb" aria-label="Breadcrumb">
      <ol className="iw-breadcrumb__list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li
              key={`breadcrumb-${index}`}
              className={`iw-breadcrumb__item ${isLast ? 'iw-breadcrumb__item--active' : ''}`}
            >
              {!isLast ? (
                <>
                  <Link to={item.path} className="iw-breadcrumb__link">
                    {item.icon && <span className="iw-breadcrumb__icon">{item.icon}</span>}
                    <span>{item.label}</span>
                  </Link>
                  <span className="iw-breadcrumb__separator">/</span>
                </>
              ) : (
                <span className="iw-breadcrumb__current">
                  {item.icon && <span className="iw-breadcrumb__icon">{item.icon}</span>}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

BreadcrumbNav.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      path: PropTypes.string,
      icon: PropTypes.node
    })
  )
};

export default BreadcrumbNav;