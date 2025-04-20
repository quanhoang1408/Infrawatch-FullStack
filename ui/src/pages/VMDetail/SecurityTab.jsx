import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import ErrorState from '../../components/common/ErrorState';
import Table from '../../components/common/Table';
import StatusBadge from '../../components/common/StatusBadge';
import { useVM } from '../../hooks/useVM';
import { useVMActions } from '../../hooks/useVMActions';
import { useCertificate } from '../../hooks/useCertificate';
import useNotification from '../../hooks/useNotification';
import useAuth from '../../hooks/useAuth';
import { formatDate } from '../../utils/format.utils';

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

// Temporary CertificateCard component
const CertificateCard = ({ certificate, onRevoke }) => (
  <div style={{
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '16px',
    marginBottom: '16px',
    backgroundColor: certificate.status === 'active' ? '#f1f8e9' : '#f5f5f5'
  }}>
    <h3 style={{ margin: '0 0 8px 0' }}>{certificate.name}</h3>
    <div style={{ marginBottom: '8px' }}>
      <StatusBadge
        status={certificate.status === 'active' ? 'success' : 'default'}
        text={certificate.status}
      />
    </div>
    <div style={{ fontSize: '0.875rem', marginBottom: '4px' }}>
      <strong>Issued:</strong> {formatDate(certificate.issuedAt)}
    </div>
    <div style={{ fontSize: '0.875rem', marginBottom: '4px' }}>
      <strong>Expires:</strong> {formatDate(certificate.expiresAt)}
    </div>
    {certificate.status === 'active' && (
      <div style={{ marginTop: '12px' }}>
        <Button
          variant="danger"
          size="sm"
          onClick={onRevoke}
        >
          Revoke
        </Button>
      </div>
    )}
  </div>
);

