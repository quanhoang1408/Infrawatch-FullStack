// TerminalContextMenu.jsx
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Context menu for terminal
 * @param {object} position - Position coordinates
 * @param {function} onAction - Handler for menu item click
 * @param {function} onClose - Handler for menu close
 */
const TerminalContextMenu = ({
  position = { x: 0, y: 0 },
  onAction,
  onClose,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-terminal-context-menu';
  const classes = [baseClass, className].filter(Boolean).join(' ');
  
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Handle menu item click
  const handleItemClick = (action) => {
    onAction?.(action);
  };

  return (
    <div
      className={classes}
      style={{
        position: 'fixed',
        top: `${position.y}px`,
        left: `${position.x}px`
      }}
      ref={menuRef}
      {...rest}
    >
      <ul className={`${baseClass}__menu`}>
        <li
          className={`${baseClass}__item`}
          onClick={() => handleItemClick('copy')}
        >
          <i className="icon-copy" />
          <span>Copy</span>
        </li>
        <li
          className={`${baseClass}__item`}
          onClick={() => handleItemClick('paste')}
        >
          <i className="icon-clipboard" />
          <span>Paste</span>
        </li>
        <li className={`${baseClass}__divider`} />
        <li
          className={`${baseClass}__item`}
          onClick={() => handleItemClick('clear')}
        >
          <i className="icon-trash-2" />
          <span>Clear Terminal</span>
        </li>
        <li
          className={`${baseClass}__item`}
          onClick={() => handleItemClick('reset')}
        >
          <i className="icon-refresh-cw" />
          <span>Reset Terminal</span>
        </li>
      </ul>
    </div>
  );
};

TerminalContextMenu.propTypes = {
  position: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired
  }),
  onAction: PropTypes.func,
  onClose: PropTypes.func,
  className: PropTypes.string
};

export default TerminalContextMenu;