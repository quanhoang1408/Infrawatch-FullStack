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

      // Create WebSocket with better error handling
      let ws;
      try {
        console.log(`Creating WebSocket connection to ${wsUrl} with protocol sessionId.${sessionId}`);
        addOutput('info', `Creating WebSocket connection with protocol sessionId.${sessionId}`);

        // Create WebSocket with the session ID as the protocol
        ws = new WebSocket(wsUrl, [`sessionId.${sessionId}`]);
        websocketRef.current = ws;

        // Add a timeout to detect connection issues
        const connectionTimeout = setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            console.error('WebSocket connection timeout');
            addOutput('error', 'Connection timeout - WebSocket failed to connect within 30 seconds');
            setError('Connection timeout');
            setConnecting(false);

            // Close the socket if it's still connecting
            if (ws.readyState === WebSocket.CONNECTING) {
              ws.close();
            }
          }
        }, 30000); // 30 second timeout

        // Clear the timeout when connected
        ws.addEventListener('open', () => {
          clearTimeout(connectionTimeout);
        });
      } catch (wsError) {
        console.error('Error creating WebSocket:', wsError);
        addOutput('error', `Error creating WebSocket: ${wsError.message}`);
        setError(`WebSocket creation error: ${wsError.message}`);
        setConnecting(false);
        return;
      }

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

        // Set up heartbeat to keep connection alive
        const heartbeatInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            // Send a ping message
            ws.send(JSON.stringify({ type: 'ping' }));
            console.log('Sent heartbeat ping');
          } else {
            // Clear interval if connection is closed
            clearInterval(heartbeatInterval);
          }
        }, 15000); // Send heartbeat every 15 seconds

        // Store interval ID for cleanup
        websocketRef.current.heartbeatInterval = heartbeatInterval;
      };

      ws.onmessage = (event) => {
        try {
          // Try to parse as JSON
          try {
            const data = JSON.parse(event.data);

            // Handle different message types
            if (data.type === 'data') {
              // Regular data message
              addOutput('output', data.data);
            } else if (data.type === 'pong') {
              // Pong response from server
              console.log('Received pong from server', data.timestamp);
              // Update last pong timestamp
              websocketRef.current.lastPongTime = Date.now();
            } else {
              // Unknown message type
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

        // Get more detailed error information if possible
        let errorMessage = 'WebSocket connection error';

        // Try to extract more information from the event
        if (event.message) {
          errorMessage += `: ${event.message}`;
        } else if (event.error) {
          errorMessage += `: ${event.error.message || event.error}`;
        }

        // Log detailed error information
        console.error('WebSocket error details:', {
          errorMessage,
          wsUrl: onConnect?.(vmId, sessionId),
          readyState: ws.readyState,
          protocol: ws.protocol,
          extensions: ws.extensions,
          event
        });

        setError(errorMessage);
        setConnected(false);
        setConnecting(false);
        addOutput('error', `Connection error: ${errorMessage}`);

        // Try to provide more helpful information based on the error
        if (wsUrl.startsWith('wss:') && window.location.protocol === 'http:') {
          addOutput('warning', 'You are trying to connect to a secure WebSocket (wss:) from an insecure page (http:). This may be blocked by your browser.');
          addOutput('info', 'Try accessing this page via HTTPS instead.');
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setConnected(false);

        // Provide more helpful information based on the close code
        let closeReason = event.reason || 'Unknown reason';
        let closeType = 'warning';

        // Interpret common close codes
        switch (event.code) {
          case 1000:
            closeReason = 'Normal closure: ' + closeReason;
            closeType = 'info';
            break;
          case 1001:
            closeReason = 'Server going down: ' + closeReason;
            break;
          case 1002:
            closeReason = 'Protocol error: ' + closeReason;
            break;
          case 1003:
            closeReason = 'Received invalid data: ' + closeReason;
            break;
          case 1005:
            closeReason = 'No status code was provided';
            break;
          case 1006:
            closeReason = 'Abnormal closure - connection was closed unexpectedly';
            // Add more detailed debugging for abnormal closures
            console.error('Abnormal WebSocket closure details:', {
              wsUrl: onConnect?.(vmId, sessionId),
              readyState: ws.readyState,
              protocol: ws.protocol,
              extensions: ws.extensions
            });
            addOutput('error', 'Connection was closed unexpectedly. This could be due to network issues or server problems.');
            if (wsUrl.startsWith('wss:')) {
              addOutput('info', 'Check if your network allows secure WebSocket connections (wss:).');
            }
            break;
          case 1007:
            closeReason = 'Invalid frame payload data: ' + closeReason;
            break;
          case 1008:
            closeReason = 'Policy violation: ' + closeReason;
            break;
          case 1009:
            closeReason = 'Message too big: ' + closeReason;
            break;
          case 1010:
            closeReason = 'Missing extension: ' + closeReason;
            break;
          case 1011:
            closeReason = 'Internal server error: ' + closeReason;
            break;
          case 1015:
            closeReason = 'TLS handshake failed';
            break;
          default:
            closeReason = `Connection closed (${event.code}): ${closeReason}`;
        }

        addOutput(closeType, closeReason);
        onDisconnect?.(vmId, sessionId, closeReason);

        // Remove keyboard event listener when connection is closed
        if (handleKeyDownRef.current) {
          document.removeEventListener('keydown', handleKeyDownRef.current);
        }

        // If this was an abnormal closure and we were connected, suggest reconnecting
        if (event.code === 1006 && connected) {
          addOutput('info', 'You can try reconnecting by clicking the Connect button above.');
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
          // Clear heartbeat interval if it exists
          if (websocketRef.current.heartbeatInterval) {
            clearInterval(websocketRef.current.heartbeatInterval);
            console.log('Cleared heartbeat interval');
          }

          // Close WebSocket connection
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