const SecurityTab = ({ vm }) => {
  const { getVMSecurityDetails, updateVMSecurity, loading, error } = useVM();
  const { createCertificate } = useCertificate();
  const { updateSSHKey } = useVMActions();
  const { showSuccess, showError, showInfo, showWarning } = useNotification();
  const { user } = useAuth();
  const { vmId: urlVmId } = useParams(); // Lấy vmId từ URL

  console.log('SecurityTab component - vm:', vm);
  console.log('SecurityTab component - urlVmId:', urlVmId);

  const [securityDetails, setSecurityDetails] = useState(null);
  const [sshKeys, setSSHKeys] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [securityScans, setSecurityScans] = useState([]);
  const [showAddKeyModal, setShowAddKeyModal] = useState(false);
  const [showGenerateCertModal, setShowGenerateCertModal] = useState(false);
  const [showUpdateSSHKeyModal, setShowUpdateSSHKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [newCertName, setNewCertName] = useState('');
  const [newCertValidity, setNewCertValidity] = useState(30); // Days
  const [sshUser, setSSHUser] = useState('');

  useEffect(() => {
    const fetchSecurityDetails = async () => {
      // Sử dụng vm.id nếu có, nếu không thì sử dụng urlVmId
      const effectiveVmId = vm?.id || urlVmId;

      if (!effectiveVmId) {
        console.error('VM ID is missing in SecurityTab useEffect');
        return;
      }

      console.log('SecurityTab - fetchSecurityDetails for VM ID:', effectiveVmId);

      try {
        const details = await getVMSecurityDetails(effectiveVmId);
        setSecurityDetails(details);
        setSSHKeys(details.sshKeys || []);
        setCertificates(details.certificates || []);
        setSecurityScans(details.securityScans || []);
      } catch (err) {
        console.error('Error fetching security details:', err);
      }
    };

    fetchSecurityDetails();
    // Loại bỏ getVMSecurityDetails khỏi dependency array để tránh vòng lặp vô hạn
  }, [vm?.id, urlVmId]);

  const handleAddSSHKey = async () => {
    if (!newKeyName || !newKeyValue) {
      showError('Key name and value are required');
      return;
    }

    // Sử dụng vm.id nếu có, nếu không thì sử dụng urlVmId
    const effectiveVmId = vm?.id || urlVmId;

    if (!effectiveVmId) {
      showError('VM ID is missing. Cannot add SSH key.');
      return;
    }

    try {
      const result = await updateVMSecurity(effectiveVmId, {
        action: 'addSSHKey',
        keyName: newKeyName,
        keyValue: newKeyValue
      });

      if (result.success) {
        // Update the local state
        setSSHKeys(prevKeys => [...prevKeys, result.key]);

        showSuccess('SSH key added successfully');

        setShowAddKeyModal(false);
        setNewKeyName('');
        setNewKeyValue('');
      }
    } catch (err) {
      console.error('Error adding SSH key:', err);
      showError(`Failed to add SSH key: ${err.message}`);
    }
  };

  const handleDeleteSSHKey = async (keyId) => {
    // Sử dụng vm.id nếu có, nếu không thì sử dụng urlVmId
    const effectiveVmId = vm?.id || urlVmId;

    if (!effectiveVmId) {
      showError('VM ID is missing. Cannot delete SSH key.');
      return;
    }

    try {
      const result = await updateVMSecurity(effectiveVmId, {
        action: 'removeSSHKey',
        keyId: keyId
      });

      if (result.success) {
        // Update the local state
        setSSHKeys(prevKeys => prevKeys.filter(key => key.id !== keyId));

        showSuccess('SSH key removed successfully');
      }
    } catch (err) {
      console.error('Error removing SSH key:', err);
      showError(`Failed to remove SSH key: ${err.message}`);
    }
  };

  const handleGenerateCertificate = async () => {
    if (!newCertName) {
      showError('Certificate name is required');
      return;
    }

    // Sử dụng vm.id nếu có, nếu không thì sử dụng urlVmId
    const effectiveVmId = vm?.id || urlVmId;

    if (!effectiveVmId) {
      showError('VM ID is missing. Cannot generate certificate.');
      return;
    }

    try {
      const result = await createCertificate({
        vmId: effectiveVmId,
        name: newCertName,
        validityDays: newCertValidity
      });

      if (result.success) {
        // Update the local state
        setCertificates(prevCerts => [...prevCerts, result.certificate]);

        showSuccess('Certificate generated successfully');

        setShowGenerateCertModal(false);
        setNewCertName('');
      }
    } catch (err) {
      console.error('Error generating certificate:', err);
      showError(`Failed to generate certificate: ${err.message}`);
    }
  };

  const handleRevokeCertificate = async (certId) => {
    try {
      // Simulate revoking certificate
      // Update the local state
      setCertificates(prevCerts =>
        prevCerts.map(cert =>
          cert.id === certId
            ? { ...cert, status: 'revoked', revokedAt: new Date().toISOString() }
            : cert
        )
      );

      showSuccess('Certificate revoked successfully');
    } catch (err) {
      console.error('Error revoking certificate:', err);
      showError(`Failed to revoke certificate: ${err.message}`);
    }
  };

  const runSecurityScan = async () => {
    // Sử dụng vm.id nếu có, nếu không thì sử dụng urlVmId
    const effectiveVmId = vm?.id || urlVmId;

    if (!effectiveVmId) {
      showError('VM ID is missing. Cannot run security scan.');
      return;
    }

    try {
      const result = await updateVMSecurity(effectiveVmId, {
        action: 'runSecurityScan'
      });

      if (result.success) {
        // Update the local state
        setSecurityScans(prevScans => [result.scan, ...prevScans]);

        showSuccess('Security scan initiated successfully');
      }
    } catch (err) {
      console.error('Error running security scan:', err);
      showError(`Failed to run security scan: ${err.message}`);
    }
  };

  const handleUpdateSSHKey = async () => {
    if (!sshUser) {
      showError('SSH username is required');
      return;
    }

    // Sử dụng vm.id nếu có, nếu không thì sử dụng urlVmId
    const effectiveVmId = vm?.id || urlVmId;

    if (!effectiveVmId) {
      showError('VM ID is missing. Cannot update SSH key.');
      return;
    }

    try {
      console.log('Updating SSH key for VM:', effectiveVmId, 'with user:', sshUser);
      await updateSSHKey(effectiveVmId, sshUser);
      setShowUpdateSSHKeyModal(false);
      setSSHUser('');
    } catch (err) {
      console.error('Error updating SSH key:', err);
      showError(`Failed to update SSH key: ${err.message}`);
    }
  };

  // Check if user is admin
  const isAdmin = user && user.role === 'admin';

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
          <div style={{ display: 'flex', gap: '8px' }}>
            {isAdmin && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowUpdateSSHKeyModal(true)}
              >
                Update SSH Key
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              icon="plus"
              onClick={() => setShowAddKeyModal(true)}
            >
              Add SSH Key
            </Button>
          </div>
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
          emptyText="No SSH keys configured"
        />
      </Card>

      <Card
        title="SSH Certificates"
        actions={
          <Button
            variant="primary"
            size="sm"
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
            size="sm"
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
          emptyText="No security scans have been run"
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
                    // Sử dụng vm.id nếu có, nếu không thì sử dụng urlVmId
                    const effectiveVmId = vm?.id || urlVmId;

                    if (!effectiveVmId) {
                      showError('VM ID is missing. Cannot toggle password authentication.');
                      return;
                    }

                    updateVMSecurity(effectiveVmId, {
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
                    // Sử dụng vm.id nếu có, nếu không thì sử dụng urlVmId
                    const effectiveVmId = vm?.id || urlVmId;

                    if (!effectiveVmId) {
                      showError('VM ID is missing. Cannot toggle root login.');
                      return;
                    }

                    updateVMSecurity(effectiveVmId, {
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
                    // Sử dụng vm.id nếu có, nếu không thì sử dụng urlVmId
                    const effectiveVmId = vm?.id || urlVmId;

                    if (!effectiveVmId) {
                      showError('VM ID is missing. Cannot toggle automatic updates.');
                      return;
                    }

                    updateVMSecurity(effectiveVmId, {
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

      {/* Update SSH Key Modal */}
      {showUpdateSSHKeyModal && (
        <Modal
          title="Update SSH Key"
          onClose={() => {
            setShowUpdateSSHKeyModal(false);
            setSSHUser('');
          }}
          size="small"
        >
          <div style={{ marginBottom: '10px', fontSize: '0.875rem', color: '#666' }}>
            VM ID: {vm?.id || urlVmId || 'Not available'}
          </div>
          <div className="form-group">
            <label>SSH Username</label>
            <input
              type="text"
              value={sshUser}
              onChange={(e) => setSSHUser(e.target.value)}
              placeholder="e.g., ubuntu, ec2-user, root"
              className="form-control"
            />
          </div>
          <p className="hint-text" style={{ marginTop: '8px', fontSize: '0.875rem', color: '#666' }}>
            This will generate a new SSH key for the specified user and update it on the VM.
          </p>

          <div className="modal-actions">
            <Button
              variant="secondary"
              onClick={() => {
                setShowUpdateSSHKeyModal(false);
                setSSHUser('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const effectiveVmId = vm?.id || urlVmId;
                console.log('Update Key button clicked - vm:', vm);
                console.log('vm.id:', vm?.id);
                console.log('urlVmId:', urlVmId);
                console.log('effectiveVmId:', effectiveVmId);
                console.log('sshUser:', sshUser);
                handleUpdateSSHKey();
              }}
              disabled={!sshUser || (!vm?.id && !urlVmId)}
            >
              Update Key
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SecurityTab;