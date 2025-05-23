import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Form, Input, Select, Alert, Spin, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import axios from 'axios';
// Import terminal component
import BasicTerminal from '../../components/terminal/BasicTerminal';
import useNotification from '../../hooks/useNotification';
import { useVM } from '../../hooks/useVM';
import api from '../../services/api';
import { initiateSSHConnection } from '../../services/terminal.service';
import './Terminal.scss';
// Import terminal styles
import '../../components/terminal/BasicTerminal.scss';

const { Title } = Typography;
const { Option } = Select;

/**
 * Terminal page for SSH connection to VMs
 */
const Terminal = () => {
  const { vmId } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();
  const { getVMDetail, fetchVMById } = useVM();

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
        // No mock data - using real API only

        // Try fetchVMById first, then fallback to getVMDetail
        try {
          const vmData = await fetchVMById(vmId);
          setVM(vmData);
          setLoading(false);
        } catch (fetchError) {
          const vmData = await getVMDetail(vmId);
          setVM(vmData);
          setLoading(false);
        }
      } catch (error) {

        // Specific handling for timeout errors
        if (error.code === 'ECONNABORTED') {
          const timeoutMessage = 'Kết nối đến máy chủ bị timeout. Vui lòng thử lại sau.';
          setError(timeoutMessage);
          setLoading(false);
          showError('Lỗi kết nối', timeoutMessage);
        } else {
          const errorMessage = error.message || 'Failed to load VM details';
          setError(errorMessage);
          setLoading(false);
          showError('Error', errorMessage);
        }
      }
    };

    fetchVM();
  }, [vmId, fetchVMById, getVMDetail, showError]);

  // Handle form submission
  const handleConnect = async () => {
    setConnecting(true);
    setError(null);

    console.log('Initiating SSH session for VM:', vmId, 'with user:', sshUser);

    try {
      // Use the terminal service to initiate SSH session
      console.log('Using terminal service to initiate SSH session');

      const sessionInfo = await initiateSSHConnection(vmId, sshUser);
      console.log('SSH session initiated successfully:', sessionInfo);

      setSessionId(sessionInfo.sessionId);
      setShowForm(false);
      setConnecting(false);
      showSuccess('SSH session initiated successfully');
    } catch (error) {
      console.error('SSH session initiation error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      // Specific handling for timeout errors
      if (error.code === 'ECONNABORTED') {
        const timeoutMessage = 'Kết nối đến máy chủ bị timeout. Vui lòng thử lại sau.';
        setError(timeoutMessage);
        setConnecting(false);
        showError('Lỗi kết nối', timeoutMessage);
      } else if (error.response?.status === 404) {
        const errorMsg = 'VM not found or SSH service not available';
        setError(errorMsg);
        setConnecting(false);
        showError('Connection Error', errorMsg);
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        const errorMsg = 'Authentication failed. Please log in again.';
        setError(errorMsg);
        setConnecting(false);
        showError('Authentication Error', errorMsg);
      } else if (error.response?.status === 500) {
        const errorMsg = 'Server error. The SSH service might be unavailable.';
        setError(errorMsg);
        setConnecting(false);
        showError('Server Error', errorMsg);
      } else {
        const errorMsg = error.response?.data?.message || 'Failed to connect to VM';
        setError(errorMsg);
        setConnecting(false);
        showError('Connection Error', errorMsg);
      }
    }
  };

  // Handle terminal connection
  const handleTerminalConnect = (vmId, sessionId) => {
    if (!sessionId) {
      console.error('No session ID provided');
      return null;
    }

    console.log('handleTerminalConnect called with:', { vmId, sessionId });

    // Determine the WebSocket URL based on environment
    let wsUrl;

    // Use protocol based on current page and target host
    let wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    // Use the API domain for WebSocket connection
    // For local development, connect to the remote server
    let wsHost = window.location.hostname === 'localhost' ? 'api.infrawatch.website' : window.location.host;

    // Check if we should use a proxy for WebSocket
    const useProxy = process.env.REACT_APP_USE_WS_PROXY === 'true';
    console.log('WebSocket proxy configuration:', {
      REACT_APP_USE_WS_PROXY: process.env.REACT_APP_USE_WS_PROXY,
      useProxy
    });

    // For localhost development, we need to handle WebSocket connections differently
    if (window.location.hostname === 'localhost') {
      // When running on localhost, we need to use the same protocol (ws/wss) as the page
      // to avoid mixed content issues
      const localWsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

      // Use the API domain directly
      wsUrl = `${localWsProtocol}//api.infrawatch.website/ws-ssh`;

      // Add session ID as a query parameter as a fallback for browsers that don't support protocols
      wsUrl = `${wsUrl}?sessionId=${sessionId}`;

      console.log(`Using ${localWsProtocol} WebSocket URL for localhost:`, wsUrl);
      return wsUrl;
    }

    // For other hosts, use the full URL
    if (wsHost === 'api.infrawatch.website') {
      // Always use ws: for now to avoid mixed content issues
      wsProtocol = 'ws:';
      console.log('Using ws: protocol for all connections to avoid mixed content issues');
    }

    // Construct the WebSocket URL
    wsUrl = `${wsProtocol}//${wsHost}/ws-ssh`;

    // Always add sessionId as a query parameter for better compatibility
    wsUrl = `${wsUrl}?sessionId=${sessionId}`;

    // Add debug information
    console.log('WebSocket configuration:', {
      currentProtocol: window.location.protocol,
      wsProtocol,
      wsHost,
      wsUrl
    });

    // Log connection attempt for debugging
    console.log('Connecting to WebSocket:', {
      vmId,
      sessionId,
      protocol: wsProtocol,
      host: wsHost,
      wsUrl: wsUrl
    });

    return wsUrl;
  };

  // Handle terminal disconnection
  const handleTerminalDisconnect = (_, __, reason) => {
    setShowForm(true);
    setSessionId(null);

    if (reason && reason !== 'User disconnected') {
      setError(`Connection closed: ${reason}`);
    } else {
      setError(null);
    }
  };

  // Handle back button click
  const handleBack = () => {
    navigate(`/vm/${vmId}`);
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
          description={error || "The requested VM could not be found. Please check the VM ID and try again."}
          showIcon
        />
        <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
          <Button
            type="primary"
            onClick={() => navigate('/vm')}
          >
            Back to VM List
          </Button>
          <Button
            onClick={() => {
              setLoading(true);
              setError(null);
              // Create a new instance of Axios with longer timeout just for this retry
              const retryApi = axios.create({
                baseURL: process.env.REACT_APP_API_URL,
                timeout: 60000, // 60 seconds timeout for retry
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
              });

              // Try to fetch VM details with longer timeout
              retryApi.get(`/vm/${vmId}`)
                .then(response => {
                  console.log('Retry successful:', response.data);
                  setVM(response.data);
                  setLoading(false);
                })
                .catch(error => {
                  console.error('Retry failed:', error);
                  const errorMessage = error.code === 'ECONNABORTED'
                    ? 'Kết nối vẫn bị timeout. Vui lòng kiểm tra kết nối mạng hoặc liên hệ với quản trị viên.'
                    : (error.message || 'Failed to load VM details');
                  setError(errorMessage);
                  setLoading(false);
                  showError('Lỗi kết nối', errorMessage);
                });
            }}
          >
            Thử lại (60s timeout)
          </Button>
        </div>
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

            <Form.Item>
              <Button
                onClick={async () => {
                  try {
                    setConnecting(true);
                    // Test API connection
                    await api.get('/auth/me');
                    showSuccess('API connection test successful');
                    setConnecting(false);
                  } catch (error) {
                    showError('API Connection Test', 'Failed to connect to API: ' + (error.message || 'Unknown error'));
                    setConnecting(false);
                  }
                }}
                block
              >
                Test API Connection
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ) : (
        <Card className="terminal-card" style={{ height: '500px', width: '100%' }}>
          <BasicTerminal
            vmId={vmId}
            vmName={vm?.name}
            sessionId={sessionId}
            onConnect={handleTerminalConnect}
            onDisconnect={handleTerminalDisconnect}
          />
        </Card>
      )}
    </div>
  );
};

export default Terminal;