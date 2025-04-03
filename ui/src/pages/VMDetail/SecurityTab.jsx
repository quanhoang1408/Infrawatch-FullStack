import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Table } from '@/components/common/Table';
import { Tooltip } from '@/components/common/Tooltip';
import { useVM } from '@/hooks/useVM';
import { useNotification } from '@/hooks/useNotification';
import { certificateService } from '@/services/certificate.service';
import { ShieldCheck, ShieldAlert, Key, Lock, Unlock } from 'lucide-react';

const SecurityTab = ({ vmId }) => {
  const { vm } = useVM(vmId);
  const { showNotification } = useNotification();
  const [securityDetails, setSecurityDetails] = useState({
    firewallRules: [],
    sshCertificates: [],
    securityGroups: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSecurityDetails = async () => {
      try {
        setIsLoading(true);
        // Fetch security details for the specific VM
        const details = await certificateService.getVMSecurityDetails(vmId);
        setSecurityDetails(details);
        setIsLoading(false);
      } catch (error) {
        showNotification({
          type: 'error',
          message: 'Failed to fetch security details',
          description: error.message
        });
        setIsLoading(false);
      }
    };

    fetchSecurityDetails();
  }, [vmId]);

  const handleRotateCertificate = async (certificateId) => {
    try {
      await certificateService.rotateCertificate(vmId, certificateId);
      showNotification({
        type: 'success',
        message: 'Certificate rotated successfully'
      });
      // Refresh security details
      const details = await certificateService.getVMSecurityDetails(vmId);
      setSecurityDetails(details);
    } catch (error) {
      showNotification({
        type: 'error',
        message: 'Failed to rotate certificate',
        description: error.message
      });
    }
  };

  const renderSecurityStatus = () => {
    // Determine overall security status based on firewall rules and certificates
    const hasSecurityIssues = 
      securityDetails.firewallRules.some(rule => rule.status === 'risky') ||
      securityDetails.sshCertificates.some(cert => cert.status === 'expired');

    return (
      <div className="flex items-center mb-4">
        {hasSecurityIssues ? (
          <ShieldAlert className="text-red-500 mr-2" />
        ) : (
          <ShieldCheck className="text-green-500 mr-2" />
        )}
        <span className={`font-semibold ${hasSecurityIssues ? 'text-red-500' : 'text-green-500'}`}>
          {hasSecurityIssues ? 'Security Risks Detected' : 'All Security Measures Intact'}
        </span>
      </div>
    );
  };

  const firewallColumns = [
    {
      title: 'Port',
      dataIndex: 'port',
      key: 'port'
    },
    {
      title: 'Protocol',
      dataIndex: 'protocol',
      key: 'protocol'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span className={`
          px-2 py-1 rounded 
          ${status === 'open' ? 'bg-red-100 text-red-800' : 
            status === 'restricted' ? 'bg-yellow-100 text-yellow-800' : 
            'bg-green-100 text-green-800'}
        `}>
          {status}
        </span>
      )
    }
  ];

  const certificateColumns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <div className="flex items-center">
          <Key className="mr-2" />
          {type}
        </div>
      )
    },
    {
      title: 'Issued Date',
      dataIndex: 'issuedDate',
      key: 'issuedDate'
    },
    {
      title: 'Expiration',
      dataIndex: 'expirationDate',
      key: 'expirationDate',
      render: (date, record) => (
        <span className={`
          ${record.status === 'expired' ? 'text-red-500' : 'text-green-500'}
        `}>
          {date}
        </span>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <Tooltip title="Rotate Certificate">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleRotateCertificate(record.id)}
            >
              <Lock className="mr-2" /> Rotate
            </Button>
          </Tooltip>
        </div>
      )
    }
  ];

  const securityGroupColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'Rules Count',
      dataIndex: 'rulesCount',
      key: 'rulesCount'
    }
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Security Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {renderSecurityStatus()}
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Firewall Rules</h3>
              <Table 
                columns={firewallColumns}
                dataSource={securityDetails.firewallRules}
                loading={isLoading}
                emptyText="No firewall rules found"
              />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">SSH Certificates</h3>
              <Table 
                columns={certificateColumns}
                dataSource={securityDetails.sshCertificates}
                loading={isLoading}
                emptyText="No SSH certificates found"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Groups</CardTitle>
        </CardHeader>
        <CardContent>
          <Table 
            columns={securityGroupColumns}
            dataSource={securityDetails.securityGroups}
            loading={isLoading}
            emptyText="No security groups found"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityTab;