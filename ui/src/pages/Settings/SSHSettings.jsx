import React, { useState } from 'react';
import {
  Card,
  Button,
  Typography,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tooltip,
  Empty,
  Badge,
  Divider
} from 'antd';
import {
  PlusOutlined,
  KeyOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CloudServerOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import certificateService from '../../services/certificate.service';
import vmService from '../../services/vm.service';
import { formatDateIntelligently, formatDate } from '../../utils/date.utils';
import { getStatusColor } from '../../utils/format.utils';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

/**
 * SSH Settings component
 */
const SSHSettings = () => {
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Fetch certificates
  const {
    data: certificates = [],
    isLoading: certificatesLoading,
    error: certificatesError
  } = useQuery('certificates', certificateService.getCertificates);

  // Fetch VMs for certificate creation
  const {
    data: vms = [],
    isLoading: vmsLoading
  } = useQuery('vms', () => vmService.getVMs(), {
    enabled: createModalVisible // Only fetch when modal is open
  });

  // Create certificate mutation
  const createMutation = useMutation(certificateService.createCertificate, {
    onSuccess: () => {
      queryClient.invalidateQueries('certificates');
      setCreateModalVisible(false);
      form.resetFields();
    }
  });

  // Delete certificate mutation
  const deleteMutation = useMutation(certificateService.deleteCertificate, {
    onSuccess: () => {
      queryClient.invalidateQueries('certificates');
      setDeleteModalVisible(false);
      setSelectedCertificate(null);
    }
  });

  // Revoke certificate mutation
  const revokeMutation = useMutation(certificateService.revokeCertificate, {
    onSuccess: () => {
      queryClient.invalidateQueries('certificates');
    }
  });

  // Create certificate handler
  const handleCreateCertificate = (values) => {
    createMutation.mutate(values);
  };

  // Delete certificate handler
  const handleDeleteCertificate = () => {
    if (selectedCertificate) {
      deleteMutation.mutate(selectedCertificate.id);
    }
  };

  // Revoke certificate handler
  const handleRevokeCertificate = (certificate) => {
    Modal.confirm({
      title: 'Xác nhận thu hồi certificate',
      content: `Bạn có chắc chắn muốn thu hồi certificate "${certificate.name}"? Hành động này không thể hoàn tác.`,
      okText: 'Thu hồi',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        revokeMutation.mutate(certificate.id);
      }
    });
  };

  // Show delete modal
  const showDeleteModal = (certificate) => {
    setSelectedCertificate(certificate);
    setDeleteModalVisible(true);
  };

  // Show certificate VM details handler
  const showCertificateDetails = (certificate) => {
    Modal.info({
      title: `Chi tiết certificate "${certificate.name}"`,
      content: (
        <div>
          <p><strong>ID:</strong> {certificate.id}</p>
          <p><strong>Tạo bởi:</strong> {certificate.user}</p>
          <p><strong>Ngày tạo:</strong> {formatDate(certificate.created)}</p>
          <p><strong>Ngày hết hạn:</strong> {formatDate(certificate.expires)}</p>
          <p><strong>Trạng thái:</strong> {certificate.status === 'active' ? 'Đang hoạt động' : 'Đã hết hạn'}</p>
          <Divider />
          <p><strong>Máy ảo được cấp quyền:</strong></p>
          {certificate.vms && certificate.vms.length > 0 ? (
            <ul>
              {certificate.vms.map(vmId => {
                const vm = vms.find(v => v.id === vmId);
                return (
                  <li key={vmId}>
                    {vm ? `${vm.name} (${vm.ip})` : vmId}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>Không có máy ảo nào được gán.</p>
          )}
        </div>
      ),
      width: 600,
    });
  };

  return (
    <div className="ssh-settings">
      <div className="settings-header">
        <Title level={2}>SSH Certificate Management</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalVisible(true)}
        >
          Tạo Certificate
        </Button>
      </div>

      <Paragraph>
        SSH Certificates cho phép bạn truy cập các máy ảo một cách an toàn mà không cần quản lý nhiều khóa SSH.
        Hệ thống sẽ tạo và quản lý certificates tập trung qua HashiCorp Vault.
      </Paragraph>

      <div className="certificate-list">
        {certificatesLoading ? (
          <div className="loading-container">Đang tải certificates...</div>
        ) : certificatesError ? (
          <div className="error-container">
            <Text type="danger">Lỗi khi tải certificates. Vui lòng thử lại sau.</Text>
          </div>
        ) : certificates.length === 0 ? (
          <Empty
            description="Không có certificate nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          certificates.map(certificate => (
            <Card
              key={certificate.id}
              title={
                <Space>
                  <KeyOutlined />
                  {certificate.name}
                  <Badge
                    status={certificate.status === 'active' ? 'success' : 'error'}
                    text={certificate.status === 'active' ? 'Hoạt động' : 'Hết hạn'}
                  />
                </Space>
              }
              className={`certificate-card ${certificate.status !== 'active' ? 'expired' : ''}`}
              extra={
                <Space>
                  <Tooltip title="Xem chi tiết">
                    <Button
                      icon={<InfoCircleOutlined />}
                      size="small"
                      onClick={() => showCertificateDetails(certificate)}
                    />
                  </Tooltip>
                  {certificate.status === 'active' && (
                    <Tooltip title="Thu hồi">
                      <Button
                        icon={<DownloadOutlined />}
                        size="small"
                        danger
                        onClick={() => handleRevokeCertificate(certificate)}
                      />
                    </Tooltip>
                  )}
                  <Tooltip title="Xóa">
                    <Button
                      icon={<DeleteOutlined />}
                      size="small"
                      danger
                      onClick={() => showDeleteModal(certificate)}
                    />
                  </Tooltip>
                </Space>
              }
            >
              <div className="certificate-info">
                <p>
                  <Space>
                    <UserOutlined />
                    <span>Người tạo: {certificate.user}</span>
                  </Space>
                </p>

                <div className="certificate-date">
                  <Text type="secondary">
                    <ClockCircleOutlined /> Tạo: {formatDateIntelligently(certificate.created)}
                  </Text>
                  <Text type={certificate.status === 'active' ? 'secondary' : 'danger'}>
                    <ClockCircleOutlined /> Hết hạn: {formatDateIntelligently(certificate.expires)}
                  </Text>
                </div>
              </div>

              <div className="certificate-vms">
                <Space>
                  <CloudServerOutlined />
                  <span>Máy ảo:</span>
                </Space>
                <div style={{ marginTop: 8 }}>
                  {certificate.vms && certificate.vms.length > 0 ? (
                    certificate.vms.map(vmId => {
                      const vm = vms.find(v => v.id === vmId);
                      return (
                        <Tag key={vmId} className="vm-label" color="blue">
                          {vm ? vm.name : vmId}
                        </Tag>
                      );
                    })
                  ) : (
                    <Text type="secondary">Không có máy ảo nào</Text>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Certificate Modal */}
      <Modal
        title="Tạo Certificate mới"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateCertificate}
          className="create-certificate-form"
        >
          <Form.Item
            name="name"
            label="Tên Certificate"
            rules={[{ required: true, message: 'Vui lòng nhập tên certificate' }]}
          >
            <Input placeholder="Ví dụ: Production Access" />
          </Form.Item>

          <Form.Item
            name="vms"
            label="Máy ảo"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một máy ảo' }]}
          >
            <Select
              mode="multiple"
              placeholder="Chọn máy ảo"
              loading={vmsLoading}
              className="vm-selector"
              optionFilterProp="children"
            >
              {vms.map(vm => (
                <Option key={vm.id} value={vm.id}>
                  {vm.name} ({vm.ip}) - {vm.provider}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="validityDays"
            label="Thời hạn"
            initialValue={365}
          >
            <Select className="validity-select">
              <Option value={30}>30 ngày</Option>
              <Option value={90}>90 ngày</Option>
              <Option value={180}>180 ngày</Option>
              <Option value={365}>1 năm</Option>
              <Option value={730}>2 năm</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setCreateModalVisible(false);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isLoading}
              >
                Tạo Certificate
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Delete Certificate Modal */}
      <Modal
        title="Xác nhận xóa certificate"
        open={deleteModalVisible}
        onCancel={() => {
          setDeleteModalVisible(false);
          setSelectedCertificate(null);
        }}
        onOk={handleDeleteCertificate}
        okText="Xóa"
        okType="danger"
        cancelText="Hủy"
        confirmLoading={deleteMutation.isLoading}
      >
        <p>
          Bạn có chắc chắn muốn xóa certificate "{selectedCertificate?.name}"?
        </p>
        <p>
          Hành động này không thể hoàn tác và sẽ xóa vĩnh viễn certificate khỏi hệ thống.
        </p>
      </Modal>
    </div>
  );
};

export default SSHSettings;