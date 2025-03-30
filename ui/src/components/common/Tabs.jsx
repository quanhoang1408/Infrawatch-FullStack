// Tabs.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import '../styles/components/Tabs.scss';

/**
 * Tabs component for organizing content into multiple views
 * @param {array} items - Array of tab items
 * @param {string} activeKey - Active tab key
 * @param {function} onChange - Called when tab is changed
 * @param {string} type - Tab styling type
 * @param {string} className - Additional class names
 */
const Tabs = ({
  items = [],
  activeKey: controlledActiveKey,
  defaultActiveKey,
  onChange,
  type = 'line',
  className = '',
  ...rest
}) => {
  const isControlled = controlledActiveKey !== undefined;
  const [uncontrolledActiveKey, setUncontrolledActiveKey] = useState(
    defaultActiveKey || (items[0] && items[0].key)
  );
  
  const activeKey = isControlled ? controlledActiveKey : uncontrolledActiveKey;
  
  const baseClass = 'iw-tabs';
  const classes = [
    baseClass,
    `${baseClass}--${type}`,
    className
  ].filter(Boolean).join(' ');

  const handleTabClick = (key) => {
    if (isControlled) {
      onChange?.(key);
    } else {
      setUncontrolledActiveKey(key);
      onChange?.(key);
    }
  };

  const activeItem = items.find(item => item.key === activeKey);

  return (
    <div className={classes} {...rest}>
      <div className={`${baseClass}__nav`}>
        {items.map((item) => (
          <div
            key={item.key}
            className={`
              ${baseClass}__tab
              ${activeKey === item.key ? `${baseClass}__tab--active` : ''}
              ${item.disabled ? `${baseClass}__tab--disabled` : ''}
            `}
            onClick={item.disabled ? undefined : () => handleTabClick(item.key)}
          >
            {item.icon && <span className={`${baseClass}__tab-icon`}>{item.icon}</span>}
            <span className={`${baseClass}__tab-label`}>{item.label}</span>
          </div>
        ))}
      </div>
      <div className={`${baseClass}__content`}>
        {activeItem && activeItem.children}
      </div>
    </div>
  );
};

Tabs.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.node.isRequired,
      icon: PropTypes.node,
      children: PropTypes.node,
      disabled: PropTypes.bool
    })
  ),
  activeKey: PropTypes.string,
  defaultActiveKey: PropTypes.string,
  onChange: PropTypes.func,
  type: PropTypes.oneOf(['line', 'card']),
  className: PropTypes.string
};

export default Tabs;
