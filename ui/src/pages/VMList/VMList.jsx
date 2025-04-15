import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import vmService from '../../services/vm.service';
import { VMTable } from '../../components/vm';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { toast } from '../../components/feedback/ToastContainer';
import './VMList.scss';

const VMList = () => {
  const [vms, setVms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  
  // Fetch VMs function
  const fetchVMs = useCallback(async (shouldSync = false) => {
    try {
      setError(null);
      if (!refreshing) setLoading(true);
      
      const data = await vmService.getVMs({
        sync: shouldSync,
      });
      
      // Log data structure in development
      if (process.env.NODE_ENV === 'development') {
        console.log('VM data structure:', data.length > 0 ? data[0] : 'No VMs found');
      }
      
      setVms(data);
    } catch (err) {
      console.error('Error fetching VMs:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch VMs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);
  
  // Initial fetch on component mount
  useEffect(() => {
    fetchVMs();
    
    // Set up auto-refresh every 30 seconds to update agent status
    const refreshInterval = setInterval(() => {
      fetchVMs();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [fetchVMs]);
  
  // Function to refresh VM list with sync option
  const refreshVMs = async () => {
    try {
      setRefreshing(true);
      await fetchVMs(true); // Pass true to force sync with providers
      toast.success('VM list refreshed successfully');
    } catch (err) {
      console.error('Error refreshing VMs:', err);
      toast.error('Failed to refresh VM list');
      setRefreshing(false);
    }
  };
  
  // Handle VM actions (view, start, stop, reboot)
  const handleVMAction = (vmId, action, response) => {
    if (!vmId) {
      console.error('VM ID is undefined for action:', action);
      toast.error('Cannot perform action: VM ID is missing');
      return;
    }
    
    // Navigate to VM detail for view action
    if (action === 'view') {
      navigate(`/vm/${vmId}`);
      return;
    }
    
    // For other actions (start, stop, reboot), refresh the VMs list after a delay
    // to allow time for the action to take effect on the backend
    if (['start', 'stop', 'reboot'].includes(action)) {
      // Show info toast about VM state changes not being immediate
      toast.info('VM state will update after the operation completes. Refreshing list in 5 seconds.');
      
      // Schedule a refresh after a delay
      setTimeout(() => {
        refreshVMs();
      }, 5000);
    }
  };
  
  // Render content based on state
  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <div className="vm-list__loading">
          <Spinner size="large" />
        </div>
      );
    }
    
    if (error) {
      return (
        <ErrorState 
          title="Failed to load virtual machines"
          message="There was an error fetching the virtual machines. Please try again."
          error={error}
          retryAction={fetchVMs}
        />
      );
    }
    
    if (vms.length === 0) {
      return (
        <EmptyState 
          title="No virtual machines found"
          message="No virtual machines have been configured or synced yet."
          actionButton={
            <button onClick={refreshVMs} className="btn btn--primary" disabled={refreshing}>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          }
        />
      );
    }
    
    return (
      <VMTable 
        vms={vms} 
        onVMAction={handleVMAction}
        loading={refreshing}
        error={null}
        onRefresh={refreshVMs}
      />
    );
  };
  
  return (
    <div className="vm-list">
      <div className="vm-list__header">
        <h1 className="vm-list__title">Virtual Machines</h1>
        <div className="vm-list__actions">
          <button 
            onClick={refreshVMs} 
            className="btn btn--outline-primary"
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      <div className="vm-list__content">
        {renderContent()}
      </div>
    </div>
  );
};

export default VMList;