// PageHeader.jsx
import React from 'react';
import PropTypes from 'prop-types';
import BreadcrumbNav from './BreadcrumbNav';
import './PageHeader.scss';

/**
 * Header component for individual pages
 * @param {string} title - Page title
 * @param {node} subtitle - Subtitle or description
 * @param {array} breadcrumbs - Breadcrumb items
 * @param {node} actions - Action buttons
 */
const PageHeader = ({ 
  title, 
  subtitle,
  breadcrumbs = [],
  actions,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-page-header';
  const classes = [baseClass, className].filter(Boolean).join(' ');
  
  return (
    <div className={classes} {...rest}>
      <div className={`${baseClass}__breadcrumb`}>
        <BreadcrumbNav items={breadcrumbs} />
      </div>
      
      <div className={`${baseClass}__container`}>
        <div className={`${baseClass}__info`}>
          <h1 className={`${baseClass}__title`}>{title}</h1>
          {subtitle && <div className={`${baseClass}__subtitle`}>{subtitle}</div>}
        </div>
        
        {actions && (
          <div className={`${baseClass}__actions`}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.node,
  breadcrumbs: PropTypes.array,
  actions: PropTypes.node,
  className: PropTypes.string
};

export default PageHeader;