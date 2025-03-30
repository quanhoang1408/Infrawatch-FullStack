// Card.jsx
import React from 'react';
import PropTypes from 'prop-types';
import '../styles/components/Card.scss';

/**
 * Card component for Infrawatch
 * @param {string} title - Card title
 * @param {node} actions - Actions to display in card header
 * @param {boolean} bordered - Add border to card
 * @param {boolean} hoverable - Add hover effect
 * @param {string} className - Additional class names
 * @param {node} children - Card content
 * @param {boolean} loading - Show loading state
 * @param {node} footer - Card footer content
 */
const Card = ({
  title,
  actions,
  bordered = true,
  hoverable = false,
  className = '',
  children,
  loading = false,
  footer,
  ...rest
}) => {
  const baseClass = 'iw-card';
  const classes = [
    baseClass,
    bordered ? `${baseClass}--bordered` : '',
    hoverable ? `${baseClass}--hoverable` : '',
    loading ? `${baseClass}--loading` : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...rest}>
      {(title || actions) && (
        <div className={`${baseClass}__header`}>
          {title && <div className={`${baseClass}__title`}>{title}</div>}
          {actions && <div className={`${baseClass}__actions`}>{actions}</div>}
        </div>
      )}
      <div className={`${baseClass}__content`}>
        {loading ? (
          <div className={`${baseClass}__loading-indicator`}>
            <div className={`${baseClass}__loading-spinner`}></div>
          </div>
        ) : children}
      </div>
      {footer && <div className={`${baseClass}__footer`}>{footer}</div>}
    </div>
  );
};

Card.propTypes = {
  title: PropTypes.node,
  actions: PropTypes.node,
  bordered: PropTypes.bool,
  hoverable: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
  loading: PropTypes.bool,
  footer: PropTypes.node
};

export default Card;