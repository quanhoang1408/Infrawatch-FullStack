import React, { useState, useEffect, useRef } from 'react';
import { useVM } from '../../hooks';
import { Card, CardHeader, CardTitle, CardContent, Spinner } from '../../components/common';

/**
 * Component tab logs máy ảo
 * 
 * @param {Object} props - Props component
 * @param {Object} props.vm - Thông tin máy ảo
 * @returns {JSX.Element} Component tab logs
 */
const LogsTab = ({ vm }) => {
  const { fetchVMLogs } = useVM();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logType, setLogType] = useState('system');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [limit, setLimit] = useState(100);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLogs, setFilteredLogs] = useState([]);
  const logContainerRef = useRef(null);
  const autoRefreshIntervalRef = useRef(null);

  // Tải logs khi component mount hoặc các tham số thay đổi
  useEffect(() => {
    loadLogs();
    
    // Thiết lập interval nếu autoRefresh được bật
    if (autoRefresh) {
      autoRefreshIntervalRef.current = setInterval(() => {
        loadLogs(false); // Không hiển thị loading để tránh nhấp nháy UI
      }, 10000); // Làm mới mỗi 10 giây
    }
    
    // Cleanup interval khi component unmount hoặc autoRefresh thay đổi
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [vm.id, logType, limit, autoRefresh]);

  // Lọc logs khi searchTerm hoặc logs thay đổi
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredLogs(logs);
      return;
    }
    
    const filtered = logs.filter(log => 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredLogs(filtered);
  }, [searchTerm, logs]);

  // Cuộn xuống cuối khi có logs mới và không đang tìm kiếm
  useEffect(() => {
    if (logContainerRef.current && !searchTerm && autoRefresh) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [filteredLogs, autoRefresh, searchTerm]);

  /**
   * Tải logs từ server
   * 
   * @param {boolean} showLoading - Có hiển thị trạng thái loading không
   */
  const loadLogs = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const logsData = await fetchVMLogs(vm.id, {
        limit,
        logType
      });
      
      setLogs(logsData);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Không thể tải logs. Vui lòng thử lại sau.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  /**
   * Làm mới logs
   */
  const handleRefresh = () => {
    loadLogs();
  };

  /**
   * Xử lý khi thay đổi loại log
   * 
   * @param {Event} e - Sự kiện change
   */
  const handleLogTypeChange = (e) => {
    setLogType(e.target.value);
  };

  /**
   * Xử lý khi thay đổi giới hạn logs
   * 
   * @param {Event} e - Sự kiện change
   */
  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
  };

  /**
   * Xử lý khi thay đổi trạng thái tự động làm mới
   */
  const handleAutoRefreshToggle = () => {
    setAutoRefresh(prev => !prev);
  };

  /**
   * Xử lý khi thay đổi text tìm kiếm
   * 
   * @param {Event} e - Sự kiện change
   */
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  /**
   * Xóa text tìm kiếm
   */
  const clearSearch = () => {
    setSearchTerm('');
  };

  /**
   * Lấy class CSS cho mức độ nghiêm trọng của log
   * 
   * @param {string} level - Mức độ nghiêm trọng
   * @returns {string} Tên class CSS
   */
  const getLogLevelClass = (level) => {
    switch (level.toLowerCase()) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'debug':
        return 'debug';
      default:
        return '';
    }
  };

  /**
   * Định dạng thời gian
   * 
   * @param {string} timestamp - Thời gian
   * @returns {string} Thời gian đã định dạng
   */
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  /**
   * Tạo đường dẫn để tải về logs
   * 
   * @returns {string} Đường dẫn tải logs
   */
  const getDownloadUrl = () => {
    return `/api/vms/${vm.id}/logs/download?type=${logType}&limit=${limit}`;
  };

  return (
    <div className="logs-tab">
      <div className="logs-controls">
        <div className="control-group">
          <label htmlFor="log-type">Loại log:</label>
          <select
            id="log-type"
            value={logType}
            onChange={handleLogTypeChange}
            className="log-type-select"
          >
            <option value="system">System</option>
            <option value="application">Application</option>
            <option value="security">Security</option>
            <option value="all">Tất cả</option>
          </select>
        </div>
        
        <div className="control-group">
          <label htmlFor="log-limit">Số lượng:</label>
          <select
            id="log-limit"
            value={limit}
            onChange={handleLimitChange}
            className="log-limit-select"
          >
            <option value={50}>50 dòng</option>
            <option value={100}>100 dòng</option>
            <option value={200}>200 dòng</option>
            <option value={500}>500 dòng</option>
          </select>
        </div>
        
        <div className="control-group auto-refresh">
          <label htmlFor="auto-refresh">
            <input
              type="checkbox"
              id="auto-refresh"
              checked={autoRefresh}
              onChange={handleAutoRefreshToggle}
            />
            <span>Tự động làm mới</span>
          </label>
        </div>
        
        <div className="control-actions">
          <button 
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={loading}
          >
            <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
            <span>Làm mới</span>
          </button>
          
          <a 
            href={getDownloadUrl()}
            className="download-btn"
            download
          >
            <i className="fas fa-download"></i>
            <span>Tải về</span>
          </a>
        </div>
      </div>
      
      <Card className="logs-card">
        <CardHeader>
          <CardTitle>
            Logs 
            {logType !== 'all' && <span className="log-type-badge">{logType}</span>}
          </CardTitle>
          <div className="search-container">
            <div className="search-input-wrapper">
              <i className="fas fa-search search-icon"></i>
              <input
                type="text"
                placeholder="Tìm kiếm logs..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
              {searchTerm && (
                <button
                  className="clear-search-btn"
                  onClick={clearSearch}
                  aria-label="Xóa tìm kiếm"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="search-result-count">
                Tìm thấy {filteredLogs.length} kết quả
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="logs-content">
          {loading && logs.length === 0 ? (
            <div className="logs-loading">
              <Spinner size="medium" />
              <p>Đang tải logs...</p>
            </div>
          ) : error ? (
            <div className="logs-error">
              <i className="fas fa-exclamation-circle"></i>
              <p>{error}</p>
              <button 
                className="retry-btn"
                onClick={handleRefresh}
              >
                Thử lại
              </button>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="logs-empty">
              <i className="fas fa-file-alt"></i>
              <p>Không có logs nào</p>
              {searchTerm ? (
                <p className="hint">Không tìm thấy kết quả phù hợp. Thử tìm kiếm với từ khóa khác.</p>
              ) : (
                <p className="hint">Chưa có logs nào được ghi cho máy ảo này.</p>
              )}
            </div>
          ) : (
            <div className="logs-container" ref={logContainerRef}>
              <table className="logs-table">
                <thead>
                  <tr>
                    <th className="time-col">Thời gian</th>
                    <th className="level-col">Mức độ</th>
                    <th className="source-col">Nguồn</th>
                    <th className="message-col">Nội dung</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, index) => (
                    <tr key={index} className={getLogLevelClass(log.level)}>
                      <td className="time-col">{formatTimestamp(log.timestamp)}</td>
                      <td className="level-col">
                        <span className={`level-badge ${getLogLevelClass(log.level)}`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="source-col">{log.source}</td>
                      <td className="message-col">{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LogsTab;