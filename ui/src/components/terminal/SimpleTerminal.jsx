// SimpleTerminal.jsx
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import './Terminal.scss';

/**
 * A simplified SSH Terminal component for connecting to VMs
 * This version is more robust and has fewer dependencies
 */
const SimpleTerminal = ({
  vmId,
  vmName,
  sessionId,
  onConnect,
  onDisconnect,
  className = '',
}) => {
  // Terminal refs
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const websocketRef = useRef(null);
  const containerRef = useRef(null);
  
  // Terminal state
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  
  // Initialize terminal
  useEffect(() => {
    // Wait for the DOM to be ready
    if (!terminalRef.current) return;
    
    // Only initialize once
    if (initialized) return;
    
    try {
      console.log('Initializing terminal...');
      
      // Create terminal with safe defaults
      const terminal = new XTerm({
        fontSize: 14,
        fontFamily: 'monospace',
        cursorBlink: true,
        cols: 80,
        rows: 24,
        theme: {
          background: '#282c34',
          foreground: '#abb2bf',
        }
      });
      
      // Create fit addon
      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);
      
      // Store references
      xtermRef.current = terminal;
      fitAddonRef.current = fitAddon;
      
      // Open terminal
      terminal.open(terminalRef.current);
      
      // Initial welcome message
      terminal.writeln('Terminal initialized. Click Connect to start session.');
      
      // Mark as initialized
      setInitialized(true);
      
      // Fit terminal to container
      setTimeout(() => {
        try {
          if (fitAddon && terminalRef.current) {
            fitAddon.fit();
          }
        } catch (e) {
          console.error('Error fitting terminal:', e);
        }
      }, 100);
      
      // Set up window resize handler
      const handleResize = () => {
        try {
          if (fitAddon && terminalRef.current) {
            fitAddon.fit();
          }
        } catch (e) {
          console.error('Error fitting terminal on resize:', e);
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      // Clean up
      return () => {
        window.removeEventListener('resize', handleResize);
        
        if (websocketRef.current) {
          try {
            websocketRef.current.close();
          } catch (e) {
            console.error('Error closing websocket:', e);
          }
        }
        
        if (terminal) {
          try {
            terminal.dispose();
          } catch (e) {
            console.error('Error disposing terminal:', e);
          }
        }
      };
    } catch (e) {
      console.error('Error initializing terminal:', e);
      setError(`Failed to initialize terminal: ${e.message}`);
      return () => {};
    }
  }, [terminalRef.current, initialized]);
  
  // Connect to WebSocket
  const handleConnect = () => {
    if (!initialized || !xtermRef.current) {
      setError('Terminal not initialized');
      return;
    }
    
    if (connecting || connected) return;
    
    setConnecting(true);
    setError(null);
    
    try {
      // Get WebSocket URL
      const wsUrl = onConnect?.(vmId, sessionId);
      
      if (!wsUrl) {
        setConnecting(false);
        setError('No WebSocket URL provided');
        return;
      }
      
      console.log('Connecting to WebSocket:', wsUrl);
      
      // Create WebSocket
      const ws = new WebSocket(wsUrl, [`sessionId.${sessionId}`]);
      websocketRef.current = ws;
      
      // Handle WebSocket events
      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        setConnecting(false);
        
        // Welcome message
        xtermRef.current.writeln('\r\n\x1b[32mConnected to terminal session.\x1b[0m');
        xtermRef.current.writeln(`VM: ${vmName || 'Unknown'} (${vmId})`);
        xtermRef.current.writeln('--------------------------------------------------');
      };
      
      ws.onmessage = (event) => {
        if (!xtermRef.current) return;
        
        try {
          // Try to parse as JSON
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'data') {
              xtermRef.current.write(data.data);
            } else {
              xtermRef.current.write(data);
            }
          } catch (e) {
            // Not JSON, treat as raw data
            xtermRef.current.write(event.data);
          }
        } catch (e) {
          console.error('Error processing message:', e);
        }
      };
      
      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
        setConnected(false);
        setConnecting(false);
        
        if (xtermRef.current) {
          xtermRef.current.writeln('\r\n\x1b[31mConnection error\x1b[0m');
        }
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setConnected(false);
        
        if (xtermRef.current) {
          xtermRef.current.writeln(`\r\n\x1b[33mConnection closed (${event.code})\x1b[0m`);
        }
        
        onDisconnect?.(vmId, sessionId, event.reason);
      };
      
      // Handle terminal input
      if (xtermRef.current) {
        xtermRef.current.onData(data => {
          if (connected && ws.readyState === WebSocket.OPEN) {
            ws.send(data);
          }
        });
      }
    } catch (e) {
      console.error('Connection error:', e);
      setError(`Connection error: ${e.message}`);
      setConnected(false);
      setConnecting(false);
    }
  };
  
  // Disconnect from WebSocket
  const handleDisconnect = () => {
    if (websocketRef.current) {
      websocketRef.current.close(1000, 'User disconnected');
    }
    
    setConnected(false);
    onDisconnect?.(vmId, sessionId, 'User disconnected');
  };
  
  return (
    <div className="simple-terminal" ref={containerRef}>
      <div className="simple-terminal-toolbar">
        <div className="simple-terminal-info">
          {vmName ? `Terminal: ${vmName}` : 'Terminal'}
        </div>
        <div className="simple-terminal-actions">
          {!connected && (
            <button 
              className="simple-terminal-connect-btn"
              onClick={handleConnect}
              disabled={connecting || !initialized}
            >
              {connecting ? 'Connecting...' : 'Connect'}
            </button>
          )}
          {connected && (
            <button 
              className="simple-terminal-disconnect-btn"
              onClick={handleDisconnect}
            >
              Disconnect
            </button>
          )}
        </div>
      </div>
      
      <div className="simple-terminal-container">
        <div 
          className="simple-terminal-xterm"
          ref={terminalRef}
        />
        
        {error && (
          <div className="simple-terminal-error">
            {error}
          </div>
        )}
        
        <div className="simple-terminal-status">
          {connecting && 'Connecting...'}
          {connected && 'Connected'}
          {!connecting && !connected && 'Disconnected'}
        </div>
      </div>
    </div>
  );
};

SimpleTerminal.propTypes = {
  vmId: PropTypes.string.isRequired,
  vmName: PropTypes.string,
  sessionId: PropTypes.string,
  onConnect: PropTypes.func,
  onDisconnect: PropTypes.func
};

export default SimpleTerminal;
