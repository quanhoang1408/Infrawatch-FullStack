import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Spinner from '../../components/common/Spinner';
import ErrorState from '../../components/common/ErrorState';
import Button from '../../components/common/Button';
import { useVM } from '../../hooks/useVM';
import { useVMActions } from '../../hooks/useVMActions';
import useNotification from '../../hooks/useNotification';

// Tab components
import InfoTab from './InfoTab';
import MonitoringTab from './MonitoringTab';
import LogsTab from './LogsTab';
import NetworkTab from './NetworkTab';
import StorageTab from './StorageTab';
import SecurityTab from './SecurityTab';
import './VMDetail.scss';

// Temporary Tabs component
const Tabs = ({ activeTab, onChange, tabs }) => (
  <div style={{
    display: 'flex',
    borderBottom: '1px solid #ddd',
    marginBottom: '20px'
  }}>
    {tabs.map(tab => (
      <div
        key={tab.id}
        onClick={() => onChange(tab.id)}
        style={{
          padding: '10px 16px',
          cursor: 'pointer',
          fontWeight: activeTab === tab.id ? 'bold' : 'normal',
          borderBottom: activeTab === tab.id ? '2px solid #2196F3' : 'none',
          color: activeTab === tab.id ? '#2196F3' : '#333'
        }}
      >
        {tab.label}
      </div>
    ))}
  </div>
);

// Temporary VMDetailHeader component
const VMDetailHeader = ({ vm, onAction, onTerminal }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px'
  }}>
    <div>
      <h1 style={{ margin: '0 0 8px 0' }}>{vm.name}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          display: 'inline-block',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: vm.status === 'running' ? '#4CAF50' : vm.status === 'stopped' ? '#F44336' : '#FF9800'
        }}></span>
        <span>{vm.status}</span>
      </div>
    </div>
    <div style={{ display: 'flex', gap: '8px' }}>
      {vm.status === 'stopped' && (
        <Button
          variant="success"
          onClick={() => onAction('start')}
        >
          Start
        </Button>
      )}
      {vm.status === 'running' && (
        <>
          <Button
            variant="primary"
            onClick={onTerminal}
          >
            Terminal SSH
          </Button>
          <Button
            variant="warning"
            onClick={() => onAction('restart')}
          >
            Restart
          </Button>
          <Button
            variant="danger"
            onClick={() => onAction('stop')}
          >
            Stop
          </Button>
        </>
      )}
    </div>
  </div>
);

// Temporary VMConfirmationModal component
const VMConfirmationModal = ({ title, message, onConfirm, onCancel, confirmLabel }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  }}>
    <div style={{
      backgroundColor: 'white',
      borderRadius: '4px',
      padding: '20px',
      width: '400px',
      maxWidth: '90%'
    }}>
      <h2 style={{ margin: '0 0 16px 0' }}>{title}</h2>
      <p style={{ margin: '0 0 20px 0' }}>{message}</p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <Button
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  </div>
);

const VMDetail = () => {
  const { vmId } = useParams();
  const navigate = useNavigate();
  const { getVMDetail, loading, error } = useVM();
  const { startVM, stopVM, restartVM } = useVMActions();
  const { showSuccess, showError } = useNotification();

  console.log('VMDetail component - vmId:', vmId);

  const [vm, setVM] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    // Kiểm tra và log giá trị của vmId từ URL
    console.log('VMDetail - vmId from URL params:', vmId);
    console.log('VMDetail - vmId type:', typeof vmId);

    // Nếu vmId là undefined hoặc null, thử lấy từ URL trực tiếp
    if (!vmId) {
      const pathParts = window.location.pathname.split('/');
      const possibleVmId = pathParts[pathParts.length - 1];
      console.log('VMDetail - Trying to extract vmId from URL:', possibleVmId);

      // Nếu có thể lấy được vmId từ URL, sử dụng nó
      if (possibleVmId && possibleVmId !== 'undefined') {
        console.log('VMDetail - Using vmId from URL:', possibleVmId);
        // Không thể set vmId trực tiếp vì nó đến từ useParams, nhưng chúng ta có thể sử dụng nó
        const fetchVMWithId = async (id) => {
          try {
            console.log('VMDetail - Fetching VM with ID:', id);
            const vmData = await getVMDetail(id);
            console.log('VMDetail - fetchVM result:', vmData);
            setVM(vmData);
          } catch (error) {
            console.error('Error fetching VM details:', error);
          }
        };

        fetchVMWithId(possibleVmId);
        return;
      }
    }

    const fetchVM = async () => {
      if (!vmId) {
        console.error('vmId is null or undefined in fetchVM');
        return;
      }

      console.log('VMDetail - fetchVM for vmId:', vmId);

      try {
        const vmData = await getVMDetail(vmId);
        console.log('VMDetail - fetchVM result:', vmData);
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

  const handleTerminal = () => {
    navigate(`/vms/${vmId}/terminal`);
  };

  const handleActionConfirm = async () => {
    try {
      let result;

      switch (actionType) {
        case 'start':
          result = await startVM(vmId);
          showSuccess('Virtual machine started successfully');
          break;
        case 'stop':
          result = await stopVM(vmId);
          showSuccess('Virtual machine stopped successfully');
          break;
        case 'restart':
          result = await restartVM(vmId);
          showSuccess('Virtual machine restarted successfully');
          break;
        default:
          break;
      }

      // Update VM with new status
      if (result) {
        setVM(prev => ({ ...prev, status: result.status }));
      }
    } catch (error) {
      showError(`Failed to ${actionType} virtual machine: ${error.message}`);
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
    if (!vm) {
      console.error('VM is null or undefined in getTabContent');
      return null;
    }

    console.log('VMDetail - getTabContent - vm:', vm);

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
        console.log('VMDetail - Rendering SecurityTab with vm:', vm);
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
        onTerminal={handleTerminal}
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