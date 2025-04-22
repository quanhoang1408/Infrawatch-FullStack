// CommandHistory.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '../common';
import './CommandHistory.scss';

/**
 * Component to display command history
 * @param {array} commands - Command history
 * @param {function} onSelect - Handler for command selection
 */
const CommandHistory = ({
  commands = [],
  onSelect,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-command-history';
  const classes = [baseClass, className].filter(Boolean).join(' ');

  // Panel state
  const [visible, setVisible] = useState(false);

  // Toggle panel visibility
  const toggleVisibility = () => {
    setVisible(!visible);
  };

  // Handle command click
  const handleCommandClick = (command) => {
    onSelect?.(command);
    setVisible(false);
  };

  if (commands.length === 0) {
    return null;
  }

  return (
    <div className={classes} {...rest}>
      <Button
        variant="text"
        size="sm"
        icon={<i className={visible ? 'icon-chevron-down' : 'icon-chevron-up'} />}
        className={`${baseClass}__toggle`}
        onClick={toggleVisibility}
      >
        Command History
      </Button>

      {visible && (
        <div className={`${baseClass}__panel`}>
          <div className={`${baseClass}__panel-header`}>
            <div className={`${baseClass}__panel-title`}>Command History</div>
            <Button
              variant="text"
              size="sm"
              icon={<i className="icon-x" />}
              onClick={() => setVisible(false)}
            />
          </div>

          <div className={`${baseClass}__commands`}>
            {commands.length === 0 ? (
              <div className={`${baseClass}__empty`}>No commands in history</div>
            ) : (
              <ul className={`${baseClass}__command-list`}>
                {commands.map((command, index) => (
                  <li
                    key={`cmd-${index}`}
                    className={`${baseClass}__command-item`}
                    onClick={() => handleCommandClick(command)}
                  >
                    <div className={`${baseClass}__command-text`}>{command}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

CommandHistory.propTypes = {
  commands: PropTypes.arrayOf(PropTypes.string),
  onSelect: PropTypes.func,
  className: PropTypes.string
};

export default CommandHistory;