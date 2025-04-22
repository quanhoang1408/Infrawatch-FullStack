// Terminal.jsx
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { SearchAddon } from 'xterm-addon-search';
import 'xterm/css/xterm.css';
import TerminalToolbar from './TerminalToolbar';
import ConnectionStatus from './ConnectionStatus';
import CommandHistory from './CommandHistory';
import TerminalContextMenu from './TerminalContextMenu';
import './Terminal.scss';

/**
 * SSH Terminal component for connecting to VMs
 * @param {string} vmId - ID of the VM to connect
 * @param {string} vmName - Name of the VM
 * @param {string} sessionId - Terminal session ID
 * @param {function} onConnect - Handler for terminal connection
 * @param {function} onDisconnect - Handler for terminal disconnection
 * @param {function} onData - Handler for terminal data
 * @param {boolean} autoConnect - Connect automatically on mount
 */
const Terminal = ({
  vmId,
  vmName,
  sessionId,
  onConnect,
  onDisconnect,
  onData,
  autoConnect = true,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-terminal';
  const classes = [baseClass, className].filter(Boolean).join(' ');

  // Terminal refs
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const containerRef = useRef(null);
  const fitAddonRef = useRef(null);
  const searchAddonRef = useRef(null);
  const websocketRef = useRef(null);
  const resizeObserverRef = useRef(null);

  // Terminal state
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [commandHistory, setCommandHistory] = useState([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [terminalSettings, setTerminalSettings] = useState({
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
  });

  // Initialize terminal
  useEffect(() => {
    // Make sure the terminal element exists before initializing
    if (!terminalRef.current) {
      console.error('Terminal element reference is not available');
      return;
    }

    // Create terminal instance with safe defaults
    xtermRef.current = new XTerm({
      fontSize: terminalSettings.fontSize,
      fontFamily: terminalSettings.fontFamily,
      lineHeight: terminalSettings.lineHeight,
      cursorBlink: terminalSettings.cursorBlink,
      cursorStyle: terminalSettings.cursorStyle,
      theme: terminalSettings.theme,
      scrollback: 1000,
      allowTransparency: true,
      cols: 80,  // Default columns
      rows: 24   // Default rows
    });

    // Create and attach addons
    fitAddonRef.current = new FitAddon();
    searchAddonRef.current = new SearchAddon();
    const webLinksAddon = new WebLinksAddon();

    xtermRef.current.loadAddon(fitAddonRef.current);
    xtermRef.current.loadAddon(searchAddonRef.current);
    xtermRef.current.loadAddon(webLinksAddon);

    // Open terminal
    try {
      xtermRef.current.open(terminalRef.current);

      // Wait a moment before fitting to ensure the terminal is fully rendered
      setTimeout(() => {
        if (fitAddonRef.current) {
          try {
            fitAddonRef.current.fit();
          } catch (fitError) {
            console.error('Error fitting terminal:', fitError);
          }
        }
      }, 100);
    } catch (openError) {
      console.error('Error opening terminal:', openError);
      setError('Failed to initialize terminal: ' + openError.message);
    }

    // Handle terminal data (keystrokes)
    xtermRef.current.onData(data => {
      if (connected && websocketRef.current) {
        // Send data directly without JSON wrapping
        websocketRef.current.send(data);

        // Track command for history
        if (data === '\r') {
          if (currentCommand.trim()) {
            setCommandHistory(prev => [currentCommand, ...prev.slice(0, 99)]);
            setCurrentCommand('');
          }
        } else if (data === '\u007F') { // Backspace
          setCurrentCommand(prev => prev.slice(0, -1));
        } else if (data.length === 1 && !data.match(/[\x00-\x1F]/)) { // Visible character
          setCurrentCommand(prev => prev + data);
        }
      }
    });

    // Handle terminal resize
    xtermRef.current.onResize(({ cols, rows }) => {
      // Resize events are handled by the server automatically
      // No need to send resize events
    });

    // Create resize observer with error handling
    try {
      resizeObserverRef.current = new ResizeObserver(() => {
        if (fitAddonRef.current && xtermRef.current) {
          try {
            // Make sure the terminal is visible before fitting
            if (terminalRef.current && terminalRef.current.offsetWidth > 0 && terminalRef.current.offsetHeight > 0) {
              fitAddonRef.current.fit();
            }
          } catch (fitError) {
            console.error('Error in resize observer when fitting terminal:', fitError);
          }
        }
      });

      // Observe the container if it exists
      if (containerRef.current) {
        resizeObserverRef.current.observe(containerRef.current);
      } else {
        console.warn('Terminal container reference is not available for ResizeObserver');
      }
    } catch (observerError) {
      console.error('Failed to create ResizeObserver:', observerError);
    }

    // Auto connect
    if (autoConnect && vmId) {
      handleConnect();
    }

    // Cleanup
    return () => {
      // Clean up WebSocket connection
      try {
        if (websocketRef.current) {
          websocketRef.current.close();
          websocketRef.current = null;
        }
      } catch (wsError) {
        console.error('Error closing WebSocket during cleanup:', wsError);
      }

      // Clean up ResizeObserver
      try {
        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect();
          resizeObserverRef.current = null;
        }
      } catch (observerError) {
        console.error('Error disconnecting ResizeObserver during cleanup:', observerError);
      }

      // Clean up terminal
      try {
        if (xtermRef.current) {
          xtermRef.current.dispose();
          xtermRef.current = null;
        }
      } catch (terminalError) {
        console.error('Error disposing terminal during cleanup:', terminalError);
      }

      // Clear other refs
      fitAddonRef.current = null;
      searchAddonRef.current = null;
    };
  }, []);

  // Apply terminal settings
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.fontSize = terminalSettings.fontSize;
      xtermRef.current.options.fontFamily = terminalSettings.fontFamily;
      xtermRef.current.options.lineHeight = terminalSettings.lineHeight;
      xtermRef.current.options.cursorBlink = terminalSettings.cursorBlink;
      xtermRef.current.options.cursorStyle = terminalSettings.cursorStyle;
      xtermRef.current.options.theme = terminalSettings.theme;

      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    }
  }, [terminalSettings]);

  // Handle terminal connection
  const handleConnect = () => {
    if (connecting || connected) return;

    setConnecting(true);
    setError(null);

    try {
      // Call connect handler and get WebSocket URL
      const wsUrl = onConnect?.(vmId, sessionId);

      if (!wsUrl) {
        setConnecting(false);
        setError('No WebSocket URL provided. Please check your session.');
        return;
      }

      // Create WebSocket connection with session ID in protocol
      console.log('Creating WebSocket connection to:', wsUrl, 'with protocol:', [`sessionId.${sessionId}`]);

      // Real WebSocket connection
      try {
        websocketRef.current = new WebSocket(wsUrl, [`sessionId.${sessionId}`]);
        console.log('WebSocket object created successfully');
      } catch (wsError) {
        console.error('Error creating WebSocket:', wsError);
        setError(`Failed to create WebSocket connection: ${wsError.message}`);
        setConnecting(false);
        return;
      }

      // Handle WebSocket events
      websocketRef.current.onopen = () => {
        setConnected(true);
        setConnecting(false);

        // Terminal size is handled automatically by the server

        // Welcome message
        xtermRef.current.writeln('Connected to terminal session.');
        xtermRef.current.writeln(`VM: ${vmName} (${vmId})`);
        xtermRef.current.writeln('--------------------------------------------------');
        xtermRef.current.writeln('');
      };

      websocketRef.current.onmessage = (event) => {
        try {
          console.log('WebSocket message received:', typeof event.data, event.data.length);

          // Try to parse as JSON first
          try {
            const data = JSON.parse(event.data);
            console.log('Parsed JSON data:', data);

            if (data.type === 'data') {
              xtermRef.current.write(data.data);
            } else if (data.error) {
              console.error('Server reported error:', data.error);
              xtermRef.current.writeln(`\r\nServer error: ${data.error}`);
            }

            // Call onData handler
            onData?.(data);
          } catch (e) {
            // If not JSON, treat as raw text
            console.log('Treating message as raw text');
            xtermRef.current.write(event.data);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      websocketRef.current.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Connection error: Could not establish WebSocket connection. Please check your network and server status.');
        setConnected(false);
        setConnecting(false);

        // Display error in terminal
        xtermRef.current.writeln('\r\n\x1b[31mConnection error: Could not establish WebSocket connection.\x1b[0m');
        xtermRef.current.writeln('\r\nPossible reasons:');
        xtermRef.current.writeln('1. The server is not running or unreachable');
        xtermRef.current.writeln('2. WebSocket endpoint is not properly configured');
        xtermRef.current.writeln('3. Network issues or firewall blocking WebSocket connections');
        xtermRef.current.writeln('\r\nPlease check the browser console for more details.');
      };

      websocketRef.current.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setConnected(false);

        const reason = event.reason || 'Connection closed';
        const code = event.code;

        // Display close reason with color based on code
        if (code === 1000) {
          // Normal closure
          xtermRef.current.writeln(`\r\n\x1b[33mConnection closed: ${reason}\x1b[0m`);
        } else if (code === 1006) {
          // Abnormal closure
          xtermRef.current.writeln(`\r\n\x1b[31mConnection closed unexpectedly (code: ${code})\x1b[0m`);
          xtermRef.current.writeln('The connection was closed without a proper WebSocket close handshake.');
          xtermRef.current.writeln('This may indicate network issues or server problems.');
        } else {
          // Other closure
          xtermRef.current.writeln(`\r\n\x1b[31mConnection closed (code: ${code}): ${reason}\x1b[0m`);
        }

        onDisconnect?.(vmId, sessionId, reason);
      };
    } catch (error) {
      setError(`Connection failed: ${error.message}`);
      setConnected(false);
      setConnecting(false);
      console.error('Terminal connection error:', error);
    }
  };

  // Handle terminal disconnection
  const handleDisconnect = () => {
    if (websocketRef.current) {
      websocketRef.current.close(1000, 'User disconnected');
    }

    setConnected(false);
    onDisconnect?.(vmId, sessionId, 'User disconnected');
  };

  // Handle terminal reset
  const handleReset = () => {
    xtermRef.current.reset();
    xtermRef.current.clear();
    setCommandHistory([]);
    setCurrentCommand('');
  };

  // Handle search in terminal
  const handleSearch = (searchTerm) => {
    if (searchAddonRef.current && searchTerm) {
      searchAddonRef.current.findNext(searchTerm);
    }
  };

  // Handle font size adjustment
  const handleFontSizeChange = (delta) => {
    setTerminalSettings(prev => ({
      ...prev,
      fontSize: Math.max(8, Math.min(24, prev.fontSize + delta))
    }));
  };

  // Handle context menu
  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuVisible(true);
  };

  // Handle context menu item click
  const handleContextMenuAction = (action) => {
    setContextMenuVisible(false);

    switch (action) {
      case 'copy':
        document.execCommand('copy');
        break;
      case 'paste':
        navigator.clipboard.readText().then(text => {
          if (xtermRef.current && connected) {
            websocketRef.current.send(text);
          }
        });
        break;
      case 'clear':
        xtermRef.current.clear();
        break;
      case 'reset':
        handleReset();
        break;
      default:
        break;
    }
  };

  // Apply command from history
  const handleCommandFromHistory = (command) => {
    if (connected && websocketRef.current) {
      websocketRef.current.send(command + '\r');
    }
  };

  // Update terminal settings
  const handleSettingsChange = (newSettings) => {
    setTerminalSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };

  return (
    <div className={classes} ref={containerRef} {...rest}>
      <TerminalToolbar
        connected={connected}
        connecting={connecting}
        vmName={vmName}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onReset={handleReset}
        onSearch={handleSearch}
        onFontSizeChange={handleFontSizeChange}
        onSettingsChange={handleSettingsChange}
        terminalSettings={terminalSettings}
      />

      <div className={`${baseClass}__container`}>
        <div
          className={`${baseClass}__terminal`}
          ref={terminalRef}
          onContextMenu={handleContextMenu}
        />

        {error && (
          <div className={`${baseClass}__error`}>
            <i className="icon-alert-circle" />
            <span>{error}</span>
            <button
              className={`${baseClass}__error-button`}
              onClick={handleDisconnect}
            >
              Reconnect
            </button>
          </div>
        )}

        <ConnectionStatus
          connected={connected}
          connecting={connecting}
        />

        <CommandHistory
          commands={commandHistory}
          onSelect={handleCommandFromHistory}
        />

        {contextMenuVisible && (
          <TerminalContextMenu
            position={contextMenuPosition}
            onAction={handleContextMenuAction}
            onClose={() => setContextMenuVisible(false)}
          />
        )}
      </div>
    </div>
  );
};

Terminal.propTypes = {
  vmId: PropTypes.string.isRequired,
  vmName: PropTypes.string,
  sessionId: PropTypes.string,
  onConnect: PropTypes.func,
  onDisconnect: PropTypes.func,
  onData: PropTypes.func,
  autoConnect: PropTypes.bool,
  className: PropTypes.string
};

export default Terminal;