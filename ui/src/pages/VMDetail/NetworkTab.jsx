import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/common/Card';
import { Table } from '../../../components/common/Table';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Button } from '../../../components/common/Button';
import { Spinner } from '../../../components/common/Spinner';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { Modal } from '../../../components/common/Modal';
import { useVM } from '../../../hooks/useVM';
import { useNotification } from '../../../hooks/useNotification';
import { formatBytes, formatDate } from '../../../utils/format.utils';
import './VMDetail.scss';

const NetworkTab = ({ vmId }) => {
  const { getVMNetworkInterfaces, updateNetworkInterface } = useVM();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [networkInterfaces, setNetworkInterfaces] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedInterface, setSelectedInterface] = useState(null);
  const [securityGroups, setSecurityGroups] = useState([]);

  useEffect(() => {
    fetchNetworkData();
  }, [vmId]);

  const fetchNetworkData = async () => {
    try {
      setLoading(true);
      const data = await getVMNetworkInterfaces(vmId);
      setNetworkInterfaces(data.interfaces || []);
      setSecurityGroups(data.securityGroups || []);
      setError(null);
    } catch (err) {
      setError('Không thể tải thông tin mạng. Vui lòng thử lại sau.');
      console.error('Error fetching network data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableInterface = async (interfaceId) => {
    try {
      await updateNetworkInterface(vmId, interfaceId, { enabled: true });
      showNotification('success', 'Đã bật giao diện mạng thành công');
      fetchNetworkData();
    } catch (err) {
      showNotification('error', 'Không thể bật giao diện mạng. Vui lòng thử lại.');
      console.error('Error enabling network interface:', err);
    }
  };

  const handleDisableInterface = async (interfaceId) => {
    try {
      await updateNetworkInterface(vmId, interfaceId, { enabled: false });
      showNotification('success', 'Đã tắt giao diện mạng thành công');
      fetchNetworkData();
    } catch (err) {
      showNotification('error', 'Không thể tắt giao diện mạng. Vui lòng thử lại.');
      console.error('Error disabling network interface:', err);
    }
  };

  const handleViewDetails = (networkInterface) => {
    setSelectedInterface(networkInterface);
    setShowModal(true);
  };

  const renderInterfaceStatus = (status) => {
    let type = 'default';
    
    switch (status) {
      case 'connected':
        type = 'success';
        break;
      case 'disconnected':
        type = 'error';
        break;
      case 'pending':
        type = 'warning';
        break;
      default:
        type = 'default';
    }
    
    return <StatusBadge type={type} label={status} />;
  };

  if (loading) {
    return (
      <div className="tab-loading-container">
        <Spinner />
        <p>Đang tải thông tin mạng...</p>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchNetworkData} />;
  }

  if (networkInterfaces.length === 0) {
    return <EmptyState message="Không tìm thấy thông tin giao diện mạng cho máy ảo này." />;
  }

  return (
    <div className="network-tab">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Giao diện mạng</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            columns={[
              { key: 'name', title: 'Tên' },
              { key: 'ipAddress', title: 'Địa chỉ IP' },
              { key: 'macAddress', title: 'Địa chỉ MAC' },
              { key: 'status', title: 'Trạng thái', render: (row) => renderInterfaceStatus(row.status) },
              { key: 'networkType', title: 'Loại mạng' },
              { key: 'bandwidth', title: 'Băng thông', render: (row) => row.bandwidth ? `${row.bandwidth} Mbps` : 'N/A' },
              { 
                key: 'actions', 
                title: 'Hành động',
                render: (row) => (
                  <div className="action-buttons">
                    <Button 
                      size="small" 
                      variant="text" 
                      onClick={() => handleViewDetails(row)}
                    >
                      Chi tiết
                    </Button>
                    {row.status === 'connected' ? (
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="error"
                        onClick={() => handleDisableInterface(row.id)}
                      >
                        Ngắt kết nối
                      </Button>
                    ) : (
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="primary"
                        onClick={() => handleEnableInterface(row.id)}
                        disabled={row.status === 'pending'}
                      >
                        Kết nối
                      </Button>
                    )}
                  </div>
                )
              }
            ]}
            data={networkInterfaces}
            rowKey="id"
          />
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Thống kê mạng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="network-stats-grid">
            {networkInterfaces.map(nic => (
              <div key={nic.id} className="network-stat-card">
                <h4>{nic.name}</h4>
                <div className="network-stat-item">
                  <span className="stat-label">Dữ liệu gửi:</span>
                  <span className="stat-value">{formatBytes(nic.txBytes || 0)}</span>
                </div>
                <div className="network-stat-item">
                  <span className="stat-label">Dữ liệu nhận:</span>
                  <span className="stat-value">{formatBytes(nic.rxBytes || 0)}</span>
                </div>
                <div className="network-stat-item">
                  <span className="stat-label">Gói tin gửi:</span>
                  <span className="stat-value">{nic.txPackets || 0}</span>
                </div>
                <div className="network-stat-item">
                  <span className="stat-label">Gói tin nhận:</span>
                  <span className="stat-value">{nic.rxPackets || 0}</span>
                </div>
                <div className="network-stat-item">
                  <span className="stat-label">Lỗi:</span>
                  <span className="stat-value">{nic.errors || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal hiển thị chi tiết giao diện mạng */}
      {showModal && selectedInterface && (
        <Modal
          title={`Chi tiết giao diện: ${selectedInterface.name}`}
          open={showModal}
          onClose={() => setShowModal(false)}
          size="medium"
        >
          <div className="interface-details">
            <div className="detail-group">
              <div className="detail-item">
                <span className="detail-label">ID:</span>
                <span className="detail-value">{selectedInterface.id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Tên:</span>
                <span className="detail-value">{selectedInterface.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Địa chỉ IP:</span>
                <span className="detail-value">{selectedInterface.ipAddress}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Subnet Mask:</span>
                <span className="detail-value">{selectedInterface.subnetMask || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Gateway:</span>
                <span className="detail-value">{selectedInterface.gateway || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Địa chỉ MAC:</span>
                <span className="detail-value">{selectedInterface.macAddress}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">VLAN ID:</span>
                <span className="detail-value">{selectedInterface.vlanId || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Loại mạng:</span>
                <span className="detail-value">{selectedInterface.networkType}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Băng thông:</span>
                <span className="detail-value">{selectedInterface.bandwidth ? `${selectedInterface.bandwidth} Mbps` : 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Trạng thái:</span>
                <span className="detail-value">{renderInterfaceStatus(selectedInterface.status)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Ngày tạo:</span>
                <span className="detail-value">{formatDate(selectedInterface.createdAt)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Ngày cập nhật:</span>
                <span className="detail-value">{formatDate(selectedInterface.updatedAt)}</span>
              </div>
            </div>

            {selectedInterface.dnsServers && selectedInterface.dnsServers.length > 0 && (
              <div className="detail-section">
                <h4>DNS Servers</h4>
                <ul className="detail-list">
                  {selectedInterface.dnsServers.map((server, index) => (
                    <li key={index}>{server}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedInterface.securityGroups && selectedInterface.securityGroups.length > 0 && (
              <div className="detail-section">
                <h4>Nhóm bảo mật</h4>
                <ul className="detail-list">
                  {selectedInterface.securityGroups.map((group, index) => (
                    <li key={index}>{group}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default NetworkTab;