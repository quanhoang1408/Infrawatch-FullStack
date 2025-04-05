import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs } from '../../components/common/Tabs';
import { Spinner } from '../../components/common/Spinner';
import { ErrorState } from '../../components/common/ErrorState';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { VMDetailHeader } from '../../components/vm/VMDetailHeader';
import { VMConfirmationModal } from '../../components/vm/VMConfirmationModal';
import { useVM } from '../../hooks/useVM';
import { useVMActions } from '../../hooks/useVMActions';
import { useNotification } from '../../hooks/useNotification';

// Tab components
import InfoTab from './InfoTab';
import MonitoringTab from './MonitoringTab';
import LogsTab from './LogsTab';
import NetworkTab from './NetworkTab';
import StorageTab from './StorageTab';
import SecurityTab from './SecurityTab';

import './VMDetail.scss';

const VMDetail = () => {
  const { vmId } = useParams();
  const navigate = useNavigate();
  const { getVMDetail, loading, error } = useVM();
  const { startVM, stopVM, restartVM } = useVMActions();
  const { showNotification } = useNotification();
  
  const [vm, setVM] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState('');
  
  useEffect(() => {
    const fetchVM = async () => {
      try {
        const vmData = await getVMDetail(vmId);
        setVM(vmData);
      } catch (error) {
        console.error('Error fetching VM details:', error);
      }
    };
    
    fetchVM();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchVM, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [vmId, getVMDetail]);
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  const handleActionClick = (action) => {
    setActionType(action);
    setShowConfirmModal(true);
  };
  
  const handleActionConfirm = async () => {
    try {
      let result;
      
      switch (actionType) {
        case 'start':
          result = await startVM(vmId);
          showNotification({
            type: 'success',
            message: 'Virtual machine started successfully'
          });
          break;
        case 'stop':
          result = await stopVM(vmId);
          showNotification({
            type: 'success',
            message: 'Virtual machine stopped successfully'
          });
          break;
        case 'restart':
          result = await restartVM(vmId);
          showNotification({
            type: 'success',
            message: 'Virtual machine restarted successfully'
          });
          break;
        default:
          break;
      }
      
      // Update VM with new status
      if (result) {
        setVM(prev => ({ ...prev, status: result.status }));
      }
    } catch (error) {
      showNotification({
        type: 'error',
        message: `Failed to ${actionType} virtual machine: ${error.message}`
      });
    } finally {
      setShowConfirmModal(false);
    }
  };
  
  const getActionMessage = () => {
    switch (actionType) {
      case 'start':
        return 'Are you sure you want to start this virtual machine?';
      case 'stop':
        return 'Are you sure you want to stop this virtual machine? Any unsaved data may be lost.';
      case 'restart':
        return 'Are you sure you want to restart this virtual machine? Any unsaved data may be lost.';
      default:
        return '';
    }
  };
  
  const getTabContent = () => {
    if (!vm) return null;
    
    switch (activeTab) {
      case 'info':
        return <InfoTab vm={vm} onAction={handleActionClick} />;
      case 'monitoring':
        return <MonitoringTab vmId={vmId} />;
      case 'logs':
        return <LogsTab vmId={vmId} />;
      case 'network':
        return <NetworkTab vm={vm} />;
      case 'storage':
        return <StorageTab vm={vm} />;
      case 'security':
        return <SecurityTab vm={vm} />;
      default:
        return null;
    }
  };
  
  if (loading && !vm) {
    return (
      <div className="vm-detail-loading">
        <Spinner />
        <p>Loading virtual machine details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <ErrorState 
        title="Failed to load virtual machine"
        message={error.message}
        action={
          <Button onClick={() => navigate('/vm-list')}>
            Back to VM List
          </Button>
        }
      />
    );
  }
  
  if (!vm) {
    return (
      <ErrorState 
        title="Virtual machine not found"
        message="The requested virtual machine could not be found."
        action={
          <Button onClick={() => navigate('/vm-list')}>
            Back to VM List
          </Button>
        }
      />
    );
  }
  
  return (
    <div className="vm-detail-container">
      <VMDetailHeader 
        vm={vm} 
        onAction={handleActionClick}
      />
      
      <Tabs
        activeTab={activeTab}
        onChange={handleTabChange}
        tabs={[
          { id: 'info', label: 'Information' },
          { id: 'monitoring', label: 'Monitoring' },
          { id: 'logs', label: 'Logs' },
          { id: 'network', label: 'Network' },
          { id: 'storage', label: 'Storage' },
          { id: 'security', label: 'Security' }
        ]}
      />
      
      <div className="vm-detail-content">
        {getTabContent()}
      </div>
      
      {showConfirmModal && (
        <VMConfirmationModal
          title={`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Virtual Machine`}
          message={getActionMessage()}
          onConfirm={handleActionConfirm}
          onCancel={() => setShowConfirmModal(false)}
          confirmLabel={actionType.charAt(0).toUpperCase() + actionType.slice(1)}
        />
      )}
    </div>
  );
};

export default VMDetail;