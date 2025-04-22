import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Form, Input, Select, Alert, Spin, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Terminal as TerminalComponent } from '../../components/terminal';
import { useNotification } from '../../hooks/useNotification';
import { useVM } from '../../hooks/useVM';
import api from '../../services/api';
import './Terminal.scss';

const { Title } = Typography;
const { Option } = Select;

/**
 * Terminal page for SSH connection to VMs
 */
const Terminal = () => {
  const { id: vmId } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();
  const { getVM } = useVM();

  const [vm, setVM] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [sshUser, setSshUser] = useState('ubuntu');
  const [showForm, setShowForm] = useState(true);

  // Fetch VM details
  useEffect(() => {
    const fetchVM = async () => {
      try {
        const vmData = await getVM(vmId);
        setVM(vmData);
        setLoading(false);
      } catch (error) {
        setError('Failed to load VM details');
        setLoading(false);
        showError('Error', 'Failed to load VM details');
      }
    };

    fetchVM();
  }, [vmId, getVM, showError]);

  // Handle form submission
  const handleConnect = async () => {
    setConnecting(true);
    setError(null);

    try {
      // Initiate SSH session
      const response = await api.post(`/terminal/${vmId}/session`, { sshUser });

      setSessionId(response.data.sessionId);
      setShowForm(false);
      setConnecting(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to connect to VM');
      setConnecting(false);
      showError('Connection Error', error.response?.data?.message || 'Failed to connect to VM');
    }
  };

  // Handle terminal connection
  const handleTerminalConnect = (vmId, sessionId) => {
    if (!sessionId) return null;

    // Return WebSocket URL with session ID in protocol
    return `wss://${window.location.hostname === 'localhost' ? 'api.infrawatch.website' : window.location.host}/ws-ssh`;
  };

  // Handle terminal disconnection
  const handleTerminalDisconnect = (vmId, sessionId, reason) => {
    setShowForm(true);
    setSessionId(null);

    if (reason && reason !== 'User disconnected') {
      setError(`Connection closed: ${reason}`);
    } else {
      setError(null);
    }
  };

  // Handle terminal data
  const handleTerminalData = (data) => {
    // Handle terminal data if needed
  };

  // Handle back button click
  const handleBack = () => {
    navigate(`/vms/${vmId}`);
  };

  if (loading) {
    return (
      <div className="terminal-page-loading">
        <Spin size="large" />
        <p>Loading VM details...</p>
      </div>
    );
  }

  if (!vm) {
    return (
      <div className="terminal-page-error">
        <Alert
          type="error"
          message="VM Not Found"
          description="The requested VM could not be found. Please check the VM ID and try again."
          showIcon
        />
        <Button
          type="primary"
          onClick={() => navigate('/vms')}
          style={{ marginTop: '16px' }}
        >
          Back to VM List
        </Button>
      </div>
    );
  }

  return (
    <div className="terminal-page">
      <div className="terminal-page-header">
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
        >
          Back to VM Details
        </Button>
        <Title level={4}>
          {vm?.name ? `Terminal - ${vm.name}` : 'Terminal'}
        </Title>
      </div>

      {showForm ? (
        <Card className="terminal-form-card">
          <Form layout="vertical" onFinish={handleConnect}>
            <Form.Item label="VM" className="terminal-form-item">
              <Input value={vm?.name} disabled />
            </Form.Item>

            <Form.Item label="SSH User" className="terminal-form-item">
              <Select
                value={sshUser}
                onChange={setSshUser}
                style={{ width: '100%' }}
                disabled={connecting}
              >
                <Option value="ubuntu">ubuntu</Option>
                <Option value="ec2-user">ec2-user</Option>
                <Option value="admin">admin</Option>
                <Option value="root">root</Option>
              </Select>
            </Form.Item>

            {error && (
              <Form.Item>
                <Alert type="error" message={error} showIcon />
              </Form.Item>
            )}

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={connecting}
                block
              >
                {connecting ? 'Connecting...' : 'Connect'}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ) : (
        <Card className="terminal-card">
          <TerminalComponent
            vmId={vmId}
            vmName={vm?.name}
            sessionId={sessionId}
            onConnect={handleTerminalConnect}
            onDisconnect={handleTerminalDisconnect}
            onData={handleTerminalData}
            autoConnect={true}
          />
        </Card>
      )}
    </div>
  );
};

export default Terminal;