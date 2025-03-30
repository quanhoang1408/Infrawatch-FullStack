// Tooltip.jsx
import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../styles/components/Tooltip.scss';

/**
 * Tooltip component for displaying additional information
 * @param {node} children - Element that triggers the tooltip
 * @param {string} content - Tooltip content
 * @param {string} placement - Tooltip placement
 * @param {string} className - Additional class names
 */
const Tooltip = ({
  children,
  content,
  placement = 'top',
  className = '',
  showDelay = 200,
  hideDelay = 0,
  ...rest
}) => {
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const showTimerRef = useRef(null);
  const hideTimerRef = useRef(null);

  const baseClass = 'iw-tooltip';
  const classes = [
    baseClass,
    visible ? `${baseClass}--visible` : '',
    className
  ].filter(Boolean).join(' ');

  const handleMouseEnter = () => {
    clearTimeout(hideTimerRef.current);
    showTimerRef.current = setTimeout(() => {
      setVisible(true);
    }, showDelay);
  };

  const handleMouseLeave = () => {
    clearTimeout(showTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
    }, hideDelay);
  };

  useEffect(() => {
    return () => {
      clearTimeout(showTimerRef.current);
      clearTimeout(hideTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (visible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let top, left;
      
      switch (placement) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - 8;
          left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'right':
          top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
          left = triggerRect.right + 8;
          break;
        case 'bottom':
          top = triggerRect.bottom + 8;
          left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'left':
          top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
          left = triggerRect.left - tooltipRect.width - 8;
          break;
        default:
          top = triggerRect.top - tooltipRect.height - 8;
          left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
      }
      
      // Adjust position to stay within viewport
      if (left < 0) left = 0;
      if (left + tooltipRect.width > window.innerWidth) {
        left = window.innerWidth - tooltipRect.width;
      }
      
      if (top < 0) top = 0;
      if (top + tooltipRect.height > window.innerHeight) {
        top = window.innerHeight - tooltipRect.height;
      }
      
      tooltipRef.current.style.top = `${top}px`;
      tooltipRef.current.style.left = `${left}px`;
    }
  }, [visible, placement]);

  return (
    <div
      className={`${baseClass}-container`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={triggerRef}
    >
      {children}
      {visible && (
        <div
          className={`${classes} ${baseClass}--${placement}`}
          ref={tooltipRef}
          {...rest}
        >
          <div className={`${baseClass}__arrow`}></div>
          <div className={`${baseClass}__content`}>{content}</div>
        </div>
      )}
    </div>
  );
};

Tooltip.propTypes = {
  children: PropTypes.node.isRequired,
  content: PropTypes.node.isRequired,
  placement: PropTypes.oneOf(['top', 'right', 'bottom', 'left']),
  className: PropTypes.string,
  showDelay: PropTypes.number,
  hideDelay: PropTypes.number
};

export default Tooltip;