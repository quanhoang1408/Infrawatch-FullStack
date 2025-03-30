// EmptyState.jsx
import React from 'react';
import PropTypes from 'prop-types';
import '../styles/components/EmptyState.scss';
import Button from './Button';

/**
 * Empty state component for when no data is available
 * @param {string} title - Empty state title
 * @param {string} description - Empty state description
 * @param {node} icon - Custom icon
 * @param {node} action - Action element (e.g., button)
 * @param {string} className - Additional class names
 */
const EmptyState = ({
  title = 'No Data',
  description,
  icon,
  action,
  actionText,
  onActionClick,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-empty-state';
  const classes = [baseClass, className].filter(Boolean).join(' ');

  return (
    <div className={classes} {...rest}>
      <div className={`${baseClass}__icon`}>
        {icon || (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
            <path d="M3 10h18v8c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-8zm6-3h6m-3-3v3m9 3L3 7" fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <div className={`${baseClass}__title`}>{title}</div>
      {description && <div className={`${baseClass}__description`}>{description}</div>}
      {(action || actionText) && (
        <div className={`${baseClass}__action`}>
          {action || (
            <Button
              variant="primary"
              onClick={onActionClick}
            >
              {actionText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

EmptyState.propTypes = {
  title: PropTypes.string,
  description: PropTypes.node,
  icon: PropTypes.node,
  action: PropTypes.node,
  actionText: PropTypes.string,
  onActionClick: PropTypes.func,
  className: PropTypes.string
};

export default EmptyState;