import { useState, useEffect, useCallback, useRef } from 'react';
import useAuth from './useAuth';
import useNotification from './useNotification';
import { getAccessToken } from '../utils/storage.utils';

/**
 * Custom hook for handling Server-Sent Events (SSE)
 *
 * @returns {Object} SSE connection state and event handlers
 */
export const useSSE = () => {
  const { user } = useAuth();
  const { showError } = useNotification();
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const eventSourceRef = useRef(null);
  const eventHandlersRef = useRef({});

  /**
   * Connect to the SSE endpoint
   */
  const connect = useCallback(() => {
    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const token = getAccessToken();

      // For development, use a mock token if not available
      const authToken = token || 'mock-token-for-development';

      // Create new EventSource connection with auth token
      // For development, use a mock endpoint that doesn't actually connect
      const sseUrl = process.env.NODE_ENV === 'development'
        ? '/mock-sse-endpoint'
        : `/api/v1/events/subscribe?token=${authToken}`;

      // In development, create a mock EventSource that doesn't actually connect
      let eventSource;

      if (process.env.NODE_ENV === 'development') {
        // Create a mock EventSource for development
        eventSource = {
          close: () => console.log('Mock SSE connection closed'),
          addEventListener: () => {},
          removeEventListener: () => {},
          onopen: null,
          onerror: null
        };

        // Simulate connection success
        setTimeout(() => {
          if (eventSource.onopen) {
            eventSource.onopen();
          }
        }, 500);
      } else {
        // Real EventSource for production
        eventSource = new EventSource(sseUrl);
      }
      eventSourceRef.current = eventSource;

      // Handle connection open
      eventSource.onopen = () => {
        setConnected(true);
        setError(null);
        console.log('SSE connection established');
      };

      // Handle connection error
      eventSource.onerror = (err) => {
        console.error('SSE connection error:', err);
        setConnected(false);
        setError('Failed to connect to event stream');

        // Auto-reconnect after a delay
        setTimeout(() => {
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            connect();
          }
        }, 5000);
      };

      // Handle 'connected' event from server
      eventSource.addEventListener('connected', (event) => {
        const data = JSON.parse(event.data);
        console.log('SSE connected event:', data);
      });

      // Set up event listeners for registered handlers
      Object.entries(eventHandlersRef.current).forEach(([eventName, handler]) => {
        eventSource.addEventListener(eventName, (event) => {
          try {
            const data = JSON.parse(event.data);
            handler(data);
          } catch (err) {
            console.error(`Error handling SSE event ${eventName}:`, err);
          }
        });
      });

    } catch (err) {
      setConnected(false);
      setError(err.message);
      showError('SSE Connection Error', err.message);
      console.error('Error establishing SSE connection:', err);
    }
  }, [showError]);

  /**
   * Register an event handler for a specific event type
   *
   * @param {string} eventName - Name of the event to listen for
   * @param {Function} handler - Function to call when event is received
   */
  const addEventListener = useCallback((eventName, handler) => {
    if (typeof handler !== 'function') {
      console.error(`Event handler for ${eventName} must be a function`);
      return;
    }

    // Store the handler in our ref
    eventHandlersRef.current = {
      ...eventHandlersRef.current,
      [eventName]: handler
    };

    // If we already have an active connection, add the listener
    if (eventSourceRef.current) {
      eventSourceRef.current.addEventListener(eventName, (event) => {
        try {
          const data = JSON.parse(event.data);
          handler(data);
        } catch (err) {
          console.error(`Error handling SSE event ${eventName}:`, err);
        }
      });
    }
  }, []);

  /**
   * Remove an event handler for a specific event type
   *
   * @param {string} eventName - Name of the event to stop listening for
   */
  const removeEventListener = useCallback((eventName) => {
    // Remove from our handlers ref
    const { [eventName]: _, ...rest } = eventHandlersRef.current;
    eventHandlersRef.current = rest;

    // If we have an active connection, remove the listener
    if (eventSourceRef.current) {
      eventSourceRef.current.removeEventListener(eventName);
    }
  }, []);

  /**
   * Disconnect from the SSE endpoint
   */
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setConnected(false);
    }
  }, []);

  // Connect to SSE when the hook is first used
  useEffect(() => {
    connect();

    // Clean up on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connect]);

  return {
    connected,
    error,
    connect,
    disconnect,
    addEventListener,
    removeEventListener
  };
};
