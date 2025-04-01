// TerminalSettings.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '../common';

/**
 * Terminal settings panel component
 * @param {object} settings - Current terminal settings
 * @param {function} onSettingsChange - Handler for settings changes
 * @param {function} onClose - Handler for panel close
 */
const TerminalSettings = ({
  settings,
  onSettingsChange,
  onClose,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-terminal-settings';
  const classes = [baseClass, className].filter(Boolean).join(' ');

  // Local settings state
  const [localSettings, setLocalSettings] = useState(settings);

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setLocalSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle font family change
  const handleFontFamilyChange = (e) => {
    const { value } = e.target;
    
    setLocalSettings(prev => ({
      ...prev,
      fontFamily: value
    }));
  };

  // Handle cursor style change
  const handleCursorStyleChange = (e) => {
    const { value } = e.target;
    
    setLocalSettings(prev => ({
      ...prev,
      cursorStyle: value
    }));
  };

  // Apply settings
  const handleApply = () => {
    onSettingsChange?.(localSettings);
  };

  // Reset to defaults
  const handleReset = () => {
    const defaultSettings = {
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      theme: {
        background: '#282c34',
        foreground: '#abb2bf',
        cursor: '#528bff',
        selection: 'rgba(82, 139, 255, 0.3)',
        black: '#282c34',
        red: '#e06c75',
        green: '#98c379',
        yellow: '#e5c07b',
        blue: '#61afef',
        magenta: '#c678dd',
        cyan: '#56b6c2',
        white: '#abb2bf',
        brightBlack: '#5c6370',
        brightRed: '#e06c75',
        brightGreen: '#98c379',
        brightYellow: '#e5c07b',
        brightBlue: '#61afef',
        brightMagenta: '#c678dd',
        brightCyan: '#56b6c2',
        brightWhite: '#ffffff'
      }
    };
    
    setLocalSettings(defaultSettings);
    onSettingsChange?.(defaultSettings);
  };

  return (
    <div className={classes} {...rest}>
      <div className={`${baseClass}__header`}>
        <div className={`${baseClass}__title`}>Terminal Settings</div>
        <Button
          variant="text"
          size="sm"
          icon={<i className="icon-x" />}
          onClick={onClose}
        />
      </div>
      
      <div className={`${baseClass}__content`}>
        <div className={`${baseClass}__form-group`}>
          <label className={`${baseClass}__label`}>Font Size</label>
          <div className={`${baseClass}__font-size-control`}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocalSettings(prev => ({
                ...prev,
                fontSize: Math.max(8, prev.fontSize - 1)
              }))}
              disabled={localSettings.fontSize <= 8}
            >
              -
            </Button>
            <span className={`${baseClass}__font-size-value`}>
              {localSettings.fontSize}px
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocalSettings(prev => ({
                ...prev,
                fontSize: Math.min(24, prev.fontSize + 1)
              }))}
              disabled={localSettings.fontSize >= 24}
            >
              +
            </Button>
          </div>
        </div>
        
        <div className={`${baseClass}__form-group`}>
          <label className={`${baseClass}__label`}>Font Family</label>
          <select
            className={`${baseClass}__select`}
            value={localSettings.fontFamily}
            onChange={handleFontFamilyChange}
          >
            <option value='Menlo, Monaco, "Courier New", monospace'>Menlo</option>
            <option value='Consolas, "Liberation Mono", monospace'>Consolas</option>
            <option value='"Roboto Mono", monospace'>Roboto Mono</option>
            <option value='"Source Code Pro", monospace'>Source Code Pro</option>
            <option value='"Fira Code", monospace'>Fira Code</option>
          </select>
        </div>
        
        <div className={`${baseClass}__form-group`}>
          <label className={`${baseClass}__label`}>Line Height</label>
          <input
            type="range"
            className={`${baseClass}__range`}
            name="lineHeight"
            min="1"
            max="2"
            step="0.1"
            value={localSettings.lineHeight}
            onChange={handleChange}
          />
          <span className={`${baseClass}__range-value`}>
            {localSettings.lineHeight.toFixed(1)}
          </span>
        </div>
        
        <div className={`${baseClass}__form-group`}>
          <label className={`${baseClass}__label`}>Cursor Style</label>
          <select
            className={`${baseClass}__select`}
            value={localSettings.cursorStyle}
            onChange={handleCursorStyleChange}
          >
            <option value="block">Block</option>
            <option value="underline">Underline</option>
            <option value="bar">Bar</option>
          </select>
        </div>
        
        <div className={`${baseClass}__form-group ${baseClass}__checkbox-group`}>
          <label className={`${baseClass}__checkbox-label`}>
            <input
              type="checkbox"
              name="cursorBlink"
              checked={localSettings.cursorBlink}
              onChange={handleChange}
            />
            <span>Cursor Blink</span>
          </label>
        </div>
      </div>
      
      <div className={`${baseClass}__footer`}>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleReset}
        >
          Reset to Defaults
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleApply}
        >
          Apply
        </Button>
      </div>
    </div>
  );
};

TerminalSettings.propTypes = {
  settings: PropTypes.object,
  onSettingsChange: PropTypes.func,
  onClose: PropTypes.func,
  className: PropTypes.string
};

export default TerminalSettings;