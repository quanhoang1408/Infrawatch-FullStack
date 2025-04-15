import React from 'react';
import { Link } from 'react-router-dom';
import VMStatusBadge from './VMStatusBadge';
import AgentStatusBadge from './AgentStatusBadge';
import ProviderIcon from './ProviderIcon';
import VMActions from './VMActions';
import './VMTable.scss';

const VMTable = ({ vms, onVMAction }) => {
  // Get VM ID helper function - handles both id and _id fields
  const getVmId = (vm) => vm.id || vm._id;
  
  // Handle VM action completion
  const handleActionComplete = (action, vmId, response) => {
    if (onVMAction) {
      onVMAction(vmId, action, response);
    }
  };

  return (
    <div className="vm-table">
      <table className="vm-table__table">
        <thead className="vm-table__header">
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Provider</th>
            <th>IP Address</th>
            <th>Agent</th>
            <th>Last Sync</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody className="vm-table__body">
          {vms.map((vm) => {
            // Get the VM id safely
            const vmId = getVmId(vm);
            
            return (
              <tr key={vmId || `vm-${vm.instanceId}`} className="vm-table__row">
                <td className="vm-table__cell vm-table__cell--name">
                  {vmId ? (
                    <Link to={`/vm/${vmId}`} className="vm-table__vm-name">
                      {vm.name || vm.instanceId}
                    </Link>
                  ) : (
                    <span className="vm-table__vm-name">{vm.name || vm.instanceId}</span>
                  )}
                  <div className="vm-table__vm-id">{vm.instanceId}</div>
                </td>
                <td className="vm-table__cell">
                  <VMStatusBadge status={vm.state} />
                </td>
                <td className="vm-table__cell">
                  <div className="vm-table__provider">
                    <ProviderIcon provider={vm.provider} size="sm" />
                    <span className="vm-table__provider-name">{vm.provider}</span>
                  </div>
                </td>
                <td className="vm-table__cell">
                  {vm.publicIpAddress ? (
                    <div>
                      <div>{vm.publicIpAddress}</div>
                      <div className="vm-table__secondary-text">{vm.ipAddress}</div>
                    </div>
                  ) : (
                    <div>{vm.ipAddress || '-'}</div>
                  )}
                </td>
                <td className="vm-table__cell">
                  <AgentStatusBadge connected={vm.agentConnected} />
                </td>
                <td className="vm-table__cell">
                  {vm.lastSyncAt ? (
                    <div title={new Date(vm.lastSyncAt).toLocaleString()}>
                      {formatTimeAgo(vm.lastSyncAt)}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="vm-table__cell vm-table__cell--actions">
                  <VMActions vm={vm} onActionComplete={handleActionComplete} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// Helper function to format time ago
const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  
  // Convert to seconds
  const diffSec = Math.round(diffMs / 1000);
  
  if (diffSec < 60) {
    return 'Just now';
  }
  
  // Convert to minutes
  const diffMin = Math.round(diffSec / 60);
  
  if (diffMin < 60) {
    return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // Convert to hours
  const diffHours = Math.round(diffMin / 60);
  
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Convert to days
  const diffDays = Math.round(diffHours / 24);
  
  if (diffDays < 30) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  }
  
  // Just return the date
  return past.toLocaleDateString();
};

export default VMTable;