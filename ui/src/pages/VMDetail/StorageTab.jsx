import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Spinner } from '../../components/common';
import { PieChart } from '../../components/charts';

/**
 * Component tab thông tin lưu trữ máy ảo
 * 
 * @param {Object} props - Props component
 * @param {Object} props.vm - Thông tin máy ảo
 * @returns {JSX.Element} Component tab lưu trữ
 */
const StorageTab = ({ vm }) => {
  const [disks, setDisks] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);
  const [attachingDisk, setAttachingDisk] = useState(false);
  const [newSnapshot, setNewSnapshot] = useState({
    name: '',
    description: ''
  });
  const [diskUsageData, setDiskUsageData] = useState([]);

  // Tải dữ liệu lưu trữ khi component mount
  useEffect(() => {
    const fetchStorageData = async () => {
      setLoading(true);
      try {
        // Giả lập API endpoint
        const response = await fetch(`/api/vms/${vm.id}/storage`);
        if (!response.ok) {
          throw new Error('Không thể tải dữ liệu lưu trữ');
        }
        
        const data = await response.json();
        setDisks(data.disks || []);
        setSnapshots(data.snapshots || []);
        
        // Chuẩn bị dữ liệu cho biểu đồ
        prepareChartData(data.disks);
        
      } catch (err) {
        console.error('Error fetching storage data:', err);
        setError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu lưu trữ');
      } finally {
        setLoading(false);
      }
    };

    // Giả lập fetch API
    setTimeout(() => {
      // Giả lập dữ liệu
      const mockDisks = [
        {
          id: 'd-1',
          name: 'Root Disk',
          device: '/dev/sda',
          type: 'SSD',
          size: 100,
          used: 45,
          status: 'attached',
          isRoot: true,
          createdAt: '2023-02-15T10:30:00Z'
        },
        {
          id: 'd-2',
          name: 'Data Disk',
          device: '/dev/sdb',
          type: 'SSD',
          size: 500,
          used: 220,
          status: 'attached',
          isRoot: false,
          createdAt: '2023-02-15T10:35:00Z'
        }
      ];
      
      const mockSnapshots = [
        {
          id: 's-1',
          name: 'Pre-update snapshot',
          description: 'Snapshot before system update',
          diskId: 'd-1',
          size: 42,
          status: 'completed',
          createdAt: '2023-03-05T14:20:00Z'
        },
        {
          id: 's-2',
          name: 'Weekly backup',
          description: 'Regular weekly backup',
          diskId: 'd-1',
          size: 45,
          status: 'completed',
          createdAt: '2023-03-12T02:00:00Z'
        }
      ];
      
      setDisks(mockDisks);
      setSnapshots(mockSnapshots);
      
      // Chuẩn bị dữ liệu cho biểu đồ
      prepareChartData(mockDisks);
      
      setLoading(false);
    }, 1000);
    
  }, [vm.id]);

  /**
   * Chuẩn bị dữ liệu cho biểu đồ
   * 
   * @param {Array} disksData - Dữ liệu các đĩa
   */
  const prepareChartData = (disksData) => {
    if (!disksData || disksData.length === 0) return;
    
    const chartData = disksData.map(disk => ({
      name: disk.name,
      used: disk.used,
      free: disk.size - disk.used
    }));
    
    // Tạo dữ liệu cho biểu đồ tròn
    const pieData = [];
    chartData.forEach(disk => {
      pieData.push(
        { name: `${disk.name} (Đã dùng)`, value: disk.used, color: '#f44336' },
        { name: `${disk.name} (Trống)`, value: disk.free, color: '#4caf50' }
      );
    });
    
    setDiskUsageData(pieData);
  };

  /**
   * Tạo một snapshot mới
   */
  const handleCreateSnapshot = () => {
    if (!newSnapshot.name) {
      alert('Vui lòng nhập tên snapshot');
      return;
    }
    
    setCreatingSnapshot(true);
    
    // Giả lập API call
    setTimeout(() => {
      const newSnap = {
        id: `s-${Date.now()}`,
        name: newSnapshot.name,
        description: newSnapshot.description,
        diskId: 'd-1', // Mặc định disk đầu tiên
        size: disks[0]?.used || 0,
        status: 'completed',
        createdAt: new Date().toISOString()
      };
      
      setSnapshots([newSnap, ...snapshots]);
      setNewSnapshot({ name: '', description: '' });
      setCreatingSnapshot(false);
    }, 2000);
  };

  /**
   * Định dạng kích thước
   * 
   * @param {number} sizeGB - Kích thước tính bằng GB
   * @returns {string} Kích thước đã định dạng
   */
  const formatSize = (sizeGB) => {
    if (sizeGB < 1) {
      return `${Math.round(sizeGB * 1024)} MB`;
    } else if (sizeGB >= 1024) {
      return `${(sizeGB / 1024).toFixed(2)} TB`;
    } else {
      return `${sizeGB} GB`;
    }
  };

  /**
   * Định dạng thời gian
   * 
   * @param {string} dateString - Chuỗi thời gian
   * @returns {string} Thời gian đã định dạng
   */
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Nếu đang tải
  if (loading && !disks.length && !snapshots.length) {
    return (
      <div className="storage-tab">
        <div className="loading-container">
          <Spinner size="large" />
          <p>Đang tải thông tin lưu trữ...</p>
        </div>
      </div>
    );
  }

  // Nếu có lỗi
  if (error) {
    return (
      <div className="storage-tab">
        <div className="error-container">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
          <button 
            className="retry-btn"
            onClick={() => window.location.reload()}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="storage-tab">
      <div className="disks-section">
        <Card className="disks-card">
          <CardHeader>
            <CardTitle>Đĩa lưu trữ</CardTitle>
            <button className="attach-disk-btn">
              <i className="fas fa-plus"></i>
              <span>Gắn đĩa mới</span>
            </button>
          </CardHeader>
          <CardContent>
            {disks.length === 0 ? (
              <div className="empty-disks">
                <i className="fas fa-hdd"></i>
                <p>Không có đĩa lưu trữ nào</p>
              </div>
            ) : (
              <div className="disks-list">
                {disks.map((disk) => (
                  <div key={disk.id} className="disk-item">
                    <div className="disk-header">
                      <div className="disk-name">
                        <i className={`fas fa-${disk.isRoot ? 'server' : 'hdd'}`}></i>
                        <span>{disk.name}</span>
                        {disk.isRoot && <span className="root-badge">Root</span>}
                      </div>
                      <div className="disk-status">
                        <span className={`status-indicator ${disk.status}`}></span>
                        <span className="status-text">{disk.status}</span>
                      </div>
                    </div>
                    
                    <div className="disk-details">
                      <div className="detail-group">
                        <div className="detail-label">Device</div>
                        <div className="detail-value">{disk.device}</div>
                      </div>
                      
                      <div className="detail-group">
                        <div className="detail-label">Loại</div>
                        <div className="detail-value">{disk.type}</div>
                      </div>
                      
                      <div className="detail-group">
                        <div className="detail-label">Kích thước</div>
                        <div className="detail-value">{formatSize(disk.size)}</div>
                      </div>
                      
                      <div className="detail-group">
                        <div className="detail-label">Đã sử dụng</div>
                        <div className="detail-value">
                          {formatSize(disk.used)} ({Math.round((disk.used / disk.size) * 100)}%)
                        </div>
                      </div>
                      
                      <div className="detail-group">
                        <div className="detail-label">Còn trống</div>
                        <div className="detail-value">{formatSize(disk.size - disk.used)}</div>
                      </div>
                      
                      <div className="disk-usage-bar">
                        <div 
                          className="usage-fill"
                          style={{width: `${(disk.used / disk.size) * 100}%`}}
                        ></div>
                      </div>
                      
                      <div className="disk-actions">
                        <button className="action-btn" disabled={disk.isRoot}>
                          <i className="fas fa-eject"></i>
                          <span>Tháo gỡ</span>
                        </button>
                        <button className="action-btn">
                          <i className="fas fa-camera"></i>
                          <span>Tạo snapshot</span>
                        </button>
                        <button className="action-btn" disabled={disk.isRoot}>
                          <i className="fas fa-trash-alt"></i>
                          <span>Xóa</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="disk-usage-section">
        <Card className="disk-usage-card">
          <CardHeader>
            <CardTitle>Tình trạng sử dụng đĩa</CardTitle>
          </CardHeader>
          <CardContent>
            {diskUsageData.length === 0 ? (
              <div className="empty-chart">
                <i className="fas fa-chart-pie"></i>
                <p>Không có dữ liệu</p>
              </div>
            ) : (
              <div className="disk-usage-chart">
                <PieChart
                  data={diskUsageData}
                  nameKey="name"
                  dataKey="value"
                  height={300}
                  showLegend={true}
                  colors={diskUsageData.map(item => item.color)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="snapshots-section">
        <Card className="snapshots-card">
          <CardHeader>
            <CardTitle>Snapshots</CardTitle>
            <button 
              className="create-snapshot-btn"
              onClick={() => document.getElementById('snapshot-modal').classList.add('open')}
            >
              <i className="fas fa-camera"></i>
              <span>Tạo snapshot</span>
            </button>
          </CardHeader>
          <CardContent>
            {snapshots.length === 0 ? (
              <div className="empty-snapshots">
                <i className="fas fa-camera"></i>
                <p>Không có snapshot nào</p>
                <p className="hint">Snapshots giúp bạn lưu trữ trạng thái hiện tại của máy ảo và có thể khôi phục lại sau này</p>
              </div>
            ) : (
              <div className="snapshots-table-container">
                <table className="snapshots-table">
                  <thead>
                    <tr>
                      <th>Tên</th>
                      <th>Mô tả</th>
                      <th>Đĩa nguồn</th>
                      <th>Kích thước</th>
                      <th>Ngày tạo</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshots.map((snapshot) => {
                      const sourceDisk = disks.find(d => d.id === snapshot.diskId);
                      return (
                        <tr key={snapshot.id}>
                          <td className="snapshot-name">{snapshot.name}</td>
                          <td className="snapshot-desc">{snapshot.description || '-'}</td>
                          <td>{sourceDisk?.name || 'N/A'}</td>
                          <td>{formatSize(snapshot.size)}</td>
                          <td>{formatDateTime(snapshot.createdAt)}</td>
                          <td>
                            <span className={`status-badge ${snapshot.status}`}>
                              {snapshot.status}
                            </span>
                          </td>
                          <td>
                            <div className="snapshot-actions">
                              <button className="table-action-btn" title="Khôi phục">
                                <i className="fas fa-undo"></i>
                              </button>
                              <button className="table-action-btn" title="Tạo VM mới">
                                <i className="fas fa-clone"></i>
                              </button>
                              <button className="table-action-btn" title="Xóa">
                                <i className="fas fa-trash-alt"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal tạo snapshot */}
      <div id="snapshot-modal" className="modal">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Tạo snapshot mới</h3>
            <button
              className="close-btn"
              onClick={() => document.getElementById('snapshot-modal').classList.remove('open')}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="snapshot-name">Tên snapshot*</label>
              <input
                type="text"
                id="snapshot-name"
                value={newSnapshot.name}
                onChange={e => setNewSnapshot({...newSnapshot, name: e.target.value})}
                placeholder="Nhập tên snapshot"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="snapshot-desc">Mô tả</label>
              <textarea
                id="snapshot-desc"
                value={newSnapshot.description}
                onChange={e => setNewSnapshot({...newSnapshot, description: e.target.value})}
                placeholder="Mô tả snapshot (tùy chọn)"
                rows={3}
              ></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="snapshot-disk">Đĩa nguồn</label>
              <select id="snapshot-disk" defaultValue={disks[0]?.id}>
                {disks.map(disk => (
                  <option key={disk.id} value={disk.id}>
                    {disk.name} ({formatSize(disk.size)})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-notice">
              <i className="fas fa-info-circle"></i>
              <p>
                Snapshot sẽ lưu trữ trạng thái hiện tại của đĩa. Quá trình này có thể mất một vài phút 
                tùy thuộc vào kích thước đĩa. Máy ảo vẫn hoạt động bình thường trong quá trình tạo snapshot.
              </p>
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="cancel-btn"
              onClick={() => document.getElementById('snapshot-modal').classList.remove('open')}
            >
              Hủy
            </button>
            <button
              className="create-btn"
              onClick={handleCreateSnapshot}
              disabled={creatingSnapshot || !newSnapshot.name}
            >
              {creatingSnapshot ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Đang tạo...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-camera"></i>
                  <span>Tạo snapshot</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorageTab;