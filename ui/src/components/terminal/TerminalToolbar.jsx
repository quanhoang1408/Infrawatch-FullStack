// TerminalToolbar.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Tooltip } from '../common';
import TerminalSettings from './TerminalSettings';
import './TerminalToolbar.scss';

/**
 * Toolbar for the terminal component
 * @param {boolean} connected - Connection status
 * @param {boolean} connecting - Connecting status
 * @param {string} vmName - Name of the connected VM
 * @param {function} onConnect - Handler for connect button
 * @param {function} onDisconnect - Handler for disconnect button
 * @param {function} onReset - Handler for reset button
 * @param {function} onSearch - Handler for search
 * @param {function} onFontSizeChange - Handler for font size change
 * @param {function} onSettingsChange - Handler for settings change
 * @param {object} terminalSettings - Current terminal settings
 */
const TerminalToolbar = ({
  connected,
  connecting,
  vmName,
  onConnect,
  onDisconnect,
  onReset,
  onSearch,
  onFontSizeChange,
  onSettingsChange,
  terminalSettings,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-terminal-toolbar';
  const classes = [baseClass, className].filter(Boolean).join(' ');

  // Search state
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Settings state
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle search form submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch?.(searchTerm);
  };

  // Toggle search input visibility
  const toggleSearch = () => {
    setSearchVisible(!searchVisible);
    if (!searchVisible) {
      // Focus search input after visibility change
      setTimeout(() => {
        document.getElementById('terminal-search').focus();
      }, 0);
    }
  };

  // Toggle settings panel visibility
  const toggleSettings = () => {
    setSettingsVisible(!settingsVisible);
  };

  return (
    <div className={classes} {...rest}>
      <div className={`${baseClass}__connection`}>
        {!connected ? (
          <Button
            variant="primary"
            size="sm"
            icon={<i className="icon-play-circle" />}
            loading={connecting}
            onClick={onConnect}
            disabled={connecting}
          >
            Connect
          </Button>
        ) : (
          <Button
            variant="danger"
            size="sm"
            icon={<i className="icon-stop-circle" />}
            onClick={onDisconnect}
          >
            Disconnect
          </Button>
        )}
        
        {vmName && (
          <div className={`${baseClass}__vm-name`}>
            <i className="icon-server" />
            <span>{vmName}</span>
          </div>
        )}
      </div>
      
      <div className={`${baseClass}__actions`}>
        {searchVisible ? (
          <form 
            className={`${baseClass}__search-form`}
            onSubmit={handleSearchSubmit}
          >
            <input
              id="terminal-search"
              type="text"
              className={`${baseClass}__search-input`}
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <Button
              variant="text"
              size="sm"
              type="submit"
              icon={<i className="icon-search" />}
            />
            <Button
              variant="text"
              size="sm"
              icon={<i className="icon-x" />}
              onClick={toggleSearch}
            />
          </form>
        ) : (
          <>
            <Tooltip content="Search">
              <Button
                variant="text"
                size="sm"
                icon={<i className="icon-search" />}
                onClick={toggleSearch}
              />
            </Tooltip>
            
            <Tooltip content="Decrease Font Size">
              <Button
                variant="text"
                size="sm"
                icon={<i className="icon-minus" />}
                onClick={() => onFontSizeChange?.(-1)}
              />
            </Tooltip>
            
            <Tooltip content="Increase Font Size">
              <Button
                variant="text"
                size="sm"
                icon={<i className="icon-plus" />}
                onClick={() => onFontSizeChange?.(1)}
              />
            </Tooltip>
            
            <Tooltip content="Clear Terminal">
              <Button
                variant="text"
                size="sm"
                icon={<i className="icon-trash-2" />}
                onClick={onReset}
              />
            </Tooltip>
            
            <Tooltip content="Settings">
              <Button
                variant="text"
                size="sm"
                icon={<i className="icon-settings" />}
                onClick={toggleSettings}
              />
            </Tooltip>
          </>
        )}
      </div>
      
      {settingsVisible && (
        <TerminalSettings
          settings={terminalSettings}
          onSettingsChange={onSettingsChange}
          onClose={() => setSettingsVisible(false)}
        />
      )}
    </div>
  );
};

TerminalToolbar.propTypes = {
  connected: PropTypes.bool,
  connecting: PropTypes.bool,
  vmName: PropTypes.string,
  onConnect: PropTypes.func,
  onDisconnect: PropTypes.func,
  onReset: PropTypes.func,
  onSearch: PropTypes.func,
  onFontSizeChange: PropTypes.func,
  onSettingsChange: PropTypes.func,
  terminalSettings: PropTypes.object,
  className: PropTypes.string
};

export default TerminalToolbar;
