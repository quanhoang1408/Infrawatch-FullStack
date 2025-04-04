import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import { ErrorState } from '../../components/common/ErrorState';
import { Search } from '../../components/common/Search';
import { EmptyState } from '../../components/common/EmptyState';
import { VMLogViewer } from '../../components/vm/VMLogViewer';
import { useVM } from '../../hooks/useVM';
import { formatDate } from '../../utils/format.utils';

const LogsTab = ({ vmId }) => {
  const { getVMLogs, loading, error } = useVM();
  
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLogType, setSelectedLogType] = useState('system');
  const [timeRange, setTimeRange] = useState('1d');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  
  const autoRefreshIntervalRef = useRef(null);
  const logsPerPage = 100;
  
  // Log types available for selection
  const logTypes = [
    { id: 'system', label: 'System Logs' },
    { id: 'application', label: 'Application Logs' },
    { id: 'security', label: 'Security Logs' },
    { id: 'ssh', label: 'SSH Logs' }
  ];
  
  // Time range options
  const timeRangeOptions = [
    { id: '1h', label: 'Last Hour' },
    { id: '6h', label: 'Last 6 Hours' },
    { id: '1d', label: 'Last Day' },
    { id: '7d', label: 'Last Week' },
    { id: '30d', label: 'Last Month' }
  ];
  
  // Log severity classes for styling
  const getSeverityClass = (severity) => {
    switch (severity.toLowerCase()) {
      case 'error':
        return 'log-severity-error';
      case 'warning':
        return 'log-severity-warning';
      case 'info':
        return 'log-severity-info';
      case 'debug':
        return 'log-severity-debug';
      default:
        return '';
    }
  };
  
  // Fetch logs based on current filters
  const fetchLogs = async () => {
    try {
      const logsData = await getVMLogs(vmId, {
        logType: selectedLogType,
        timeRange: timeRange,
        page: page,
        limit: logsPerPage
      });
      
      setLogs(logsData.logs);
      setTotalPages(Math.ceil(logsData.total / logsPerPage));
      
      // Apply search filter if active
      if (searchTerm) {
        filterLogs(logsData.logs, searchTerm);
      } else {
        setFilteredLogs(logsData.logs);
      }
    } catch (err) {
      console.error('Error fetching VM logs:', err);
    }
  };
  
  // Handle log filtering by search term
  const filterLogs = (logsToFilter, term) => {
    if (!term) {
      setFilteredLogs(logsToFilter);
      setSearchActive(false);
      return;
    }
    
    const filtered = logsToFilter.filter(log => 
      log.message.toLowerCase().includes(term.toLowerCase()) ||
      log.severity.toLowerCase().includes(term.toLowerCase())
    );
    
    setFilteredLogs(filtered);
    setSearchActive(true);
  };
  
  // Initial fetch and setup auto-refresh if enabled
  useEffect(() => {
    fetchLogs();
    
    // Setup auto-refresh
    if (isAutoRefresh) {
      autoRefreshIntervalRef.current = setInterval(() => {
        fetchLogs();
      }, 10000); // Refresh every 10 seconds
    }
    
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [vmId, selectedLogType, timeRange, page, isAutoRefresh]);
  
  // Handle search term changes
  useEffect(() => {
    filterLogs(logs, searchTerm);
  }, [searchTerm]);
  
  // Handle log type change
  const handleLogTypeChange = (type) => {
    setSelectedLogType(type);
    setPage(1);
  };
  
  // Handle time range change
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    setPage(1);
  };
  
  // Handle pagination
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };
  
  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setIsAutoRefresh(prev => !prev);
  };
  
  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setSearchActive(false);
    setFilteredLogs(logs);
  };
  
  // Download logs
  const downloadLogs = () => {
    const logsToDownload = searchActive ? filteredLogs : logs;
    const content = logsToDownload.map(log => 
      `[${log.timestamp}] [${log.severity}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${vmId}_${selectedLogType}_logs_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Loading state
  if (loading && !logs.length) {
    return (
      <div className="logs-loading">
        <Spinner />
        <p>Loading logs...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <ErrorState 
        title="Failed to load logs"
        message={error.message}
      />
    );
  }
  
  return (
    <div className="logs-tab">
      <div className="logs-controls">
        <div className="logs-filters">
          <div className="log-type-filter">
            <label>Log Type</label>
            <div className="log-type-buttons">
              {logTypes.map(type => (
                <Button
                  key={type.id}
                  variant={selectedLogType === type.id ? 'primary' : 'outline'}
                  size="small"
                  onClick={() => handleLogTypeChange(type.id)}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="time-range-filter">
            <label>Time Range</label>
            <select 
              value={timeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              className="time-range-select"
            >
              {timeRangeOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="logs-actions">
          <Search 
            placeholder="Search logs..."
            value={searchTerm}
            onChange={handleSearch}
            onClear={clearSearch}
          />
          
          <Button
            variant="secondary"
            icon={isAutoRefresh ? 'pause' : 'play'}
            onClick={toggleAutoRefresh}
            title={isAutoRefresh ? 'Pause auto-refresh' : 'Enable auto-refresh'}
          >
            {isAutoRefresh ? 'Pause' : 'Auto-refresh'}
          </Button>
          
          <Button
            variant="secondary"
            icon="download"
            onClick={downloadLogs}
            title="Download logs"
          >
            Download
          </Button>
          
          <Button
            variant="secondary"
            icon="refresh"
            onClick={fetchLogs}
            title="Refresh logs"
          >
            Refresh
          </Button>
        </div>
      </div>
      
      <Card title={`${logTypes.find(t => t.id === selectedLogType)?.label} ${searchActive ? `- Search Results (${filteredLogs.length})` : ''}`}>
        {loading && (
          <div className="logs-refreshing">
            <Spinner size="small" />
            <span>Refreshing logs...</span>
          </div>
        )}
        
        {(!filteredLogs || filteredLogs.length === 0) ? (
          <EmptyState
            title="No logs found"
            message={
              searchActive 
                ? `No logs matching "${searchTerm}"`
                : "No logs available for the selected time range"
            }
            action={
              searchActive && (
                <Button
                  variant="text"
                  onClick={clearSearch}
                >
                  Clear search
                </Button>
              )
            }
          />
        ) : (
          <VMLogViewer logs={filteredLogs} />
        )}
      </Card>
      
      {totalPages > 1 && (
        <div className="logs-pagination">
          <Button
            variant="text"
            disabled={page === 1}
            onClick={() => handlePageChange(1)}
          >
            First
          </Button>
          
          <Button
            variant="text"
            disabled={page === 1}
            onClick={() => handlePageChange(page - 1)}
          >
            Previous
          </Button>
          
          <span className="page-indicator">
            Page {page} of {totalPages}
          </span>
          
          <Button
            variant="text"
            disabled={page === totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            Next
          </Button>
          
          <Button
            variant="text"
            disabled={page === totalPages}
            onClick={() => handlePageChange(totalPages)}
          >
            Last
          </Button>
        </div>
      )}
    </div>
  );
};

export default LogsTab;