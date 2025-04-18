import React from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import { formatBytes, formatDate } from '../../utils/format.utils';

// Temporary placeholders for VM components
const VMStatusBadge = ({ status }) => (
  <StatusBadge
    status={status === 'running' ? 'success' : status === 'stopped' ? 'default' : 'warning'}
    text={status}
  />
);

const ProviderIcon = ({ provider, size }) => (
  <span style={{ marginRight: '8px' }}>🖥️</span>
);

const InfoTab = ({ vm, onAction }) => {
  const isRunning = vm.status === 'running';

  // Helper function to format uptime
  const formatUptime = (seconds) => {
    if (!seconds || seconds <= 0) return 'Not available';

    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts = [];
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);

    return parts.join(', ');
  };

  return (
    <div className="info-tab">
      <div className="actions-container">
        <Button
          disabled={isRunning}
          onClick={() => onAction('start')}
          variant="primary"
          icon="power"
        >
          Start
        </Button>
        <Button
          disabled={!isRunning}
          onClick={() => onAction('stop')}
          variant="danger"
          icon="power-off"
        >
          Stop
        </Button>
        <Button
          disabled={!isRunning}
          onClick={() => onAction('restart')}
          variant="warning"
          icon="refresh"
        >
          Restart
        </Button>
        <Button
          disabled={!isRunning}
          icon="terminal"
          variant="secondary"
          href={`/terminal/${vm.id}`}
        >
          SSH Terminal
        </Button>
      </div>

      <div className="info-grid">
        <Card title="General Information">
          <div className="info-row">
            <div className="info-label">Name</div>
            <div className="info-value">{vm.name}</div>
          </div>
          <div className="info-row">
            <div className="info-label">ID</div>
            <div className="info-value">{vm.id}</div>
          </div>
          <div className="info-row">
            <div className="info-label">Status</div>
            <div className="info-value">
              <VMStatusBadge status={vm.status} />
            </div>
          </div>
          <div className="info-row">
            <div className="info-label">Provider</div>
            <div className="info-value provider-value">
              <ProviderIcon provider={vm.provider} size={20} />
              {vm.provider}
            </div>
          </div>
          <div className="info-row">
            <div className="info-label">Region</div>
            <div className="info-value">{vm.region || 'N/A'}</div>
          </div>
          <div className="info-row">
            <div className="info-label">Created On</div>
            <div className="info-value">{formatDate(vm.createdAt)}</div>
          </div>
          <div className="info-row">
            <div className="info-label">Last Modified</div>
            <div className="info-value">{formatDate(vm.updatedAt)}</div>
          </div>
          <div className="info-row">
            <div className="info-label">Uptime</div>
            <div className="info-value">{isRunning ? formatUptime(vm.uptime) : 'Not running'}</div>
          </div>
        </Card>

        <Card title="Hardware Specifications">
          <div className="info-row">
            <div className="info-label">CPU</div>
            <div className="info-value">{vm.cpu} vCPUs</div>
          </div>
          <div className="info-row">
            <div className="info-label">Memory</div>
            <div className="info-value">{formatBytes(vm.memory * 1024 * 1024)}</div>
          </div>
          <div className="info-row">
            <div className="info-label">Storage</div>
            <div className="info-value">{formatBytes(vm.storage * 1024 * 1024 * 1024)}</div>
          </div>
          <div className="info-row">
            <div className="info-label">Instance Type</div>
            <div className="info-value">{vm.instanceType || 'Custom'}</div>
          </div>
        </Card>

        <Card title="Network Information">
          <div className="info-row">
            <div className="info-label">Public IP</div>
            <div className="info-value">
              {vm.publicIp || 'N/A'}
              {vm.publicIp && (
                <Button
                  size="small"
                  variant="text"
                  icon="copy"
                  onClick={() => navigator.clipboard.writeText(vm.publicIp)}
                  title="Copy to clipboard"
                />
              )}
            </div>
          </div>
          <div className="info-row">
            <div className="info-label">Private IP</div>
            <div className="info-value">
              {vm.privateIp || 'N/A'}
              {vm.privateIp && (
                <Button
                  size="small"
                  variant="text"
                  icon="copy"
                  onClick={() => navigator.clipboard.writeText(vm.privateIp)}
                  title="Copy to clipboard"
                />
              )}
            </div>
          </div>
          <div className="info-row">
            <div className="info-label">DNS Name</div>
            <div className="info-value">{vm.dnsName || 'N/A'}</div>
          </div>
          <div className="info-row">
            <div className="info-label">Security Group</div>
            <div className="info-value">{vm.securityGroup || 'N/A'}</div>
          </div>
        </Card>

        <Card title="Operating System">
          <div className="info-row">
            <div className="info-label">OS Type</div>
            <div className="info-value">{vm.osType || 'N/A'}</div>
          </div>
          <div className="info-row">
            <div className="info-label">OS Version</div>
            <div className="info-value">{vm.osVersion || 'N/A'}</div>
          </div>
          <div className="info-row">
            <div className="info-label">Kernel</div>
            <div className="info-value">{vm.kernel || 'N/A'}</div>
          </div>
        </Card>

        <Card title="Tags">
          {vm.tags && vm.tags.length > 0 ? (
            <div className="tags-container">
              {vm.tags.map((tag, index) => (
                <StatusBadge key={index} status="info" text={tag} />
              ))}
            </div>
          ) : (
            <div className="empty-tags">No tags assigned</div>
          )}
        </Card>

        <Card title="Additional Information">
          <div className="info-row">
            <div className="info-label">Description</div>
            <div className="info-value description-value">
              {vm.description || 'No description available'}
            </div>
          </div>
          <div className="info-row">
            <div className="info-label">Owner</div>
            <div className="info-value">{vm.owner || 'N/A'}</div>
          </div>
          <div className="info-row">
            <div className="info-label">Project</div>
            <div className="info-value">{vm.project || 'N/A'}</div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InfoTab;