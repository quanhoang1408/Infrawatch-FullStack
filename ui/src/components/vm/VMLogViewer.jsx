// VMLogViewer.jsx
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Card, Button, Spinner } from '../common';

/**
 * Component to display VM logs
 * @param {string} vmId - VM ID
 * @param {array} logs - Log entries
 * @param {boolean} loading - Loading state
 * @param {function} onFetchLogs - Handler to fetch logs
 * @param {function} onRefresh - Handler to refresh logs
 */
const VMLogViewer = ({
  vmId,
  logs = [],
  loading = false,
  onFetchLogs,
  onRefresh,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-vm-log-viewer';
  const classes = [baseClass, className].filter(Boolean).join(' ');
  
  const [filter, setFilter] = useState('all');
  const logContainerRef = useRef(null);
  
  // Fetch logs when component mounts
  useEffect(() => {
    onFetchLogs?.(vmId);
  }, [vmId]);
  
  // Auto-scroll to bottom when logs change
  useEffect(() => {
    if (logContainerRef.current && !loading) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, loading]);
  
  // Filter logs by level
  const filteredLogs = filter === 'all'
    ? logs
    : logs.filter(log => log.level === filter);
  
  // Handle refresh button click
  const handleRefresh = () => {
    onRefresh?.(vmId);
  };
  
  // Get CSS class for log level
  const getLogLevelClass = (level) => {
    const levelClasses = {
      'info': `${baseClass}__log--info`,
      'warning': `${baseClass}__log--warning`,
      'error': `${baseClass}__log--error`,
      'debug': `${baseClass}__log--debug`
    };
    
    return levelClasses[level] || '';
  };
  
  return (
    <Card
      title="VM Logs"
      className={classes}
      actions={
        <Button
          variant="text"
          size="sm"
          icon={<i className="icon-refresh" />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      }
      {...rest}
    >
      <div className={`${baseClass}__filters`}>
        <div className={`${baseClass}__filter-buttons`}>
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'info' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('info')}
          >
            Info
          </Button>
          <Button
            variant={filter === 'warning' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('warning')}
          >
            Warning
          </Button>
          <Button
            variant={filter === 'error' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('error')}
          >
            Error
          </Button>
          <Button
            variant={filter === 'debug' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('debug')}
          >
            Debug
          </Button>
        </div>
      </div>
      
      <div className={`${baseClass}__log-container`} ref={logContainerRef}>
        {loading ? (
          <div className={`${baseClass}__loading`}>
            <Spinner size="md" />
            <div className={`${baseClass}__loading-text`}>Loading logs...</div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className={`${baseClass}__empty`}>
            <div className={`${baseClass}__empty-icon`}>
              <i className="icon-file-text" />
            </div>
            <div className={`${baseClass}__empty-text`}>No logs available</div>
          </div>
        ) : (
          <div className={`${baseClass}__logs`}>
            {filteredLogs.map((log, index) => (
              <div
                key={`log-${index}`}
                className={`${baseClass}__log ${getLogLevelClass(log.level)}`}
              >
                <div className={`${baseClass}__log-timestamp`}>
                  {new Date(log.timestamp).toLocaleString()}
                </div>
                <div className={`${baseClass}__log-level`}>
                  [{log.level.toUpperCase()}]
                </div>
                <div className={`${baseClass}__log-message`}>
                  {log.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

VMLogViewer.propTypes = {
  vmId: PropTypes.string.isRequired,
  logs: PropTypes.arrayOf(
    PropTypes.shape({
      timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]).isRequired,
      level: PropTypes.oneOf(['info', 'warning', 'error', 'debug']).isRequired,
      message: PropTypes.string.isRequired
    })
  ),
  loading: PropTypes.bool,
  onFetchLogs: PropTypes.func,
  onRefresh: PropTypes.func,
  className: PropTypes.string
};

export default VMLogViewer;
