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

        // Add more debug information
        console.log('Browser WebSocket support:', {
          WebSocket: typeof WebSocket !== 'undefined',
          protocol: window.location.protocol,
          host: window.location.host,
          origin: window.location.origin
        });

        // Create WebSocket with the session ID as the protocol
        try {
          // First, check if the URL is valid
          const urlPattern = /^(wss?:\/\/)[\w.-]+(:\d+)?(\/\S*)?$/;
          if (!urlPattern.test(wsUrl)) {
            console.error('Invalid WebSocket URL:', wsUrl);
            addOutput('error', `Invalid WebSocket URL: ${wsUrl}`);
            throw new Error(`Invalid WebSocket URL: ${wsUrl}`);
          }

          // Create WebSocket with protocol
          console.log('Creating WebSocket with protocol:', [`sessionId.${sessionId}`]);

          // First try: with protocol array
          try {
            ws = new WebSocket(wsUrl, [`sessionId.${sessionId}`]);
            // Set binary type to blob for better handling
            ws.binaryType = 'blob';
            websocketRef.current = ws;
            addOutput('info', 'WebSocket created with session protocol (array format)');
          } catch (protocolError) {
            console.error('Error creating WebSocket with protocol array:', protocolError);

            // Second try: with string protocol
            try {
              console.log('Trying with string protocol');
              ws = new WebSocket(wsUrl, `sessionId.${sessionId}`);
              // Set binary type to blob for better handling
              ws.binaryType = 'blob';
              websocketRef.current = ws;
              addOutput('info', 'WebSocket created with session protocol (string format)');
            } catch (stringProtocolError) {
              console.error('Error creating WebSocket with string protocol:', stringProtocolError);

              // Third try: without protocol, using URL parameter only
              console.log('Falling back to URL parameter only');
              // Make sure the URL has the sessionId parameter
              const urlWithSession = wsUrl.includes('?') ?
                (wsUrl.includes('sessionId=') ? wsUrl : `${wsUrl}&sessionId=${sessionId}`) :
                `${wsUrl}?sessionId=${sessionId}`;

              ws = new WebSocket(urlWithSession);
              // Set binary type to blob for better handling
              ws.binaryType = 'blob';
              websocketRef.current = ws;
              addOutput('info', 'WebSocket created without protocol (using URL parameter)');
            }
          }
        } catch (error) {
          console.error('Error creating WebSocket object:', error);
          addOutput('error', `Error creating WebSocket object: ${error.message}`);

          // Try without protocol
          try {
            console.log('Trying to create WebSocket without protocol');
            ws = new WebSocket(wsUrl);
            // Set binary type to blob for better handling
            ws.binaryType = 'blob';
            websocketRef.current = ws;
            addOutput('warning', 'Created WebSocket without protocol - authentication may fail');

            // Send authentication message manually
            setTimeout(() => {
              if (ws.readyState === WebSocket.OPEN) {
                console.log('Sending manual authentication message');
                ws.send(JSON.stringify({
                  type: 'auth',
                  sessionId: sessionId
                }));
                addOutput('info', 'Sent manual authentication message');
              }
            }, 1000); // Wait 1 second before sending auth message
          } catch (fallbackError) {
            console.error('Error creating WebSocket without protocol:', fallbackError);
            addOutput('error', `Error creating WebSocket without protocol: ${fallbackError.message}`);
            throw fallbackError;
          }
        }

        // Log WebSocket object properties
        console.log('WebSocket created:', {
          url: wsUrl,
          protocol: ws.protocol,
          readyState: ws.readyState,
          binaryType: ws.binaryType
        });

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
        addOutput('info', 'Click on the terminal and start typing to interact with the VM.');
        addOutput('info', 'Press Ctrl+C to interrupt a command, Ctrl+D to exit.');
        addOutput('info', '--------------------------------------------------');

        // Add keyboard event listener after connection is established
        if (handleKeyDownRef.current) {
          document.addEventListener('keydown', handleKeyDownRef.current);
        }

        // Auto-focus the terminal
        if (terminalRef.current) {
          setTimeout(() => {
            terminalRef.current.focus();
          }, 100);
        }

        // Send authentication message as a backup method
        try {
          console.log('Sending authentication message with session ID');
          ws.send(JSON.stringify({
            type: 'auth',
            sessionId: sessionId
          }));
        } catch (authError) {
          console.error('Error sending authentication message:', authError);
        }

        // Set up heartbeat to keep connection alive
        const heartbeatInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            // Send a ping message
            try {
              ws.send(JSON.stringify({ type: 'ping' }));
              console.log('Sent heartbeat ping');

              // Check if we've received a pong recently
              const lastPongTime = websocketRef.current.lastPongTime || 0;
              const now = Date.now();

              // If we haven't received a pong in 30 seconds, consider the connection dead
              if (lastPongTime > 0 && now - lastPongTime > 30000) {
                console.warn('No pong received in 30 seconds, connection may be dead');
                addOutput('warning', 'No response from server in 30 seconds, connection may be dead');

                // Try to reconnect
                try {
                  ws.close(1000, 'No pong received');
                  addOutput('info', 'Attempting to reconnect...');

                  // Clear the interval before reconnecting
                  clearInterval(heartbeatInterval);

                  // Wait a moment before reconnecting
                  setTimeout(() => {
                    if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
                      handleConnect();
                    }
                  }, 2000);
                } catch (closeError) {
                  console.error('Error closing dead connection:', closeError);
                }
              }
            } catch (pingError) {
              console.error('Error sending heartbeat ping:', pingError);
              clearInterval(heartbeatInterval);
            }
          } else {
            // Clear interval if connection is closed
            clearInterval(heartbeatInterval);
            console.log('Heartbeat stopped - connection is not open');
          }
        }, 10000); // Send heartbeat every 10 seconds

        // Store interval ID and initial timestamp for cleanup and monitoring
        websocketRef.current.heartbeatInterval = heartbeatInterval;
        websocketRef.current.lastPongTime = Date.now(); // Initialize with current time
      };

      ws.onmessage = (event) => {
        try {
          // Check if the data is a Blob
          if (event.data instanceof Blob) {
            // Handle binary data
            const reader = new FileReader();
            reader.onload = () => {
              try {
                // Convert ArrayBuffer to string
                const text = new TextDecoder('utf-8').decode(reader.result);
                addOutput('output', text);
              } catch (blobError) {
                console.error('Error processing binary data:', blobError);
                addOutput('error', `Error processing binary data: ${blobError.message}`);
              }
            };
            reader.onerror = (fileError) => {
              console.error('Error reading blob:', fileError);
              addOutput('error', 'Error reading binary data');
            };
            reader.readAsArrayBuffer(event.data);
            return;
          }

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
            // Not JSON, treat as raw data (but ensure it's a string)
            if (typeof event.data === 'string') {
              addOutput('output', event.data);
            } else {
              console.warn('Received non-string, non-blob data:', typeof event.data);
              addOutput('output', String(event.data));
            }
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
          addOutput('info', 'You can also try using the CORS Unblock extension for Chrome or Firefox.');
        }

        // Suggest alternative approaches
        addOutput('info', 'Trying to check server availability...');

        // Check for network connectivity issues
        fetch('https://api.infrawatch.website/health')
          .then(response => {
            if (response.ok) {
              addOutput('info', 'API server is reachable. The issue might be with WebSocket specifically.');
              addOutput('info', 'Possible solutions:');
              addOutput('info', '1. Try using a CORS Unblock extension for your browser');
              addOutput('info', '2. Try running the UI with HTTPS: HTTPS=true npm start');
              addOutput('info', '3. Try using a different browser');
              addOutput('info', '4. Check if your network allows WebSocket connections');
            } else {
              addOutput('warning', `API server returned status ${response.status}. There might be connectivity issues.`);
            }
          })
          .catch(err => {
            addOutput('warning', `Cannot reach API server: ${err.message}. Check your network connection.`);
          });
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setConnected(false);

        // Log detailed information about the connection
        console.log('WebSocket close details:', {
          url: wsUrl,
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          timestamp: new Date().toISOString()
        });

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

        // If this was an abnormal closure, provide more detailed suggestions
        if (event.code === 1006) {
          addOutput('info', 'You can try reconnecting by clicking the Connect button above.');
          addOutput('info', 'If the issue persists, try the following:');
          addOutput('info', '1. Install a CORS Unblock extension for your browser');
          addOutput('info', '2. Run the UI with HTTPS: HTTPS=true npm start');
          addOutput('info', '3. Try using a different browser');
          addOutput('info', '4. Check if your network allows WebSocket connections');
          addOutput('info', '5. Try connecting to the VM using a standard SSH client');
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
    const ctrl = event.ctrlKey;
    const alt = event.altKey;

    // Handle special keys and combinations
    if (key.length === 1 ||
        key === 'Enter' ||
        key === 'Backspace' ||
        key === 'Tab' ||
        key === 'Escape' ||
        key === 'Delete' ||
        key === 'Home' ||
        key === 'End' ||
        key === 'PageUp' ||
        key === 'PageDown' ||
        key === 'ArrowUp' ||
        key === 'ArrowDown' ||
        key === 'ArrowLeft' ||
        key === 'ArrowRight' ||
        (ctrl && key.length === 1)) {

      event.preventDefault();

      let data;

      // Handle control key combinations
      if (ctrl && key.length === 1) {
        // Convert to control character (ASCII control codes are 1-26)
        const charCode = key.toUpperCase().charCodeAt(0) - 64;
        if (charCode > 0 && charCode < 27) {
          data = String.fromCharCode(charCode);
        } else {
          data = key;
        }
      } else if (key === 'Enter') {
        data = '\r';
      } else if (key === 'Backspace') {
        data = '\u007F'; // Delete character
      } else if (key === 'Delete') {
        data = '\u001b[3~'; // ANSI escape sequence for delete
      } else if (key === 'Tab') {
        data = '\t';
      } else if (key === 'Escape') {
        data = '\u001b'; // ESC character
      } else if (key === 'Home') {
        data = '\u001b[H'; // ANSI escape sequence for home
      } else if (key === 'End') {
        data = '\u001b[F'; // ANSI escape sequence for end
      } else if (key === 'PageUp') {
        data = '\u001b[5~'; // ANSI escape sequence for page up
      } else if (key === 'PageDown') {
        data = '\u001b[6~'; // ANSI escape sequence for page down
      } else if (key === 'ArrowUp') {
        data = '\u001b[A'; // ANSI escape sequence for up arrow
      } else if (key === 'ArrowDown') {
        data = '\u001b[B'; // ANSI escape sequence for down arrow
      } else if (key === 'ArrowRight') {
        data = '\u001b[C'; // ANSI escape sequence for right arrow
      } else if (key === 'ArrowLeft') {
        data = '\u001b[D'; // ANSI escape sequence for left arrow
      } else {
        data = key;
      }

      // Send data as JSON to ensure it's processed correctly
      try {
        websocketRef.current.send(JSON.stringify({
          type: 'input',
          data: data
        }));
        console.log('Sent key:', key);
      } catch (error) {
        console.error('Error sending key:', error);
        // Fallback to sending raw data
        websocketRef.current.send(data);
      }
    }
  }, [connected]);

  // Store the callback in a ref to avoid dependency cycles
  useEffect(() => {
    handleKeyDownRef.current = handleKeyDown;
  }, [handleKeyDown]);

  // Add output to terminal
  const addOutput = (type, text) => {
    // Check if text is a valid React child
    if (text instanceof Blob || text instanceof ArrayBuffer) {
      console.error('Invalid React child: Received binary data instead of string', text);
      // Convert to string representation
      text = `[Binary data: ${text.size || text.byteLength} bytes]`;
    } else if (typeof text !== 'string' && typeof text !== 'number') {
      console.warn('Non-string output:', typeof text, text);
      // Convert to string
      try {
        text = String(text);
      } catch (e) {
        text = '[Object]';
      }
    }

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

  // Track if terminal is focused
  const [isFocused, setIsFocused] = useState(false);

  // Handle focus and blur events
  const handleTerminalFocus = () => {
    setIsFocused(true);
  };

  const handleTerminalBlur = () => {
    setIsFocused(false);
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
        className={`basic-terminal-output ${isFocused ? 'focused' : ''}`}
        ref={terminalRef}
        onClick={handleTerminalClick}
        onFocus={handleTerminalFocus}
        onBlur={handleTerminalBlur}
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
        {connected && !isFocused && 'Click to focus terminal'}
        {connected && isFocused && 'Terminal ready (typing...)'}
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
