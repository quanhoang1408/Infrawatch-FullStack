// VMTable.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Table, StatusBadge, Tooltip } from '../common';
import VMActions from './VMActions';
import VMStatusBadge from './VMStatusBadge';
import VMTypeTag from './VMTypeTag';
import ProviderIcon from './ProviderIcon';
import SparklineChart from '../charts/SparklineChart';
import './VMTable.scss';

/**
 * Table component for displaying virtual machines
 * @param {array} vms - List of VM objects
 * @param {boolean} loading - Loading state
 * @param {function} onVMClick - Click handler for VM row
 * @param {function} onActionClick - Click handler for VM actions
 * @param {object} resourceData - Resource usage data for VMs
 */
const VMTable = ({
  vms = [],
  loading = false,
  onVMClick,
  onActionClick,
  resourceData = {},
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-vm-table';
  const classes = [baseClass, className].filter(Boolean).join(' ');
  
  // Column definitions for the table
  const columns = useMemo(() => [
    {
      title: 'Name',
      dataKey: 'name',
      render: (name, record) => (
        <div className={`${baseClass}__name-cell`}>
          <ProviderIcon provider={record.provider} />
          <span className={`${baseClass}__vm-name`}>{name}</span>
        </div>
      )
    },
    {
      title: 'Status',
      dataKey: 'status',
      width: 120,
      render: (status) => <VMStatusBadge status={status} />
    },
    {
      title: 'Type',
      dataKey: 'type',
      width: 120,
      render: (type) => <VMTypeTag type={type} />
    },
    {
      title: 'IP Address',
      dataKey: 'ipAddress',
      width: 150
    },
    {
      title: 'CPU',
      dataKey: 'id',
      width: 100,
      render: (id) => {
        const cpuData = resourceData[id]?.cpu || [];
        return cpuData.length > 0 ? (
          <div className={`${baseClass}__resource-cell`}>
            <SparklineChart
              data={cpuData}
              dataKey="value"
              color="#1f77b4"
              height={30}
              width={60}
              showLastValue
            />
            <span className={`${baseClass}__resource-value`}>
              {cpuData[cpuData.length - 1]?.value || 0}%
            </span>
          </div>
        ) : (
          <span className={`${baseClass}__resource-na`}>N/A</span>
        );
      }
    },
    {
      title: 'Memory',
      dataKey: 'id',
      width: 100,
      render: (id) => {
        const memData = resourceData[id]?.memory || [];
        return memData.length > 0 ? (
          <div className={`${baseClass}__resource-cell`}>
            <SparklineChart
              data={memData}
              dataKey="value"
              color="#ff7f0e"
              height={30}
              width={60}
              showLastValue
            />
            <span className={`${baseClass}__resource-value`}>
              {memData[memData.length - 1]?.value || 0}%
            </span>
          </div>
        ) : (
          <span className={`${baseClass}__resource-na`}>N/A</span>
        );
      }
    },
    {
      title: 'Created',
      dataKey: 'createdAt',
      width: 150,
      render: (createdAt) => {
        const date = new Date(createdAt);
        return date.toLocaleDateString();
      }
    },
    {
      title: 'Actions',
      dataKey: 'id',
      width: 100,
      align: 'center',
      render: (id, record) => (
        <VMActions 
          vm={record}
          onActionClick={(action) => onActionClick?.(action, record)}
        />
      )
    }
  ], [resourceData, onActionClick]);
  
  const handleRowClick = (record, index) => {
    onVMClick?.(record);
  };
  
  return (
    <div className={classes} {...rest}>
      <Table
        columns={columns}
        dataSource={vms}
        loading={loading}
        rowKey="id"
        onRowClick={handleRowClick}
        emptyText="No virtual machines found"
        hover
        striped
      />
    </div>
  );
};

VMTable.propTypes = {
  vms: PropTypes.array,
  loading: PropTypes.bool,
  onVMClick: PropTypes.func,
  onActionClick: PropTypes.func,
  resourceData: PropTypes.object,
  className: PropTypes.string
};

export default VMTable;