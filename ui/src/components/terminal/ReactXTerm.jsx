import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { XTerm } from 'xterm-for-react';
import './ReactXTerm.css';

const ReactXTerm = ({ vmId, vmName, sessionId, onConnect, onDisconnect }) => {
  const terminalRef = useRef(null);
  const websocketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [currentCommand, setCurrentCommand] = useState('');

  // Handle connect
  const handleConnect = useCallback(() => {
    if (connecting || connected) return;

    setConnecting(true);
    setError(null);

    if (terminalRef.current && terminalRef.current.terminal) {
      try {
        console.log('Clearing terminal before connection');
        terminalRef.current.terminal.clear();
        console.log('Writing connecting message');
        terminalRef.current.terminal.writeln('Connecting to VM...');
        console.log('Writing test message');
        terminalRef.current.terminal.writeln('\r\n===== TESTING TERMINAL OUTPUT =====');
        terminalRef.current.terminal.writeln('If you can see this message, terminal output is working correctly');
        terminalRef.current.terminal.writeln('====== TEST END ======\r\n');
      } catch (error) {
        console.error('Error writing to terminal before connection:', error);
      }
    } else {
      console.error('Terminal reference is not available before connection');
    }

    // Get WebSocket URL from the onConnect callback
    const wsUrl = onConnect?.(vmId, sessionId);
    console.log('WebSocket URL:', wsUrl);

    if (!wsUrl) {
      console.error('No WebSocket URL provided');
      setError('No WebSocket URL provided');
      setConnecting(false);
      return;
    }

    try {
      const ws = new WebSocket(wsUrl);
      websocketRef.current = ws;

      ws.onopen = () => {
        console.log('%c WebSocket connection established', 'background: #222; color: #00ff00');
        setConnected(true);
        setConnecting(false);

        if (terminalRef.current && terminalRef.current.terminal) {
          try {
            console.log('Clearing terminal');
            terminalRef.current.terminal.clear();

            console.log('Writing welcome messages');
            terminalRef.current.terminal.writeln('Connected to VM');
            terminalRef.current.terminal.writeln('Nhập lệnh và nhấn Enter hoặc nút "Send Current Command" để gửi lệnh');
            terminalRef.current.terminal.writeln('');

            // Test terminal output
            console.log('Testing terminal output');
            terminalRef.current.terminal.writeln('\r\n===== TERMINAL TEST =====');
            terminalRef.current.terminal.writeln('If you can see this message, terminal output is working');
            terminalRef.current.terminal.writeln('====== TEST END ======\r\n');

            // Send terminal size to server
            const { cols, rows } = terminalRef.current.terminal;
            console.log('Sending terminal size to server:', { cols, rows });
            ws.send(JSON.stringify({
              type: 'resize',
              cols,
              rows
            }));
          } catch (error) {
            console.error('Error initializing terminal:', error);
          }
        } else {
          console.error('Terminal reference is not available');
        }

        // Set binary type to arraybuffer for better handling
        ws.binaryType = 'arraybuffer';
        console.log('WebSocket binary type set to:', ws.binaryType);

        // Set up heartbeat
        const heartbeatInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
        ws.heartbeatInterval = heartbeatInterval;

        // Notify parent component that connection is successful
        // Note: We don't call onConnect here because we already called it to get the WebSocket URL
      };

      ws.onmessage = (event) => {
        try {
          // Log raw message for debugging with more details
          console.log('%c WebSocket message received', 'background: #222; color: #bada55', {
            type: typeof event.data,
            isBlob: event.data instanceof Blob,
            isArrayBuffer: event.data instanceof ArrayBuffer,
            length: event.data.length || (event.data.size ? event.data.size : 'unknown'),
            data: typeof event.data === 'string' ? event.data.substring(0, 100) : '[Binary data]'
          });

          // Force terminal to show a test message to verify it's working
          if (terminalRef.current && terminalRef.current.terminal) {
            terminalRef.current.terminal.writeln('\r\n[DEBUG] Received data from server\r\n');
          }

          // Handle binary data (Blob or ArrayBuffer)
          if (event.data instanceof Blob || event.data instanceof ArrayBuffer) {
            console.log('%c Received binary data', 'background: #222; color: #ff9900');

            if (event.data instanceof Blob) {
              const reader = new FileReader();
              reader.onload = () => {
                if (terminalRef.current && terminalRef.current.terminal) {
                  const text = reader.result;
                  console.log('%c Blob data converted to text', 'background: #222; color: #ff9900', text.substring(0, 100) + '...');

                  // Try multiple ways to write to terminal
                  try {
                    console.log('Writing to terminal using write()');
                    terminalRef.current.terminal.write(text);

                    // Also try writeln for visibility
                    console.log('Writing to terminal using writeln()');
                    terminalRef.current.terminal.writeln('\r\n[DEBUG] Blob data received and processed\r\n');

                    // Try character by character for better compatibility
                    for (let i = 0; i < Math.min(text.length, 1000); i++) {
                      terminalRef.current.terminal.write(text[i]);
                    }
                  } catch (writeError) {
                    console.error('Error writing to terminal:', writeError);
                  }
                }
              };
              reader.readAsText(event.data);
            } else {
              // Handle ArrayBuffer
              try {
                const decoder = new TextDecoder('utf-8');
                const text = decoder.decode(event.data);
                console.log('%c ArrayBuffer data converted to text', 'background: #222; color: #ff9900', text.substring(0, 100) + '...');

                if (terminalRef.current && terminalRef.current.terminal) {
                  // Try multiple ways to write to terminal
                  try {
                    console.log('Writing to terminal using write()');
                    terminalRef.current.terminal.write(text);

                    // Also try writeln for visibility
                    console.log('Writing to terminal using writeln()');
                    terminalRef.current.terminal.writeln('\r\n[DEBUG] ArrayBuffer data received and processed\r\n');

                    // Try character by character for better compatibility
                    for (let i = 0; i < Math.min(text.length, 1000); i++) {
                      terminalRef.current.terminal.write(text[i]);
                    }
                  } catch (writeError) {
                    console.error('Error writing to terminal:', writeError);
                  }
                }
              } catch (error) {
                console.error('Error decoding ArrayBuffer:', error);
              }
            }
            return;
          }

          // Try to parse as JSON
          try {
            const data = JSON.parse(event.data);
            console.log('%c Parsed JSON data', 'background: #222; color: #00ff00', data);

            if (data.type === 'data') {
              // Write data to terminal
              if (terminalRef.current && terminalRef.current.terminal) {
                console.log('%c Writing data to terminal', 'background: #222; color: #00ff00', data.data);

                // Try multiple ways to write to terminal
                try {
                  console.log('Writing to terminal using write()');
                  terminalRef.current.terminal.write(data.data);

                  // Also try writeln for visibility
                  console.log('Writing to terminal using writeln()');
                  terminalRef.current.terminal.writeln('\r\n[DEBUG] JSON data received and processed\r\n');

                  // Try character by character for better compatibility
                  if (typeof data.data === 'string') {
                    for (let i = 0; i < Math.min(data.data.length, 1000); i++) {
                      terminalRef.current.terminal.write(data.data[i]);
                    }
                  }
                } catch (writeError) {
                  console.error('Error writing to terminal:', writeError);
                }
              }
            } else if (data.type === 'error') {
              // Handle error
              setError(data.message || 'Unknown error');
              if (terminalRef.current && terminalRef.current.terminal) {
                terminalRef.current.terminal.writeln(`\r\nError: ${data.message}\r\n`);
              }
            } else if (data.type === 'pong') {
              // Heartbeat response, no action needed
              console.log('Received pong from server');
            } else {
              // Unknown message type
              console.log('Unknown message type:', data.type);
              if (terminalRef.current && terminalRef.current.terminal) {
                terminalRef.current.terminal.writeln(`\r\nUnknown message type: ${data.type}\r\n`);
              }
            }
          } catch (jsonError) {
            // Not JSON, treat as raw data
            console.log('%c Not valid JSON, handling as raw data', 'background: #222; color: #ff00ff', jsonError.message);
            if (terminalRef.current && terminalRef.current.terminal && event.data) {
              console.log('Writing raw data to terminal');

              // Try multiple ways to write to terminal
              try {
                console.log('Writing to terminal using write()');
                terminalRef.current.terminal.write(event.data);

                // Also try writeln for visibility
                console.log('Writing to terminal using writeln()');
                terminalRef.current.terminal.writeln('\r\n[DEBUG] Raw data received and processed\r\n');

                // Try character by character for better compatibility
                if (typeof event.data === 'string') {
                  for (let i = 0; i < Math.min(event.data.length, 1000); i++) {
                    terminalRef.current.terminal.write(event.data[i]);
                  }
                }
              } catch (writeError) {
                console.error('Error writing to terminal:', writeError);
              }
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

        if (terminalRef.current && terminalRef.current.terminal) {
          terminalRef.current.terminal.writeln('\r\nDisconnected from server');
          terminalRef.current.terminal.writeln(`Code: ${event.code}, Reason: ${event.reason || 'No reason provided'}`);
          terminalRef.current.terminal.writeln('Click "Connect" to reconnect');
        }

        // Notify parent component
        if (onDisconnect) onDisconnect(sessionId);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error. Please try again.');
        setConnecting(false);

        if (terminalRef.current && terminalRef.current.terminal) {
          terminalRef.current.terminal.writeln('\r\nConnection error. Please try again.\r\n');
        }
      };

      // Set up terminal input
      if (terminalRef.current && terminalRef.current.terminal) {
        // Buffer to store input until Enter is pressed
        let inputBuffer = '';

        // Expose the buffer and send command function for the Send button
        websocketRef.current.inputBuffer = inputBuffer;
        websocketRef.current.sendCurrentCommand = () => {
          if (inputBuffer.trim() && ws.readyState === WebSocket.OPEN) {
            try {
              console.log('Sending current command:', inputBuffer);
              ws.send(JSON.stringify({
                type: 'input',
                data: inputBuffer + '\r'
              }));
              console.log('Command sent successfully');

              // Clear the buffer after sending
              inputBuffer = '';
              websocketRef.current.inputBuffer = '';
              setCurrentCommand('');
              return true;
            } catch (error) {
              console.error('Error sending command to server:', error);
              return false;
            }
          }
          return false;
        };

        terminalRef.current.terminal.onData((data) => {
          if (ws.readyState === WebSocket.OPEN) {
            // Log the data being sent
            console.log('Key pressed:', data.replace(/\r/g, '\\r').replace(/\n/g, '\\n'));

            // Check if Enter key is pressed (\r)
            if (data === '\r') {
              // Send the entire buffered command
              try {
                console.log('Enter pressed, sending command:', inputBuffer);
                ws.send(JSON.stringify({
                  type: 'input',
                  data: inputBuffer + '\r'
                }));
                console.log('Command sent successfully');

                // Clear the buffer after sending
                inputBuffer = '';
                setCurrentCommand('');
              } catch (error) {
                console.error('Error sending command to server:', error);
              }
            } else if (data === '\u007F') { // Backspace
              // Remove the last character from buffer
              if (inputBuffer.length > 0) {
                inputBuffer = inputBuffer.slice(0, -1);
                // Backspace should be handled by the terminal automatically
              }
            } else {
              // Add to buffer
              inputBuffer += data;
              // Update the reference in websocket object
              websocketRef.current.inputBuffer = inputBuffer;
              // Update current command state for display
              setCurrentCommand(inputBuffer);

              // Echo the input character
              if (data.length === 1 && data.charCodeAt(0) >= 32) {
                // Echo printable characters (including Vietnamese)
                terminalRef.current.terminal.write(data);
              }
            }
          } else {
            console.warn('Cannot send data: WebSocket not open (readyState:', ws.readyState, ')');
          }
        });
      }
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setError(`Failed to connect: ${error.message}`);
      setConnecting(false);

      if (terminalRef.current && terminalRef.current.terminal) {
        terminalRef.current.terminal.writeln(`\r\nFailed to connect: ${error.message}\r\n`);
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

      if (terminalRef.current && terminalRef.current.terminal) {
        terminalRef.current.terminal.writeln('\r\nDisconnected from server');
        terminalRef.current.terminal.writeln('Click "Connect" to reconnect');
      }

      // Notify parent component
      if (onDisconnect) onDisconnect(sessionId);
    } catch (error) {
      console.error('Error disconnecting:', error);
      setError(`Failed to disconnect: ${error.message}`);
    }
  }, [connected, sessionId, onDisconnect]);

  // Handle resize
  const handleResize = useCallback(() => {
    if (connected && websocketRef.current && terminalRef.current) {
      const { cols, rows } = terminalRef.current.terminal;
      websocketRef.current.send(JSON.stringify({
        type: 'resize',
        cols,
        rows
      }));
      console.log(`Terminal resized: ${cols}x${rows}`);
    }
  }, [connected]);

  // Add resize event listener
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (websocketRef.current) {
        // Clear heartbeat interval
        if (websocketRef.current.heartbeatInterval) {
          clearInterval(websocketRef.current.heartbeatInterval);
        }

        // Close WebSocket
        websocketRef.current.close();
        websocketRef.current = null;
      }
    };
  }, []);

  return (
    <div className="react-xterm">
      <div className="react-xterm-toolbar">
        <div className="react-xterm-info">
          {vmName ? `Terminal: ${vmName}` : 'Terminal'}
        </div>
        <div className="react-xterm-actions">
          {!connected && (
            <button
              className="react-xterm-connect-btn"
              onClick={handleConnect}
              disabled={connecting}
            >
              {connecting ? 'Connecting...' : 'Connect'}
            </button>
          )}
          {connected && (
            <>
              <button
                className="react-xterm-disconnect-btn"
                onClick={handleDisconnect}
              >
                Disconnect
              </button>
              <button
                className="react-xterm-clear-btn"
                onClick={() => {
                  if (terminalRef.current && terminalRef.current.terminal) {
                    terminalRef.current.terminal.clear();
                  }
                }}
              >
                Clear
              </button>
              <button
                className="react-xterm-test-btn"
                onClick={() => {
                  if (terminalRef.current && terminalRef.current.terminal) {
                    terminalRef.current.terminal.writeln('\r\nTest message - if you see this, terminal output is working\r\n');

                    // Send a test command to the server
                    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
                      try {
                        websocketRef.current.send(JSON.stringify({
                          type: 'input',
                          data: 'echo "Test command from client"\r\n'
                        }));
                      } catch (error) {
                        console.error('Error sending test command:', error);
                      }
                    }
                  }
                }}
              >
                Test Output
              </button>
              <button
                className="react-xterm-send-btn"
                onClick={() => {
                  if (terminalRef.current && terminalRef.current.terminal &&
                      websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
                    try {
                      // Send a command that will produce output
                      websocketRef.current.send(JSON.stringify({
                        type: 'input',
                        data: 'ls -la\r\n'
                      }));
                    } catch (error) {
                      console.error('Error sending ls command:', error);
                    }
                  }
                }}
              >
                Send 'ls -la'
              </button>
              <button
                className="react-xterm-send-current-btn"
                onClick={() => {
                  if (websocketRef.current && websocketRef.current.sendCurrentCommand) {
                    websocketRef.current.sendCurrentCommand();
                  }
                }}
              >
                Send Current Command
              </button>
            </>
          )}
        </div>
      </div>

      <div className="react-xterm-container">
        <XTerm
          ref={terminalRef}
          options={{
            cursorBlink: true,
            cursorStyle: 'block',
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            fontSize: 14,
            lineHeight: 1.2,
            allowTransparency: true,
            convertEol: true,
            scrollback: 1000,
            disableStdin: false,
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
          }}
          onResize={handleResize}
        />
      </div>

      {error && (
        <div className="react-xterm-error">
          {error}
        </div>
      )}

      <div className="react-xterm-status">
        <div className="status-info">
          {connecting && 'Connecting...'}
          {connected && 'Connected'}
          {!connecting && !connected && 'Disconnected'}
        </div>
        {connected && currentCommand && (
          <div className="current-command">
            Current command: <span className="command-text">{currentCommand}</span>
          </div>
        )}
      </div>
    </div>
  );
};

ReactXTerm.propTypes = {
  vmId: PropTypes.string.isRequired,
  vmName: PropTypes.string,
  sessionId: PropTypes.string,
  onConnect: PropTypes.func,
  onDisconnect: PropTypes.func
};

export default ReactXTerm;
