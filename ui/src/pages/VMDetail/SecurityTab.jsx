import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import { ErrorState } from '../../components/common/ErrorState';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CertificateCard } from '../../components/certificates/CertificateCard';
import { useVM } from '../../hooks/useVM';
import { useCertificate } from '../../hooks/useCertificate';
import { useNotification } from '../../hooks/useNotification';
import { formatDate } from '../../utils/format.utils';

const SecurityTab = ({ vm }) => {
  const { getVMSecurityDetails, updateVMSecurity, loading, error } = useVM();
  const { generateCertificate, revokeCertificate } = useCertificate();
  const { showNotification } = useNotification();
  
  const [securityDetails, setSecurityDetails] = useState(null);
  const [sshKeys, setSSHKeys] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [securityScans, setSecurityScans] = useState([]);
  const [showAddKeyModal, setShowAddKeyModal] = useState(false);
  const [showGenerateCertModal, setShowGenerateCertModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [newCertName, setNewCertName] = useState('');
  const [newCertValidity, setNewCertValidity] = useState(30); // Days
  
  useEffect(() => {
    const fetchSecurityDetails = async () => {
      try {
        const details = await getVMSecurityDetails(vm.id);
        setSecurityDetails(details);
        setSSHKeys(details.sshKeys || []);
        setCertificates(details.certificates || []);
        setSecurityScans(details.securityScans || []);
      } catch (err) {
        console.error('Error fetching security details:', err);
      }
    };
    
    fetchSecurityDetails();
  }, [vm.id, getVMSecurityDetails]);
  
  const handleAddSSHKey = async () => {
    if (!newKeyName || !newKeyValue) {
      showNotification({
        type: 'error',
        message: 'Key name and value are required'
      });
      return;
    }
    
    try {
      const result = await updateVMSecurity(vm.id, {
        action: 'addSSHKey',
        keyName: newKeyName,
        keyValue: newKeyValue
      });
      
      if (result.success) {
        // Update the local state
        setSSHKeys(prevKeys => [...prevKeys, result.key]);
        
        showNotification({
          type: 'success',
          message: 'SSH key added successfully'
        });
        
        setShowAddKeyModal(false);
        setNewKeyName('');
        setNewKeyValue('');
      }
    } catch (err) {
      console.error('Error adding SSH key:', err);
      showNotification({
        type: 'error',
        message: `Failed to add SSH key: ${err.message}`
      });
    }
  };
  
  const handleDeleteSSHKey = async (keyId) => {
    try {
      const result = await updateVMSecurity(vm.id, {
        action: 'removeSSHKey',
        keyId: keyId
      });
      
      if (result.success) {
        // Update the local state
        setSSHKeys(prevKeys => prevKeys.filter(key => key.id !== keyId));
        
        showNotification({
          type: 'success',
          message: 'SSH key removed successfully'
        });
      }
    } catch (err) {
      console.error('Error removing SSH key:', err);
      showNotification({
        type: 'error',
        message: `Failed to remove SSH key: ${err.message}`
      });
    }
  };
  
  const handleGenerateCertificate = async () => {
    if (!newCertName) {
      showNotification({
        type: 'error',
        message: 'Certificate name is required'
      });
      return;
    }
    
    try {
      const result = await generateCertificate({
        vmId: vm.id,
        name: newCertName,
        validityDays: newCertValidity
      });
      
      if (result.success) {
        // Update the local state
        setCertificates(prevCerts => [...prevCerts, result.certificate]);
        
        showNotification({
          type: 'success',
          message: 'Certificate generated successfully'
        });
        
        setShowGenerateCertModal(false);
        setNewCertName('');
      }
    } catch (err) {
      console.error('Error generating certificate:', err);
      showNotification({
        type: 'error',
        message: `Failed to generate certificate: ${err.message}`
      });
    }
  };
  
  const handleRevokeCertificate = async (certId) => {
    try {
      const result = await revokeCertificate(certId);
      
      if (result.success) {
        // Update the local state
        setCertificates(prevCerts => 
          prevCerts.map(cert => 
            cert.id === certId 
              ? { ...cert, status: 'revoked', revokedAt: new Date().toISOString() } 
              : cert
          )
        );
        
        showNotification({
          type: 'success',
          message: 'Certificate revoked successfully'
        });
      }
    } catch (err) {
      console.error('Error revoking certificate:', err);
      showNotification({
        type: 'error',
        message: `Failed to revoke certificate: ${err.message}`
      });
    }
  };
  
  const runSecurityScan = async () => {
    try {
      const result = await updateVMSecurity(vm.id, {
        action: 'runSecurityScan'
      });
      
      if (result.success) {
        // Update the local state
        setSecurityScans(prevScans => [result.scan, ...prevScans]);
        
        showNotification({
          type: 'success',
          message: 'Security scan initiated successfully'
        });
      }
    } catch (err) {
      console.error('Error running security scan:', err);
      showNotification({
        type: 'error',
        message: `Failed to run security scan: ${err.message}`
      });
    }
  };
  
  if (loading && !securityDetails) {
    return (
      <div className="security-loading">
        <Spinner />
        <p>Loading security details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <ErrorState 
        title="Failed to load security details"
        message={error.message}
      />
    );
  }
  
  if (!securityDetails) {
    return (
      <ErrorState 
        title="No security details available"
        message="Unable to retrieve security information for this virtual machine."
      />
    );
  }
  
  return (
    <div className="security-tab">
      <Card 
        title="SSH Keys" 
        actions={
          <Button 
            variant="primary" 
            size="small"
            icon="plus"
            onClick={() => setShowAddKeyModal(true)}
          >
            Add SSH Key
          </Button>
        }
      >
        <Table
          columns={[
            { key: 'name', header: 'Key Name' },
            { key: 'fingerprint', header: 'Fingerprint' },
            { key: 'addedAt', header: 'Added Date', render: (row) => formatDate(row.addedAt) },
            { key: 'lastUsed', header: 'Last Used', render: (row) => row.lastUsed ? formatDate(row.lastUsed) : 'Never' },
            { key: 'actions', header: 'Actions', render: (row) => (
              <Button 
                variant="icon" 
                icon="trash"
                onClick={() => handleDeleteSSHKey(row.id)}
                title="Delete key"
              />
            )}
          ]}
          data={sshKeys}
          emptyMessage="No SSH keys configured"
        />
      </Card>
      
      <Card 
        title="SSH Certificates" 
        actions={
          <Button 
            variant="primary" 
            size="small"
            icon="plus"
            onClick={() => setShowGenerateCertModal(true)}
          >
            Generate Certificate
          </Button>
        }
      >
        {certificates.length > 0 ? (
          <div className="certificates-grid">
            {certificates.map(cert => (
              <CertificateCard 
                key={cert.id}
                certificate={cert}
                onRevoke={() => handleRevokeCertificate(cert.id)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-certificates">
            <p>No SSH certificates configured</p>
            <p className="hint-text">Certificates provide a more secure way to access your VM than password authentication</p>
          </div>
        )}
      </Card>
      
      <Card 
        title="Security Scans" 
        actions={
          <Button 
            variant="primary" 
            size="small"
            icon="shield"
            onClick={runSecurityScan}
          >
            Run Security Scan
          </Button>
        }
      >
        <Table
          columns={[
            { key: 'scanDate', header: 'Scan Date', render: (row) => formatDate(row.scanDate) },
            { key: 'status', header: 'Status', render: (row) => (
              <StatusBadge 
                status={
                  row.status === 'completed' 
                    ? (row.vulnerabilities > 0 ? 'danger' : 'success')
                    : row.status === 'in-progress' 
                      ? 'warning' 
                      : 'error'
                } 
                text={row.status}
              />
            )},
            { key: 'vulnerabilities', header: 'Vulnerabilities', render: (row) => (
              row.status === 'completed' 
                ? `${row.criticalVulnerabilities} critical, ${row.vulnerabilities - row.criticalVulnerabilities} other`
                : '-'
            )},
            { key: 'actions', header: 'Actions', render: (row) => (
              <Button 
                variant="text" 
                disabled={row.status !== 'completed'}
                onClick={() => {/* View scan details */}}
              >
                View Details
              </Button>
            )}
          ]}
          data={securityScans}
          emptyMessage="No security scans have been run"
        />
      </Card>
      
      <Card title="Security Settings">
        <div className="security-settings">
          <div className="setting-item">
            <div className="setting-label">Password Authentication</div>
            <div className="setting-value">
              <div className="toggle-switch">
                <input 
                  type="checkbox" 
                  id="password-auth" 
                  checked={securityDetails.passwordAuth} 
                  onChange={() => {
                    updateVMSecurity(vm.id, {
                      action: 'togglePasswordAuth',
                      enabled: !securityDetails.passwordAuth
                    }).then(result => {
                      if (result.success) {
                        setSecurityDetails(prev => ({
                          ...prev,
                          passwordAuth: !prev.passwordAuth
                        }));
                      }
                    });
                  }}
                />
                <label htmlFor="password-auth"></label>
              </div>
              <span>{securityDetails.passwordAuth ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-label">Root Login</div>
            <div className="setting-value">
              <div className="toggle-switch">
                <input 
                  type="checkbox" 
                  id="root-login" 
                  checked={securityDetails.rootLogin} 
                  onChange={() => {
                    updateVMSecurity(vm.id, {
                      action: 'toggleRootLogin',
                      enabled: !securityDetails.rootLogin
                    }).then(result => {
                      if (result.success) {
                        setSecurityDetails(prev => ({
                          ...prev,
                          rootLogin: !prev.rootLogin
                        }));
                      }
                    });
                  }}
                />
                <label htmlFor="root-login"></label>
              </div>
              <span>{securityDetails.rootLogin ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-label">Automatic Security Updates</div>
            <div className="setting-value">
              <div className="toggle-switch">
                <input 
                  type="checkbox" 
                  id="auto-updates" 
                  checked={securityDetails.autoUpdates} 
                  onChange={() => {
                    updateVMSecurity(vm.id, {
                      action: 'toggleAutoUpdates',
                      enabled: !securityDetails.autoUpdates
                    }).then(result => {
                      if (result.success) {
                        setSecurityDetails(prev => ({
                          ...prev,
                          autoUpdates: !prev.autoUpdates
                        }));
                      }
                    });
                  }}
                />
                <label htmlFor="auto-updates"></label>
              </div>
              <span>{securityDetails.autoUpdates ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Add SSH Key Modal */}
      {showAddKeyModal && (
        <Modal
          title="Add SSH Key"
          onClose={() => {
            setShowAddKeyModal(false);
            setNewKeyName('');
            setNewKeyValue('');
          }}
          size="medium"
        >
          <div className="form-group">
            <label>Key Name</label>
            <input 
              type="text" 
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g., my-laptop-key"
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label>Public Key</label>
            <textarea 
              value={newKeyValue}
              onChange={(e) => setNewKeyValue(e.target.value)}
              placeholder="Paste your SSH public key (starts with ssh-rsa or ssh-ed25519)"
              className="form-control"
              rows={5}
            />
          </div>
          
          <div className="modal-actions">
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowAddKeyModal(false);
                setNewKeyName('');
                setNewKeyValue('');
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleAddSSHKey}
              disabled={!newKeyName || !newKeyValue}
            >
              Add Key
            </Button>
          </div>
        </Modal>
      )}
      
      {/* Generate Certificate Modal */}
      {showGenerateCertModal && (
        <Modal
          title="Generate SSH Certificate"
          onClose={() => {
            setShowGenerateCertModal(false);
            setNewCertName('');
          }}
          size="small"
        >
          <div className="form-group">
            <label>Certificate Name</label>
            <input 
              type="text" 
              value={newCertName}
              onChange={(e) => setNewCertName(e.target.value)}
              placeholder="e.g., dev-laptop-cert"
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label>Validity Period (Days)</label>
            <input 
              type="number" 
              value={newCertValidity}
              min="1"
              max="365"
              onChange={(e) => setNewCertValidity(parseInt(e.target.value))}
              className="form-control"
            />
          </div>
          
          <div className="modal-actions">
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowGenerateCertModal(false);
                setNewCertName('');
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleGenerateCertificate}
              disabled={!newCertName}
            >
              Generate
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SecurityTab;