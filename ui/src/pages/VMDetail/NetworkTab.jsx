import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import ErrorState from '../../components/common/ErrorState';
import Table from '../../components/common/Table';
import StatusBadge from '../../components/common/StatusBadge';
import { useVM } from '../../hooks/useVM';
import useNotification from '../../hooks/useNotification';

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

const NetworkTab = ({ vm }) => {
  const { getVMNetworkDetails, updateVMNetwork, loading, error } = useVM();
  const { showNotification } = useNotification();

  const [networkDetails, setNetworkDetails] = useState(null);
  const [interfaces, setInterfaces] = useState([]);
  const [securityGroups, setSecurityGroups] = useState([]);
  const [isEditInterfaceModalOpen, setIsEditInterfaceModalOpen] = useState(false);
  const [isAddSecurityRuleModalOpen, setIsAddSecurityRuleModalOpen] = useState(false);
  const [selectedInterface, setSelectedInterface] = useState(null);
  const [selectedSecurityGroup, setSelectedSecurityGroup] = useState(null);

  useEffect(() => {
    const fetchNetworkDetails = async () => {
      try {
        const details = await getVMNetworkDetails(vm.id);
        setNetworkDetails(details);
        setInterfaces(details.interfaces || []);
        setSecurityGroups(details.securityGroups || []);
      } catch (err) {
        console.error('Error fetching network details:', err);
      }
    };

    fetchNetworkDetails();
  }, [vm.id, getVMNetworkDetails]);

  const handleEditInterface = (iface) => {
    setSelectedInterface(iface);
    setIsEditInterfaceModalOpen(true);
  };

  const handleEditSecurityGroup = (group) => {
    setSelectedSecurityGroup(group);
    setIsAddSecurityRuleModalOpen(true);
  };

  const handleInterfaceUpdate = async (updatedInterface) => {
    try {
      const result = await updateVMNetwork(vm.id, {
        action: 'updateInterface',
        interfaceId: updatedInterface.id,
        data: updatedInterface
      });

      if (result.success) {
        // Update the local state
        setInterfaces(prevInterfaces =>
          prevInterfaces.map(iface =>
            iface.id === updatedInterface.id ? updatedInterface : iface
          )
        );

        showNotification({
          type: 'success',
          message: 'Network interface updated successfully'
        });
      }
    } catch (err) {
      console.error('Error updating network interface:', err);
      showNotification({
        type: 'error',
        message: `Failed to update network interface: ${err.message}`
      });
    } finally {
      setIsEditInterfaceModalOpen(false);
      setSelectedInterface(null);
    }
  };

  const handleSecurityRuleAdd = async (rule) => {
    try {
      const result = await updateVMNetwork(vm.id, {
        action: 'addSecurityRule',
        securityGroupId: selectedSecurityGroup.id,
        rule: rule
      });

      if (result.success) {
        // Update the local state
        setSecurityGroups(prevGroups =>
          prevGroups.map(group => {
            if (group.id === selectedSecurityGroup.id) {
              return {
                ...group,
                rules: [...group.rules, result.rule]
              };
            }
            return group;
          })
        );

        showNotification({
          type: 'success',
          message: 'Security rule added successfully'
        });
      }
    } catch (err) {
      console.error('Error adding security rule:', err);
      showNotification({
        type: 'error',
        message: `Failed to add security rule: ${err.message}`
      });
    } finally {
      setIsAddSecurityRuleModalOpen(false);
      setSelectedSecurityGroup(null);
    }
  };

  const handleSecurityRuleDelete = async (groupId, ruleId) => {
    try {
      const result = await updateVMNetwork(vm.id, {
        action: 'removeSecurityRule',
        securityGroupId: groupId,
        ruleId: ruleId
      });

      if (result.success) {
        // Update the local state
        setSecurityGroups(prevGroups =>
          prevGroups.map(group => {
            if (group.id === groupId) {
              return {
                ...group,
                rules: group.rules.filter(rule => rule.id !== ruleId)
              };
            }
            return group;
          })
        );

        showNotification({
          type: 'success',
          message: 'Security rule removed successfully'
        });
      }
    } catch (err) {
      console.error('Error removing security rule:', err);
      showNotification({
        type: 'error',
        message: `Failed to remove security rule: ${err.message}`
      });
    }
  };

  if (loading && !networkDetails) {
    return (
      <div className="network-loading">
        <Spinner />
        <p>Loading network details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load network details"
        message={error.message}
      />
    );
  }

  if (!networkDetails) {
    return (
      <ErrorState
        title="No network details available"
        message="Unable to retrieve network information for this virtual machine."
      />
    );
  }

  return (
    <div className="network-tab">
      <Card title="Network Overview">
        <div className="info-grid">
          <div className="info-row">
            <div className="info-label">Primary IP</div>
            <div className="info-value">{vm.publicIp || 'N/A'}</div>
          </div>
          <div className="info-row">
            <div className="info-label">Private IP</div>
            <div className="info-value">{vm.privateIp || 'N/A'}</div>
          </div>
          <div className="info-row">
            <div className="info-label">DNS Name</div>
            <div className="info-value">{vm.dnsName || 'N/A'}</div>
          </div>
          <div className="info-row">
            <div className="info-label">VPC / Network</div>
            <div className="info-value">{networkDetails.vpc || 'Default'}</div>
          </div>
          <div className="info-row">
            <div className="info-label">Subnet</div>
            <div className="info-value">{networkDetails.subnet || 'Default'}</div>
          </div>
        </div>
      </Card>

      <Card
        title="Network Interfaces"
        actions={
          <Button
            variant="outline"
            size="small"
            icon="refresh"
            onClick={() => getVMNetworkDetails(vm.id).then(details => {
              setNetworkDetails(details);
              setInterfaces(details.interfaces || []);
            })}
          >
            Refresh
          </Button>
        }
      >
        <Table
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'type', header: 'Type' },
            { key: 'ip', header: 'IP Address' },
            { key: 'macAddress', header: 'MAC Address' },
            { key: 'status', header: 'Status', render: (row) => (
              <StatusBadge
                status={row.status === 'active' ? 'success' : 'warning'}
                text={row.status}
              />
            )},
            { key: 'actions', header: 'Actions', render: (row) => (
              <div className="table-actions">
                <Button
                  variant="icon"
                  icon="edit"
                  onClick={() => handleEditInterface(row)}
                  title="Edit interface"
                />
              </div>
            )}
          ]}
          data={interfaces}
          emptyMessage="No network interfaces found"
        />
      </Card>

      <Card
        title="Security Groups"
        actions={
          <Button
            variant="outline"
            size="small"
            icon="refresh"
            onClick={() => getVMNetworkDetails(vm.id).then(details => {
              setNetworkDetails(details);
              setSecurityGroups(details.securityGroups || []);
            })}
          >
            Refresh
          </Button>
        }
      >
        {securityGroups.map(group => (
          <div key={group.id} className="security-group-section">
            <div className="security-group-header">
              <h3>{group.name}</h3>
              <Button
                variant="outline"
                size="small"
                icon="plus"
                onClick={() => handleEditSecurityGroup(group)}
              >
                Add Rule
              </Button>
            </div>

            <Table
              columns={[
                { key: 'protocol', header: 'Protocol' },
                { key: 'port', header: 'Port Range' },
                { key: 'source', header: 'Source' },
                { key: 'description', header: 'Description' },
                { key: 'actions', header: '', render: (row) => (
                  <Button
                    variant="icon"
                    icon="trash"
                    onClick={() => handleSecurityRuleDelete(group.id, row.id)}
                    title="Delete rule"
                  />
                )}
              ]}
              data={group.rules || []}
              emptyMessage="No security rules found"
            />
          </div>
        ))}
      </Card>

      {/* Interface Edit Modal */}
      {isEditInterfaceModalOpen && selectedInterface && (
        <Modal
          title="Edit Network Interface"
          onClose={() => {
            setIsEditInterfaceModalOpen(false);
            setSelectedInterface(null);
          }}
          size="medium"
        >
          {/* Modal content would include a form to edit interface settings */}
          <p>Interface editing form would go here</p>
          <div className="modal-actions">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditInterfaceModalOpen(false);
                setSelectedInterface(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => handleInterfaceUpdate(selectedInterface)}
            >
              Save Changes
            </Button>
          </div>
        </Modal>
      )}

      {/* Add Security Rule Modal */}
      {isAddSecurityRuleModalOpen && selectedSecurityGroup && (
        <Modal
          title={`Add Rule to ${selectedSecurityGroup.name}`}
          onClose={() => {
            setIsAddSecurityRuleModalOpen(false);
            setSelectedSecurityGroup(null);
          }}
          size="medium"
        >
          {/* Modal content would include a form to add a security rule */}
          <p>Security rule form would go here</p>
          <div className="modal-actions">
            <Button
              variant="secondary"
              onClick={() => {
                setIsAddSecurityRuleModalOpen(false);
                setSelectedSecurityGroup(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSecurityRuleAdd({
                id: `rule-${Date.now()}`,
                protocol: 'tcp',
                port: '22-22',
                source: '0.0.0.0/0',
                description: 'SSH access'
              })}
            >
              Add Rule
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default NetworkTab;