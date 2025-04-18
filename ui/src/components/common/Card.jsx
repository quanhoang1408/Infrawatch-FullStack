// Card.jsx - Simplified version for development
import React from 'react';
import PropTypes from 'prop-types';
// import '../styles/components/Card.scss';

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
    <div
      className={classes}
      style={{
        border: bordered ? '1px solid #ddd' : 'none',
        borderRadius: '4px',
        padding: '16px',
        marginBottom: '16px',
        backgroundColor: '#fff',
        boxShadow: hoverable ? '0 4px 8px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'box-shadow 0.3s ease',
        position: 'relative'
      }}
      {...rest}
    >
      {(title || actions) && (
        <div
          style={{
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          {title && <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{title}</div>}
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div style={{ position: 'relative' }}>
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px'
          }}>
            Loading...
          </div>
        ) : children}
      </div>
      {footer && <div style={{ marginTop: '16px', paddingTop: '8px', borderTop: '1px solid #eee' }}>{footer}</div>}
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