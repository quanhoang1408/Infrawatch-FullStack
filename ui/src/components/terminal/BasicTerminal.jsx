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
  const [currentInput, setCurrentInput] = useState('');
  const [renderKey, setRenderKey] = useState(0); // Add a render key to force re-renders

  // Add output to terminal
  const addOutput = (type, text) => {
    // Check if text is a valid React child
    if (text instanceof Blob || text instanceof ArrayBuffer) {
      console.error('Invalid React child: Received binary data instead of string');
      // Convert to string representation
      text = `[Binary data: ${text.size || text.byteLength} bytes]`;
    } else if (typeof text !== 'string' && typeof text !== 'number') {
      console.warn('Non-string output:', typeof text);
      // Convert to string
      try {
        text = String(text);
      } catch (e) {
        text = '[Object]';
      }
    }

    // Process ANSI escape sequences for better display
    if (typeof text === 'string') {
      // Remove ANSI color codes but keep line breaks and other control characters
      text = text.replace(/\x1b\[[0-9;]*[mGKH]/g, '');
    }

    // Force state update with a new array reference
    setOutput(prev => {
      const newOutput = [...prev, { type, text }];
      return newOutput;
    });

    // Force render by updating the render key
    setRenderKey(prev => prev + 1);

    // Force scroll to bottom after state update
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 10);
  };

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

      addOutput('info', `Connecting to ${wsUrl}...`);

      // Create WebSocket with better error handling
      let ws;
      try {
        addOutput('info', `Creating WebSocket connection with protocol sessionId.${sessionId}`);

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

          // First try: with protocol array
          try {
            ws = new WebSocket(wsUrl, [`sessionId.${sessionId}`]);
            // Set binary type to arraybuffer for better handling
            ws.binaryType = 'arraybuffer';
            websocketRef.current = ws;
            addOutput('info', 'WebSocket created with session protocol (array format)');
          } catch (protocolError) {
            console.error('Error creating WebSocket with protocol array:', protocolError);

            // Second try: with string protocol
            try {
              console.log('Trying with string protocol');
              ws = new WebSocket(wsUrl, `sessionId.${sessionId}`);
              // Set binary type to arraybuffer for better handling
              ws.binaryType = 'arraybuffer';
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
              // Set binary type to arraybuffer for better handling
              ws.binaryType = 'arraybuffer';
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
            // Set binary type to arraybuffer for better handling
            ws.binaryType = 'arraybuffer';
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
        setConnected(true);
        setConnecting(false);
        addOutput('success', 'Connected to terminal session');
        addOutput('info', `VM: ${vmName || 'Unknown'} (${vmId})`);
        addOutput('info', '--------------------------------------------------');
        addOutput('info', 'CLICK ANYWHERE IN THE TERMINAL AREA TO START TYPING');
        addOutput('info', 'The cursor will appear and you can type commands directly.');
        addOutput('info', 'Press Enter to execute commands. Use Ctrl+C to interrupt.');
        addOutput('info', '--------------------------------------------------');

        // Add keyboard event listener after connection is established
        if (handleKeyDownRef.current) {
          // Remove any existing listener first to avoid duplicates
          document.removeEventListener('keydown', handleKeyDownRef.current);
          document.addEventListener('keydown', handleKeyDownRef.current);
        } else {
          console.warn('No handleKeyDownRef.current available');
        }

        // Auto-focus the terminal
        if (terminalRef.current) {
          setTimeout(() => {
            const hiddenInput = terminalRef.current.querySelector('.hidden-input');
            if (hiddenInput) {
              hiddenInput.focus();

            } else {
              terminalRef.current.focus();

            }
          }, 100);
        }

        // Send authentication message as a backup method
        try {

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
          // Handle binary data
          if (event.data instanceof Blob) {
            const reader = new FileReader();
            reader.onload = () => {
              const text = reader.result;
              const cleanText = text.replace(/\x1b\[[0-9;]*[mGKH]/g, '');
              addOutput('output', cleanText);
            };
            reader.readAsText(event.data);
            return;
          } else if (event.data instanceof ArrayBuffer) {
            try {
              const decoder = new TextDecoder('utf-8');
              const text = decoder.decode(event.data);
              const cleanText = text.replace(/\x1b\[[0-9;]*[mGKH]/g, '');
              addOutput('output', cleanText);
            } catch (error) {
              console.error('Error decoding ArrayBuffer:', error);
            }
            return;
          }

          // Try to parse as JSON
          if (typeof event.data === 'string') {
            try {
              const data = JSON.parse(event.data);
              if (data.type === 'data') {
                const outputText = typeof data.data === 'string' ? data.data : String(data.data);
                const cleanText = outputText.replace(/\x1b\[[0-9;]*[mGKH]/g, '');
                addOutput('output', cleanText);
              } else if (data.type === 'pong') {
                websocketRef.current.lastPongTime = Date.now();
              } else {
                const outputText = JSON.stringify(data);
                addOutput('output', outputText);
              }
            } catch (e) {
              const cleanText = event.data.replace(/\x1b\[[0-9;]*[mGKH]/g, '');
              addOutput('output', cleanText);
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

  // Method to send a command directly to the terminal
  const sendCommand = useCallback((command) => {
    if (!connected || !websocketRef.current) {
      console.error('Cannot send command: not connected');
      return false;
    }

    try {
      // Send each character with a small delay to simulate typing
      let i = 0;
      const sendNextChar = () => {
        if (i < command.length) {
          const char = command[i++];
          websocketRef.current.send(JSON.stringify({
            type: 'input',
            data: char
          }));
          setTimeout(sendNextChar, 10);
        } else {
          // Send Enter at the end
          websocketRef.current.send(JSON.stringify({
            type: 'input',
            data: '\r'
          }));
        }
      };

      sendNextChar();
      return true;
    } catch (error) {
      console.error('Error sending command:', error);
      return false;
    }
  }, [connected]);

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

  // Update current input line
  const updateCurrentInput = useCallback((key) => {
    if (key === '\r') {
      // Enter key - submit command
      // Add the command to output
      addOutput('command', `$ ${currentInput}`);
      // Clear current input
      setCurrentInput('');
    } else if (key === '\u007F') {
      // Backspace - remove last character
      setCurrentInput(prev => prev.slice(0, -1));
    } else if (key.length === 1) {
      // Regular character - add to input
      setCurrentInput(prev => prev + key);
    }
  }, [currentInput, addOutput]);

  // Handle key down events - memoized to avoid dependency issues
  const handleKeyDown = useCallback((event) => {
    if (!connected || !websocketRef.current) {
      return;
    }

    // Always process key events when connected
    // We're relying on the hidden textarea to capture all keyboard input

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

      // For all keys, send directly to server
      // This ensures that terminal functionality like arrow keys, tab completion, etc. work properly
      try {
        // Send as JSON format
        const jsonData = JSON.stringify({
          type: 'input',
          data: data
        });
        websocketRef.current.send(jsonData);
      } catch (error) {
        console.error('Error sending data:', error);
      }

      // Update the current input line for display purposes
      updateCurrentInput(data);
    }
  }, [connected, currentInput, updateCurrentInput, addOutput]);

  // Note: addOutput function has been moved above handleConnect to fix the reference error

  // Store the callback in a ref to avoid dependency cycles
  useEffect(() => {
    handleKeyDownRef.current = handleKeyDown;
  }, [handleKeyDown]);

  // Scroll to bottom when output changes
  useEffect(() => {
    // Scroll to bottom
    if (terminalRef.current) {
      try {
        // Use requestAnimationFrame to ensure DOM has updated
        requestAnimationFrame(() => {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        });
      } catch (error) {
        console.error('Error scrolling terminal to bottom:', error);
      }
    }
  }, [output]);

  // Handle terminal resize
  const sendTerminalResize = useCallback(() => {
    if (connected && websocketRef.current) {
      try {
        // Get terminal dimensions
        const terminalElement = terminalRef.current;
        if (!terminalElement) return;

        // Calculate approximate character dimensions based on the terminal font
        const testChar = document.createElement('span');
        testChar.style.fontFamily = getComputedStyle(terminalElement).fontFamily;
        testChar.style.fontSize = getComputedStyle(terminalElement).fontSize;
        testChar.style.position = 'absolute';
        testChar.style.visibility = 'hidden';
        testChar.textContent = 'X';
        document.body.appendChild(testChar);

        const charWidth = testChar.getBoundingClientRect().width;
        const charHeight = testChar.getBoundingClientRect().height;
        document.body.removeChild(testChar);

        // Calculate columns and rows
        const terminalWidth = terminalElement.clientWidth;
        const terminalHeight = terminalElement.clientHeight;

        const cols = Math.floor(terminalWidth / charWidth);
        const rows = Math.floor(terminalHeight / charHeight);

        // Send resize event to server
        websocketRef.current.send(JSON.stringify({
          type: 'resize',
          cols: Math.max(cols, 80), // Minimum 80 columns
          rows: Math.max(rows, 24)  // Minimum 24 rows
        }));


      } catch (error) {
        console.error('Error sending terminal resize:', error);
      }
    }
  }, [connected]);

  // Send terminal size on connection and window resize
  useEffect(() => {
    if (connected) {
      // Send initial size
      sendTerminalResize();

      // Add resize event listener
      const handleResize = () => {
        sendTerminalResize();
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [connected, sendTerminalResize]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      try {
        if (websocketRef.current) {
          // Clear heartbeat interval if it exists
          if (websocketRef.current.heartbeatInterval) {
            clearInterval(websocketRef.current.heartbeatInterval);
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
  const handleTerminalClick = (e) => {
    // Don't prevent default to allow text selection
    // if (e) e.preventDefault();

    if (terminalRef.current) {
      // Only focus if we're not selecting text
      const selection = window.getSelection();
      if (!selection || !selection.toString()) {
        // Focus the hidden input instead of the div
        const hiddenInput = terminalRef.current.querySelector('.hidden-input');
        if (hiddenInput) {
          // Save current scroll position
          const scrollTop = terminalRef.current.scrollTop;

          hiddenInput.focus();

          // Restore scroll position after focus
          setTimeout(() => {
            if (terminalRef.current) {
              terminalRef.current.scrollTop = scrollTop;
            }
          }, 0);
        } else {
          terminalRef.current.focus();
        }
      }
    }
  };

  // Track if terminal is focused
  const [isFocused, setIsFocused] = useState(false);
  // Track selected text for copy
  const [selectedText, setSelectedText] = useState('');

  // Handle focus and blur events
  const handleTerminalFocus = () => {
    setIsFocused(true);
    // Focus the hidden textarea
    setTimeout(() => {
      const textarea = terminalRef.current?.querySelector('.hidden-input');
      if (textarea && document.activeElement !== textarea) {
        textarea.focus();
      }
    }, 0);
  };

  const handleTerminalBlur = (e) => {
    // Only set as blurred if we're not focusing the textarea
    if (e.relatedTarget !== terminalRef.current?.querySelector('.hidden-input')) {
      setIsFocused(false);
    }
  };

  // Handle text selection for copy
  const handleMouseUp = (e) => {
    // Don't focus the hidden input when selecting text
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      setSelectedText(selection.toString());
      // Copy to clipboard if Ctrl+C is pressed
      const handleCopy = (e) => {
        if (e.ctrlKey && e.key === 'c') {
          e.preventDefault();
          navigator.clipboard.writeText(selectedText)
            .then(() => {
              console.log('Text copied to clipboard');
            })
            .catch(err => {
              console.error('Failed to copy text: ', err);
            });
        }
      };

      document.addEventListener('keydown', handleCopy, { once: true });

      // Prevent the terminal from focusing the hidden input
      e.stopPropagation();
    }
  };

  // Handle copy event
  const handleCopy = (e) => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      e.clipboardData.setData('text/plain', selection.toString());
      e.preventDefault();
      console.log('Text copied to clipboard');
    }
  };

  // Copy all terminal content
  const copyAllContent = () => {
    // Get all text content from terminal output
    const terminalContent = output.map(line => line.text).join('\n');

    // Copy to clipboard
    navigator.clipboard.writeText(terminalContent)
      .then(() => {
        console.log('All terminal content copied to clipboard');
        // Show temporary success message
        const copyButton = document.querySelector('.copy-button');
        if (copyButton) {
          const originalText = copyButton.textContent;
          copyButton.textContent = 'Copied!';
          setTimeout(() => {
            copyButton.textContent = originalText;
          }, 2000);
        }
      })
      .catch(err => {
        console.error('Failed to copy terminal content: ', err);
      });
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
        onMouseUp={handleMouseUp}
        onCopy={handleCopy}
        onKeyDown={(e) => {
          if (handleKeyDownRef.current) {
            handleKeyDownRef.current(e);
          }
        }}
        tabIndex="0"
        key={renderKey} // Add render key to force re-renders
      >
        {/* Copy button */}
        {connected && (
          <button className="copy-button" onClick={copyAllContent}>
            Copy All
          </button>
        )}
        {/* Hidden textarea to capture keyboard events */}
        <textarea
          className="hidden-input"
          autoFocus={connected}
          spellCheck="false"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          onKeyDown={(e) => {
            e.stopPropagation();
            if (handleKeyDownRef.current) {
              handleKeyDownRef.current(e);
            }
            // Prevent default for most keys to avoid textarea behavior
            if (e.key !== 'F5' && e.key !== 'F12' && !e.ctrlKey) {
              e.preventDefault();
            }
          }}
          onInput={(e) => {
            // Clear the textarea after each input to avoid accumulation
            e.target.value = '';
          }}
          onBlur={() => {
            // Re-focus if terminal is still focused
            if (isFocused && connected) {
              setTimeout(() => {
                const textarea = terminalRef.current?.querySelector('.hidden-input');
                if (textarea) textarea.focus();
              }, 10);
            }
          }}
        />
        {/* Output lines */}
        {output.map((line, index) => (
          <div key={`${index}-${renderKey}`} className={`terminal-line ${line.type}`}>
            {line.text}
          </div>
        ))}

        {/* Current input line with cursor */}
        {connected && (
          <div className="terminal-line input-line">
            <span className="prompt">$ </span>
            <span className="input-text">{currentInput}</span>
            {isFocused && <span className="cursor"></span>}
          </div>
        )}
      </div>

      {error && (
        <div className="basic-terminal-error">
          {error}
        </div>
      )}

      <div className="basic-terminal-status">
        {connecting && 'Connecting...'}
        {connected && !isFocused && (
          <>
            <span>Terminal not focused. </span>
            <button
              className="focus-terminal-btn"
              onClick={handleTerminalClick}
            >
              Click to focus
            </button>
          </>
        )}
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