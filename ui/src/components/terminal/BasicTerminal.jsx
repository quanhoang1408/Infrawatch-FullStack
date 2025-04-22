// BasicTerminal.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import './BasicTerminal.scss';

/**
 * A basic terminal component that uses a pre-styled div instead of xterm.js
 * This avoids the dimension issues with xterm.js
 */
const BasicTerminal = ({
  vmId,
  vmName,
  sessionId,
  onConnect,
  onDisconnect
}) => {
  // Refs
  const terminalRef = useRef(null);
  const websocketRef = useRef(null);

  // State
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [output, setOutput] = useState([
    { type: 'info', text: 'Terminal ready. Click Connect to start session.' }
  ]);

  // Handle connection
  const handleConnect = () => {
    if (connecting || connected) return;

    setConnecting(true);
    setError(null);
    addOutput('info', 'Connecting to terminal session...');

    try {
      // Get WebSocket URL
      const wsUrl = onConnect?.(vmId, sessionId);

      if (!wsUrl) {
        setConnecting(false);
        setError('No WebSocket URL provided');
        addOutput('error', 'No WebSocket URL provided');
        return;
      }

      console.log('Connecting to WebSocket:', wsUrl);
      addOutput('info', `Connecting to ${wsUrl}...`);

      // Create WebSocket
      const ws = new WebSocket(wsUrl, [`sessionId.${sessionId}`]);
      websocketRef.current = ws;

      // Handle WebSocket events
      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        setConnecting(false);
        addOutput('success', 'Connected to terminal session');
        addOutput('info', `VM: ${vmName || 'Unknown'} (${vmId})`);
        addOutput('info', '--------------------------------------------------');

        // Add keyboard event listener after connection is established
        if (handleKeyDownRef.current) {
          document.addEventListener('keydown', handleKeyDownRef.current);
        }
      };

      ws.onmessage = (event) => {
        try {
          // Try to parse as JSON
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'data') {
              addOutput('output', data.data);
            } else {
              addOutput('output', JSON.stringify(data));
            }
          } catch (e) {
            // Not JSON, treat as raw data
            addOutput('output', event.data);
          }
        } catch (e) {
          console.error('Error processing message:', e);
          addOutput('error', `Error processing message: ${e.message}`);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
        setConnected(false);
        setConnecting(false);
        addOutput('error', 'Connection error');
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setConnected(false);
        addOutput('warning', `Connection closed (${event.code}): ${event.reason || 'Unknown reason'}`);
        onDisconnect?.(vmId, sessionId, event.reason);

        // Remove keyboard event listener when connection is closed
        if (handleKeyDownRef.current) {
          document.removeEventListener('keydown', handleKeyDownRef.current);
        }
      };
    } catch (e) {
      console.error('Connection error:', e);
      setError(`Connection error: ${e.message}`);
      setConnected(false);
      setConnecting(false);
      addOutput('error', `Connection error: ${e.message}`);
    }
  };

  // Define handleKeyDown first (will be initialized later)
  const handleKeyDownRef = useRef(null);

  // Handle disconnection
  const handleDisconnect = useCallback(() => {
    if (websocketRef.current) {
      websocketRef.current.close(1000, 'User disconnected');
    }

    setConnected(false);
    addOutput('info', 'Disconnected from terminal session');
    onDisconnect?.(vmId, sessionId, 'User disconnected');

    // Remove event listener using the ref
    if (handleKeyDownRef.current) {
      document.removeEventListener('keydown', handleKeyDownRef.current);
    }
  }, [vmId, sessionId, onDisconnect]);

  // Handle key down events - memoized to avoid dependency issues
  const handleKeyDown = useCallback((event) => {
    if (!connected || !websocketRef.current) return;

    // Only handle if terminal is focused
    if (document.activeElement !== terminalRef.current) return;

    // Send key to server
    const key = event.key;
    if (key.length === 1 || key === 'Enter' || key === 'Backspace' || key === 'Tab') {
      event.preventDefault();

      let data;
      if (key === 'Enter') {
        data = '\r';
      } else if (key === 'Backspace') {
        data = '\u007F';
      } else if (key === 'Tab') {
        data = '\t';
      } else {
        data = key;
      }

      websocketRef.current.send(data);
    }
  }, [connected]);

  // Store the callback in a ref to avoid dependency cycles
  useEffect(() => {
    handleKeyDownRef.current = handleKeyDown;
  }, [handleKeyDown]);

  // Add output to terminal
  const addOutput = (type, text) => {
    setOutput(prev => [...prev, { type, text }]);
  };

  // Scroll to bottom when output changes
  useEffect(() => {
    // Scroll to bottom
    if (terminalRef.current) {
      try {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      } catch (error) {
        console.error('Error scrolling terminal to bottom:', error);
      }
    }
  }, [output]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      try {
        if (websocketRef.current) {
          websocketRef.current.close();
          websocketRef.current = null;
        }

        if (handleKeyDownRef.current) {
          document.removeEventListener('keydown', handleKeyDownRef.current);
        }
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };
  }, []);

  // Focus terminal on click
  const handleTerminalClick = () => {
    if (terminalRef.current) {
      terminalRef.current.focus();
    }
  };

  return (
    <div className="basic-terminal">
      <div className="basic-terminal-toolbar">
        <div className="basic-terminal-info">
          {vmName ? `Terminal: ${vmName}` : 'Terminal'}
        </div>
        <div className="basic-terminal-actions">
          {!connected && (
            <button
              className="basic-terminal-connect-btn"
              onClick={handleConnect}
              disabled={connecting}
            >
              {connecting ? 'Connecting...' : 'Connect'}
            </button>
          )}
          {connected && (
            <button
              className="basic-terminal-disconnect-btn"
              onClick={handleDisconnect}
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      <div
        className="basic-terminal-output"
        ref={terminalRef}
        onClick={handleTerminalClick}
        tabIndex="0"
      >
        {output.map((line, index) => (
          <div key={index} className={`terminal-line ${line.type}`}>
            {line.text}
          </div>
        ))}
      </div>

      {error && (
        <div className="basic-terminal-error">
          {error}
        </div>
      )}

      <div className="basic-terminal-status">
        {connecting && 'Connecting...'}
        {connected && 'Connected'}
        {!connecting && !connected && 'Disconnected'}
      </div>
    </div>
  );
};

BasicTerminal.propTypes = {
  vmId: PropTypes.string.isRequired,
  vmName: PropTypes.string,
  sessionId: PropTypes.string,
  onConnect: PropTypes.func,
  onDisconnect: PropTypes.func
};

export default BasicTerminal;
