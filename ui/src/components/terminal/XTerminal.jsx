import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { SearchAddon } from 'xterm-addon-search';
import 'xterm/css/xterm.css';
import './XTerminal.css';

const XTerminal = ({ vmId, vmName, sessionId, onConnect, onDisconnect }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const websocketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Initialize terminal
  useEffect(() => {
    // Make sure we only initialize once and when the DOM is ready
    if (terminalRef.current && !xtermRef.current) {
      // Set explicit dimensions on the container to avoid the 'dimensions' error
      terminalRef.current.style.width = '100%';
      terminalRef.current.style.height = '400px';

      // Create terminal instance with explicit dimensions
      const terminal = new Terminal({
        cursorBlink: true,
        cursorStyle: 'block',
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
        lineHeight: 1.2,
        cols: 80,  // Default columns
        rows: 24,  // Default rows
        theme: {
          background: '#000000',
          foreground: '#ffffff',
          cursor: '#ffffff',
          selection: 'rgba(255, 255, 255, 0.3)',
          black: '#000000',
          red: '#e06c75',
          green: '#98c379',
          yellow: '#e5c07b',
          blue: '#61afef',
          magenta: '#c678dd',
          cyan: '#56b6c2',
          white: '#dcdfe4',
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

      // Store reference first to avoid race conditions
      xtermRef.current = terminal;

      // Create addons
      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();
      const searchAddon = new SearchAddon();

      // Load addons
      terminal.loadAddon(fitAddon);
      terminal.loadAddon(webLinksAddon);
      terminal.loadAddon(searchAddon);

      // Store fitAddon reference
      fitAddonRef.current = fitAddon;

      // Open terminal
      try {
        terminal.open(terminalRef.current);

        // Use setTimeout to ensure the terminal is fully rendered
        setTimeout(() => {
          try {
            if (fitAddonRef.current) {
              fitAddonRef.current.fit();
              console.log('Terminal fitted successfully');
            }
          } catch (fitError) {
            console.error('Error fitting terminal:', fitError);
          }
        }, 100);
      } catch (openError) {
        console.error('Error opening terminal:', openError);
      }

      // Add resize event listener
      const handleResize = () => {
        if (fitAddonRef.current && xtermRef.current) {
          try {
            fitAddonRef.current.fit();

            // Send terminal size to server if connected
            if (connected && websocketRef.current) {
              const { cols, rows } = xtermRef.current;
              websocketRef.current.send(JSON.stringify({
                type: 'resize',
                cols,
                rows
              }));
            }
          } catch (resizeError) {
            console.error('Error during resize:', resizeError);
          }
        }
      };

      window.addEventListener('resize', handleResize);

      // Initial welcome message
      terminal.writeln('Welcome to Infrawatch Terminal');
      terminal.writeln('Click "Connect" to start a session');
      terminal.writeln('');

      // Clean up
      return () => {
        window.removeEventListener('resize', handleResize);
        if (xtermRef.current) {
          try {
            xtermRef.current.dispose();
          } catch (disposeError) {
            console.error('Error disposing terminal:', disposeError);
          }
          xtermRef.current = null;
        }
      };
    }
  }, []);  // Empty dependency array to ensure it only runs once

  // Handle connect
  const handleConnect = useCallback(() => {
    if (connecting || connected) return;

    setConnecting(true);
    setError(null);

    if (xtermRef.current) {
      xtermRef.current.clear();
      xtermRef.current.writeln('Connecting to VM...');
    }

    // Get WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.REACT_APP_API_URL || window.location.host;
    const wsUrl = `${protocol}//${host}/api/v1/terminal/${vmId}`;

    try {
      const ws = new WebSocket(wsUrl);
      websocketRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connection established');
        setConnected(true);
        setConnecting(false);

        if (xtermRef.current) {
          xtermRef.current.clear();
          xtermRef.current.writeln('Connected to VM');
          xtermRef.current.writeln('');

          // Fit terminal after connection
          if (fitAddonRef.current) {
            setTimeout(() => {
              fitAddonRef.current.fit();

              // Send terminal size to server
              const { cols, rows } = xtermRef.current;
              ws.send(JSON.stringify({
                type: 'resize',
                cols,
                rows
              }));
            }, 100);
          }
        }

        // Set up heartbeat
        const heartbeatInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
        ws.heartbeatInterval = heartbeatInterval;

        // Notify parent component
        if (onConnect) onConnect(sessionId);
      };

      ws.onmessage = (event) => {
        try {
          // Try to parse as JSON
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'data') {
              // Write data to terminal
              if (xtermRef.current) {
                xtermRef.current.write(data.data);
              }
            } else if (data.type === 'error') {
              // Handle error
              setError(data.message || 'Unknown error');
              if (xtermRef.current) {
                xtermRef.current.writeln(`\r\nError: ${data.message}\r\n`);
              }
            } else if (data.type === 'pong') {
              // Heartbeat response, no action needed
              console.log('Received pong from server');
            }
          } catch (jsonError) {
            // Not JSON, treat as raw data
            if (xtermRef.current && event.data) {
              xtermRef.current.write(event.data);
            }
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
        setConnected(false);
        setConnecting(false);

        // Clear heartbeat interval
        if (ws.heartbeatInterval) {
          clearInterval(ws.heartbeatInterval);
        }

        if (xtermRef.current) {
          xtermRef.current.writeln('\r\nDisconnected from server');
          xtermRef.current.writeln(`Code: ${event.code}, Reason: ${event.reason || 'No reason provided'}`);
          xtermRef.current.writeln('Click "Connect" to reconnect');
        }

        // Notify parent component
        if (onDisconnect) onDisconnect(sessionId);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error. Please try again.');
        setConnecting(false);

        if (xtermRef.current) {
          xtermRef.current.writeln('\r\nConnection error. Please try again.\r\n');
        }
      };

      // Set up terminal input
      if (xtermRef.current) {
        xtermRef.current.onData((data) => {
          if (ws.readyState === WebSocket.OPEN) {
            // Send data to server
            ws.send(JSON.stringify({
              type: 'input',
              data
            }));
          }
        });
      }
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setError(`Failed to connect: ${error.message}`);
      setConnecting(false);

      if (xtermRef.current) {
        xtermRef.current.writeln(`\r\nFailed to connect: ${error.message}\r\n`);
      }
    }
  }, [vmId, connecting, connected, sessionId, onConnect, onDisconnect]);

  // Handle disconnect
  const handleDisconnect = useCallback(() => {
    if (!connected || !websocketRef.current) return;

    try {
      // Close WebSocket
      websocketRef.current.close(1000, 'User disconnected');
      websocketRef.current = null;

      // Update state
      setConnected(false);

      if (xtermRef.current) {
        xtermRef.current.writeln('\r\nDisconnected from server');
        xtermRef.current.writeln('Click "Connect" to reconnect');
      }

      // Notify parent component
      if (onDisconnect) onDisconnect(sessionId);
    } catch (error) {
      console.error('Error disconnecting:', error);
      setError(`Failed to disconnect: ${error.message}`);
    }
  }, [connected, sessionId, onDisconnect]);

  return (
    <div className="xterm-terminal">
      <div className="xterm-terminal-toolbar">
        <div className="xterm-terminal-info">
          {vmName ? `Terminal: ${vmName}` : 'Terminal'}
        </div>
        <div className="xterm-terminal-actions">
          {!connected && (
            <button
              className="xterm-terminal-connect-btn"
              onClick={handleConnect}
              disabled={connecting}
            >
              {connecting ? 'Connecting...' : 'Connect'}
            </button>
          )}
          {connected && (
            <button
              className="xterm-terminal-disconnect-btn"
              onClick={handleDisconnect}
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      <div className="xterm-terminal-container" ref={terminalRef}></div>

      {error && (
        <div className="xterm-terminal-error">
          {error}
        </div>
      )}

      <div className="xterm-terminal-status">
        {connecting && 'Connecting...'}
        {connected && 'Connected'}
        {!connecting && !connected && 'Disconnected'}
      </div>
    </div>
  );
};

XTerminal.propTypes = {
  vmId: PropTypes.string.isRequired,
  vmName: PropTypes.string,
  sessionId: PropTypes.string,
  onConnect: PropTypes.func,
  onDisconnect: PropTypes.func
};

export default XTerminal;
