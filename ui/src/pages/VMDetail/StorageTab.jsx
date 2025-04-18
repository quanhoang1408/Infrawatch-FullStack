import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import ErrorState from '../../components/common/ErrorState';
import Table from '../../components/common/Table';
import StatusBadge from '../../components/common/StatusBadge';
import { useVM } from '../../hooks/useVM';
import useNotification from '../../hooks/useNotification';
import { formatBytes } from '../../utils/format.utils';
import PieChart from '../../components/charts/PieChart';

// Temporary Modal component
const Modal = ({ title, onClose, size = 'medium', children }) => (
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
      width: size === 'small' ? '400px' : size === 'large' ? '800px' : '600px',
      maxWidth: '90%',
      maxHeight: '90vh',
      overflow: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
      </div>
      {children}
    </div>
  </div>
);

const StorageTab = ({ vm }) => {
  const { getVMStorageDetails, updateVMStorage, loading, error } = useVM();
  const { showNotification } = useNotification();

  const [storageDetails, setStorageDetails] = useState(null);
  const [disks, setDisks] = useState([]);
  const [volumeGroups, setVolumeGroups] = useState([]);
  const [showAddDiskModal, setShowAddDiskModal] = useState(false);
  const [showResizeDiskModal, setShowResizeDiskModal] = useState(false);
  const [selectedDisk, setSelectedDisk] = useState(null);
  const [newDiskSize, setNewDiskSize] = useState(10);
  const [diskType, setDiskType] = useState('standard');

  useEffect(() => {
    const fetchStorageDetails = async () => {
      try {
        const details = await getVMStorageDetails(vm.id);
        setStorageDetails(details);
        setDisks(details.disks || []);
        setVolumeGroups(details.volumeGroups || []);
      } catch (err) {
        console.error('Error fetching storage details:', err);
      }
    };

    fetchStorageDetails();
  }, [vm.id, getVMStorageDetails]);

  const handleAddDisk = async () => {
    try {
      const result = await updateVMStorage(vm.id, {
        action: 'addDisk',
        size: newDiskSize,
        type: diskType
      });

      if (result.success) {
        // Update the local state with the new disk
        setDisks(prevDisks => [...prevDisks, result.disk]);

        showNotification({
          type: 'success',
          message: 'New disk added successfully'
        });

        setShowAddDiskModal(false);
      }
    } catch (err) {
      console.error('Error adding disk:', err);
      showNotification({
        type: 'error',
        message: `Failed to add disk: ${err.message}`
      });
    }
  };

  const handleResizeDisk = async () => {
    if (!selectedDisk) return;

    try {
      const result = await updateVMStorage(vm.id, {
        action: 'resizeDisk',
        diskId: selectedDisk.id,
        newSize: newDiskSize
      });

      if (result.success) {
        // Update the local state
        setDisks(prevDisks =>
          prevDisks.map(disk =>
            disk.id === selectedDisk.id
              ? { ...disk, size: newDiskSize * 1024 * 1024 * 1024 }
              : disk
          )
        );

        showNotification({
          type: 'success',
          message: 'Disk resized successfully'
        });

        setShowResizeDiskModal(false);
        setSelectedDisk(null);
      }
    } catch (err) {
      console.error('Error resizing disk:', err);
      showNotification({
        type: 'error',
        message: `Failed to resize disk: ${err.message}`
      });
    }
  };

  const handleDetachDisk = async (diskId) => {
    try {
      const result = await updateVMStorage(vm.id, {
        action: 'detachDisk',
        diskId: diskId
      });

      if (result.success) {
        // Update the local state
        setDisks(prevDisks => prevDisks.filter(disk => disk.id !== diskId));

        showNotification({
          type: 'success',
          message: 'Disk detached successfully'
        });
      }
    } catch (err) {
      console.error('Error detaching disk:', err);
      showNotification({
        type: 'error',
        message: `Failed to detach disk: ${err.message}`
      });
    }
  };

  const openResizeDiskModal = (disk) => {
    setSelectedDisk(disk);
    setNewDiskSize(Math.floor(disk.size / (1024 * 1024 * 1024))); // Convert bytes to GB
    setShowResizeDiskModal(true);
  };

  // Prepare data for storage usage pie chart
  const preparePieChartData = () => {
    if (!disks || disks.length === 0) {
      return [{ name: 'No Data', value: 100 }];
    }

    return disks.map(disk => ({
      name: disk.name,
      value: disk.size,
      fill: disk.type === 'ssd' ? '#4CAF50' : '#2196F3'
    }));
  };

  if (loading && !storageDetails) {
    return (
      <div className="storage-loading">
        <Spinner />
        <p>Loading storage details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load storage details"
        message={error.message}
      />
    );
  }

  if (!storageDetails) {
    return (
      <ErrorState
        title="No storage details available"
        message="Unable to retrieve storage information for this virtual machine."
      />
    );
  }

  return (
    <div className="storage-tab">
      <div className="storage-overview">
        <Card title="Storage Overview">
          <div className="storage-summary">
            <div className="storage-chart">
              <PieChart
                data={preparePieChartData()}
                dataKey="value"
                nameKey="name"
                width={200}
                height={200}
              />
            </div>
            <div className="storage-stats">
              <div className="stat-item">
                <div className="stat-label">Total Storage</div>
                <div className="stat-value">
                  {formatBytes(disks.reduce((total, disk) => total + disk.size, 0))}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Disk Count</div>
                <div className="stat-value">{disks.length}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Primary Disk</div>
                <div className="stat-value">
                  {disks.find(disk => disk.isPrimary)?.name || 'N/A'}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Storage Performance</div>
                <div className="stat-value">
                  {disks.some(disk => disk.type === 'ssd') ? 'SSD Available' : 'Standard'}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card
        title="Attached Disks"
        actions={
          <Button
            variant="primary"
            size="small"
            icon="plus"
            onClick={() => setShowAddDiskModal(true)}
          >
            Add Disk
          </Button>
        }
      >
        <Table
          columns={[
            { key: 'name', header: 'Disk Name' },
            { key: 'devicePath', header: 'Device Path' },
            { key: 'size', header: 'Size', render: (row) => formatBytes(row.size) },
            { key: 'type', header: 'Type', render: (row) => (
              <StatusBadge
                status={row.type === 'ssd' ? 'success' : 'info'}
                text={row.type === 'ssd' ? 'SSD' : 'Standard'}
              />
            )},
            { key: 'status', header: 'Status', render: (row) => (
              <StatusBadge
                status={row.status === 'attached' ? 'success' : 'warning'}
                text={row.status}
              />
            )},
            { key: 'actions', header: 'Actions', render: (row) => (
              <div className="table-actions">
                <Button
                  variant="icon"
                  icon="expand"
                  onClick={() => openResizeDiskModal(row)}
                  title="Resize disk"
                  disabled={row.isPrimary}
                />
                <Button
                  variant="icon"
                  icon="unlink"
                  onClick={() => handleDetachDisk(row.id)}
                  title="Detach disk"
                  disabled={row.isPrimary}
                />
              </div>
            )}
          ]}
          data={disks}
          emptyMessage="No disks attached to this virtual machine"
        />
      </Card>

      {volumeGroups && volumeGroups.length > 0 && (
        <Card title="Volume Groups">
          <Table
            columns={[
              { key: 'name', header: 'Group Name' },
              { key: 'type', header: 'Type' },
              { key: 'disks', header: 'Disks', render: (row) => row.disks.join(', ') },
              { key: 'totalSize', header: 'Total Size', render: (row) => formatBytes(row.totalSize) },
              { key: 'usedSize', header: 'Used', render: (row) => formatBytes(row.usedSize) }
            ]}
            data={volumeGroups}
            emptyMessage="No volume groups configured"
          />
        </Card>
      )}

      {/* Add Disk Modal */}
      {showAddDiskModal && (
        <Modal
          title="Add New Disk"
          onClose={() => setShowAddDiskModal(false)}
          size="small"
        >
          <div className="form-group">
            <label>Disk Size (GB)</label>
            <input
              type="number"
              value={newDiskSize}
              min="1"
              max="16384"
              onChange={(e) => setNewDiskSize(parseInt(e.target.value))}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Disk Type</label>
            <select
              value={diskType}
              onChange={(e) => setDiskType(e.target.value)}
              className="form-control"
            >
              <option value="standard">Standard</option>
              <option value="ssd">SSD</option>
            </select>
          </div>

          <div className="modal-actions">
            <Button
              variant="secondary"
              onClick={() => setShowAddDiskModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAddDisk}
            >
              Add Disk
            </Button>
          </div>
        </Modal>
      )}

      {/* Resize Disk Modal */}
      {showResizeDiskModal && selectedDisk && (
        <Modal
          title={`Resize Disk: ${selectedDisk.name}`}
          onClose={() => {
            setShowResizeDiskModal(false);
            setSelectedDisk(null);
          }}
          size="small"
        >
          <div className="form-group">
            <label>Current Size</label>
            <div>{formatBytes(selectedDisk.size)}</div>
          </div>

          <div className="form-group">
            <label>New Size (GB)</label>
            <input
              type="number"
              value={newDiskSize}
              min={Math.ceil(selectedDisk.size / (1024 * 1024 * 1024))}
              max="16384"
              onChange={(e) => setNewDiskSize(parseInt(e.target.value))}
              className="form-control"
            />
            <small className="form-text">
              Note: Disks can only be increased in size, not decreased
            </small>
          </div>

          <div className="modal-actions">
            <Button
              variant="secondary"
              onClick={() => {
                setShowResizeDiskModal(false);
                setSelectedDisk(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleResizeDisk}
              disabled={newDiskSize <= Math.floor(selectedDisk.size / (1024 * 1024 * 1024))}
            >
              Resize Disk
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StorageTab;