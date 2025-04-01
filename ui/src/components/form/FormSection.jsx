// FormSection.jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Form section component for grouping form items
 * @param {string} title - Section title
 * @param {string} description - Section description
 * @param {node} children - Form items
 * @param {boolean} collapsible - Whether the section is collapsible
 * @param {boolean} defaultCollapsed - Whether the section is collapsed by default
 */
const FormSection = ({
  title,
  description,
  children,
  collapsible = false,
  defaultCollapsed = false,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-form-section';
  const classes = [baseClass, className].filter(Boolean).join(' ');
  
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  
  const toggleCollapse = () => {
    if (collapsible) {
      setCollapsed(!collapsed);
    }
  };

  return (
    <div 
      className={`${classes} ${collapsed ? `${baseClass}--collapsed` : ''}`}
      {...rest}
    >
      {title && (
        <div 
          className={`${baseClass}__header ${collapsible ? `${baseClass}__header--collapsible` : ''}`}
          onClick={toggleCollapse}
        >
          <div className={`${baseClass}__title`}>{title}</div>
          
          {collapsible && (
            <div className={`${baseClass}__collapse-icon`}>
              <i className={`icon-chevron-${collapsed ? 'down' : 'up'}`} />
            </div>
          )}
        </div>
      )}
      
      {description && (
        <div className={`${baseClass}__description`}>{description}</div>
      )}
      
      <div className={`${baseClass}__content`}>
        {children}
      </div>
    </div>
  );
};

FormSection.propTypes = {
  title: PropTypes.string,
  description: PropTypes.node,
  children: PropTypes.node,
  collapsible: PropTypes.bool,
  defaultCollapsed: PropTypes.bool,
  className: PropTypes.string
};

export default FormSection;