// VMSelector.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Select from './Select';
import ProviderIcon from '../vm/ProviderIcon';

/**
 * Component for selecting a VM from a list
 * @param {string} value - Selected VM ID
 * @param {function} onChange - Change handler
 * @param {array} vms - List of VMs
 * @param {boolean} disabled - Whether the selector is disabled
 * @param {boolean} loading - Whether the selector is loading
 * @param {function} onFetchVMs - Handler for fetching VMs
 */
const VMSelector = ({
  value,
  onChange,
  vms = [],
  disabled = false,
  loading = false,
  onFetchVMs,
  providerFilter,
  statusFilter,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-vm-selector';
  const classes = [baseClass, className].filter(Boolean).join(' ');
  
  // Fetch VMs on mount
  useEffect(() => {
    if (onFetchVMs) {
      onFetchVMs();
    }
  }, []);
  
  // Filter VMs by provider and status
  const filteredVMs = vms.filter(vm => {
    if (providerFilter && vm.provider !== providerFilter) {
      return false;
    }
    
    if (statusFilter && vm.status !== statusFilter) {
      return false;
    }
    
    return true;
  });
  
  // Format VM options
  const vmOptions = filteredVMs.map(vm => ({
    value: vm.id,
    label: vm.name,
    vm: vm
  }));
  
  // Custom option renderer
  const formatOptionLabel = ({ label, vm }) => (
    <div className={`${baseClass}__option-label`}>
      <ProviderIcon provider={vm.provider} />
      <span className={`${baseClass}__vm-name`}>{label}</span>
      <span className={`${baseClass}__vm-info`}>
        {vm.ipAddress && <span className={`${baseClass}__vm-ip`}>{vm.ipAddress}</span>}
        <span className={`${baseClass}__vm-status`}>{vm.status}</span>
      </span>
    </div>
  );

  return (
    <div className={classes} {...rest}>
      <Select
        value={value}
        onChange={onChange}
        options={vmOptions}
        placeholder="Select a VM..."
        disabled={disabled}
        loading={loading}
        searchable
        clearable
        formatOptionLabel={formatOptionLabel}
      />
    </div>
  );
};

VMSelector.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  vms: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      provider: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      ipAddress: PropTypes.string
    })
  ),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  onFetchVMs: PropTypes.func,
  providerFilter: PropTypes.string,
  statusFilter: PropTypes.string,
  className: PropTypes.string
};

export default VMSelector;