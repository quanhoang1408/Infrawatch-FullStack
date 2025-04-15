import React, { useState } from 'react';
import vmService from '../../services/vm.service';
import { toast } from '../../components/feedback/ToastContainer';
import './VMActions.scss';

const VMActions = ({ vm, onActionComplete }) => {
  const [actionInProgress, setActionInProgress] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);

  // Helper to determine if an action is allowed based on VM state
  const canPerformAction = (action) => {
    if (actionInProgress) return false;

    switch (action) {
      case 'start':
        return vm.state === 'stopped';
      case 'stop':
        return vm.state === 'running';
      case 'reboot':
        return vm.state === 'running';
      default:
        return false;
    }
  };

  // Execute VM action (start, stop, reboot)
  const handleAction = async (action) => {
    if (!canPerformAction(action)) return;
    
    // Validate VM ID exists
    if (!vm.id && !vm._id) {
      console.error('VM ID is missing or undefined:', vm);
      toast.error(`Cannot ${action} VM: Missing VM identifier`);
      return;
    }
    
    // Use vm._id if vm.id is not available (MongoDB often uses _id)
    const vmId = vm.id || vm._id;

    setActionInProgress(true);
    setCurrentAction(action);

    try {
      let response;
      switch (action) {
        case 'start':
          response = await vmService.startVM(vmId);
          toast.success(`Start request sent for VM ${vm.name || vm.instanceId}`);
          break;
        case 'stop':
          response = await vmService.stopVM(vmId);
          toast.success(`Stop request sent for VM ${vm.name || vm.instanceId}`);
          break;
        case 'reboot':
          response = await vmService.rebootVM(vmId);
          toast.success(`Reboot request sent for VM ${vm.name || vm.instanceId}`);
          break;
        default:
          break;
      }

      // Notify parent about action completion, can be used to refresh data
      if (onActionComplete) {
        onActionComplete(action, vmId, response);
      }
    } catch (error) {
      console.error(`Error performing ${action} action:`, error);
      const errorMsg = error.response?.data?.message || `Failed to ${action} VM`;
      toast.error(errorMsg);
    } finally {
      setActionInProgress(false);
      setCurrentAction(null);
    }
  };

  // Render action buttons based on VM state
  const renderActionButtons = () => {
    const buttons = [];

    // Start button
    if (canPerformAction('start')) {
      buttons.push(
        <button
          key="start"
          className="vm-actions__btn vm-actions__btn--success"
          onClick={() => handleAction('start')}
          disabled={actionInProgress}
          title="Start VM"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
          </svg>
          {(actionInProgress && currentAction === 'start') && <span className="vm-actions__spinner"></span>}
        </button>
      );
    }

    // Stop button
    if (canPerformAction('stop')) {
      buttons.push(
        <button
          key="stop"
          className="vm-actions__btn vm-actions__btn--warning"
          onClick={() => handleAction('stop')}
          disabled={actionInProgress}
          title="Stop VM"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 6H16V18H8V6Z" fill="currentColor" />
          </svg>
          {(actionInProgress && currentAction === 'stop') && <span className="vm-actions__spinner"></span>}
        </button>
      );
    }

    // Reboot button
    if (canPerformAction('reboot')) {
      buttons.push(
        <button
          key="reboot"
          className="vm-actions__btn vm-actions__btn--info"
          onClick={() => handleAction('reboot')}
          disabled={actionInProgress}
          title="Reboot VM"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12C21 16.9706 16.9706 21 12 21C7.0294 21 3 16.9706 3 12C3 7.0294 7.0294 3 12 3V7M12 7L16 3M12 7L8 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {(actionInProgress && currentAction === 'reboot') && <span className="vm-actions__spinner"></span>}
        </button>
      );
    }

    // View details button (always available)
    buttons.push(
      <button
        key="view"
        className="vm-actions__btn"
        onClick={() => {
          const vmId = vm.id || vm._id;
          if (!vmId) {
            console.error('VM ID is missing for view action:', vm);
            toast.error('Cannot view VM details: Missing VM identifier');
            return;
          }
          onActionComplete && onActionComplete('view', vmId);
        }}
        disabled={actionInProgress}
        title="View Details"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="currentColor" />
        </svg>
      </button>
    );

    // Return all buttons wrapped in a container
    return (
      <div className="vm-actions">
        {buttons}
      </div>
    );
  };

  return renderActionButtons();
};

export default VMActions;