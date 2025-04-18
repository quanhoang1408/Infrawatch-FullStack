import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSSE } from '../hooks/useSSE';
import useAuth from '../hooks/useAuth';
import useNotification from '../hooks/useNotification';

// Create context
const SSEContext = createContext(null);

/**
 * Provider component for SSE functionality
 */
export const SSEProvider = ({ children }) => {
  const sse = useSSE();
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [vmUpdates, setVmUpdates] = useState({});
  const [monitoringUpdates, setMonitoringUpdates] = useState({});

  // Handle VM status updates
  const handleVmStatusUpdate = useCallback((data) => {
    if (!data || !data.vmId) return;

    console.log('VM status update received:', data);

    setVmUpdates(prev => ({
      ...prev,
      [data.vmId]: {
        timestamp: new Date(),
        status: data.status,
        ...data
      }
    }));

    // Show notification for important status changes
    if (data.status === 'running') {
      showSuccess('VM Status', `VM ${data.vmName || data.vmId} is now running`);
    } else if (data.status === 'stopped') {
      showSuccess('VM Status', `VM ${data.vmName || data.vmId} has been stopped`);
    } else if (data.status === 'error') {
      showError('VM Status', `VM ${data.vmName || data.vmId} encountered an error: ${data.message || 'Unknown error'}`);
    }
  }, [showSuccess, showError]);

  // Handle monitoring data updates
  const handleMonitoringUpdate = useCallback((data) => {
    if (!data || !data.vmId || !data.data) return;

    console.log('Monitoring update received for VM:', data.vmId);

    setMonitoringUpdates(prev => ({
      ...prev,
      [data.vmId]: {
        timestamp: new Date(),
        data: data.data
      }
    }));
  }, []);

  // Set up event listeners when authenticated
  useEffect(() => {
    if (isAuthenticated && sse.connected) {
      // Register event handlers
      sse.addEventListener('vm_status_update', handleVmStatusUpdate);
      sse.addEventListener('monitoring_update', handleMonitoringUpdate);

      // Clean up on unmount
      return () => {
        sse.removeEventListener('vm_status_update');
        sse.removeEventListener('monitoring_update');
      };
    }
  }, [isAuthenticated, sse.connected, handleVmStatusUpdate, handleMonitoringUpdate]);

  // Reconnect when authentication state changes
  // Use a ref to prevent infinite loop
  const sseRef = React.useRef(sse);

  useEffect(() => {
    if (isAuthenticated) {
      sseRef.current.connect();
    } else {
      sseRef.current.disconnect();
    }
  }, [isAuthenticated]);

  // Context value
  const contextValue = {
    connected: sse.connected,
    error: sse.error,
    vmUpdates,
    monitoringUpdates,
    getLatestVmUpdate: (vmId) => vmUpdates[vmId] || null,
    getLatestMonitoringUpdate: (vmId) => monitoringUpdates[vmId] || null,
    clearVmUpdate: (vmId) => {
      setVmUpdates(prev => {
        const { [vmId]: _, ...rest } = prev;
        return rest;
      });
    },
    clearMonitoringUpdate: (vmId) => {
      setMonitoringUpdates(prev => {
        const { [vmId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  return (
    <SSEContext.Provider value={contextValue}>
      {children}
    </SSEContext.Provider>
  );
};

/**
 * Hook to use the SSE context
 */
export const useSSEContext = () => {
  const context = useContext(SSEContext);
  if (!context) {
    throw new Error('useSSEContext must be used within an SSEProvider');
  }
  return context;
};

export default SSEContext;
