import React, { useState } from 'react';
import { useVM } from '../../hooks';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common';
import { VMActions } from '../../components/vm';

/**
 * Component tab thông tin cơ bản của máy ảo
 * 
 * @param {Object} props - Props component
 * @param {Object} props.vm - Thông tin máy ảo
 * @returns {JSX.Element} Component tab thông tin
 */
const InfoTab = ({ vm }) => {
  const { updateVM } = useVM();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [newName, setNewName] = useState(vm.name);
  const [newDesc, setNewDesc] = useState(vm.description || '');
  const [saving, setSaving] = useState(false);

  /**
   * Lưu thông tin đã chỉnh sửa
   * 
   * @param {string} field - Trường cần cập nhật
   * @param {string} value - Giá trị mới
   */
  const handleSave = async (field, value) => {
    if (!value.trim()) return;
    
    setSaving(true);
    try {
      await updateVM(vm.id, { [field]: value });
      
      // Cập nhật UI sau khi lưu thành công
      if (field === 'name') {
        setIsEditingName(false);
      } else if (field === 'description') {
        setIsEditingDesc(false);
      }
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Định dạng thời gian
   * 
   * @param {string} dateString - Chuỗi thời gian
   * @returns {string} Thời gian đã định dạng
   */
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  /**
   * Chuyển đổi thời gian chạy từ giây sang định dạng dễ đọc
   * 
   * @param {number} seconds - Số giây
   * @returns {string} Thời gian chạy đã định dạng
   */
  const formatUptime = (seconds) => {
    if (!seconds || seconds <= 0) return 'Không có dữ liệu';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days} ngày`);
    if (hours > 0) parts.push(`${hours} giờ`);
    if (minutes > 0) parts.push(`${minutes} phút`);
    
    return parts.join(', ');
  };

  /**
   * Định dạng kích thước ổ đĩa
   * 
   * @param {number} sizeInGB - Kích thước tính bằng GB
   * @returns {string} Kích thước đã định dạng
   */
  const formatDiskSize = (sizeInGB) => {
    if (!sizeInGB && sizeInGB !== 0) return 'N/A';
    
    if (sizeInGB < 1) {
      return `${Math.round(sizeInGB * 1024)} MB`;
    } else if (sizeInGB >= 1024) {
      return `${(sizeInGB / 1024).toFixed(2)} TB`;
    } else {
      return `${sizeInGB} GB`;
    }
  };

  /**
   * Định dạng thông tin tài nguyên
   * 
   * @param {Object} specs - Thông số tài nguyên
   * @returns {JSX.Element} Phần tử HTML hiển thị thông tin tài nguyên
   */
  const renderSpecs = (specs) => {
    if (!specs) return <span>Không có dữ liệu</span>;
    
    return (
      <div className="vm-specs">
        <div className="spec-item">
          <span className="spec-label">CPU:</span>
          <span className="spec-value">{specs.cpu || 'N/A'} vCPU</span>
        </div>
        <div className="spec-item">
          <span className="spec-label">RAM:</span>
          <span className="spec-value">{specs.memory || 'N/A'} GB</span>
        </div>
        <div className="spec-item">
          <span className="spec-label">Ổ đĩa:</span>
          <span className="spec-value">{formatDiskSize(specs.disk)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="info-tab">
      <div className="info-grid">
        <Card className="basic-info-card">
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
            <VMActions vm={vm} showLabel={false} />
          </CardHeader>
          <CardContent>
            <div className="info-group">
              <div className="info-label">ID</div>
              <div className="info-value id-value">{vm.id}</div>
            </div>

            <div className="info-group">
              <div className="info-label">Tên</div>
              <div className="info-value editable">
                {isEditingName ? (
                  <div className="edit-controls">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="edit-input"
                      autoFocus
                    />
                    <div className="edit-actions">
                      <button 
                        className="save-btn" 
                        onClick={() => handleSave('name', newName)}
                        disabled={saving || !newName.trim()}
                      >
                        {saving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
                      </button>
                      <button 
                        className="cancel-btn" 
                        onClick={() => {
                          setIsEditingName(false);
                          setNewName(vm.name);
                        }}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span>{vm.name}</span>
                    <button 
                      className="edit-btn" 
                      onClick={() => setIsEditingName(true)}
                      aria-label="Chỉnh sửa tên"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="info-group">
              <div className="info-label">Mô tả</div>
              <div className="info-value editable">
                {isEditingDesc ? (
                  <div className="edit-controls">
                    <textarea
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="edit-textarea"
                      rows={3}
                      autoFocus
                    />
                    <div className="edit-actions">
                      <button 
                        className="save-btn" 
                        onClick={() => handleSave('description', newDesc)}
                        disabled={saving}
                      >
                        {saving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
                      </button>
                      <button 
                        className="cancel-btn" 
                        onClick={() => {
                          setIsEditingDesc(false);
                          setNewDesc(vm.description || '');
                        }}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span>{vm.description || 'Không có mô tả'}</span>
                    <button 
                      className="edit-btn" 
                      onClick={() => setIsEditingDesc(true)}
                      aria-label="Chỉnh sửa mô tả"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="info-group">
              <div className="info-label">Trạng thái</div>
              <div className="info-value">
                <span className={`status-badge ${vm.status}`}>{getStatusText(vm.status)}</span>
              </div>
            </div>

            <div className="info-group">
              <div className="info-label">Nhà cung cấp</div>
              <div className="info-value">
                <div className="provider-info">
                  <img 
                    src={`/images/providers/${vm.provider.toLowerCase()}.svg`} 
                    alt={vm.provider}
                    className="provider-icon"
                  />
                  <span>{vm.provider}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="network-info-card">
          <CardHeader>
            <CardTitle>Thông tin mạng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="info-group">
              <div className="info-label">IP công khai</div>
              <div className="info-value copyable">
                <span>{vm.publicIp || 'Không có'}</span>
                {vm.publicIp && (
                  <button 
                    className="copy-btn" 
                    onClick={() => navigator.clipboard.writeText(vm.publicIp)}
                    aria-label="Sao chép IP"
                  >
                    <i className="fas fa-copy"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="info-group">
              <div className="info-label">IP nội bộ</div>
              <div className="info-value copyable">
                <span>{vm.privateIp || 'Không có'}</span>
                {vm.privateIp && (
                  <button 
                    className="copy-btn" 
                    onClick={() => navigator.clipboard.writeText(vm.privateIp)}
                    aria-label="Sao chép IP"
                  >
                    <i className="fas fa-copy"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="info-group">
              <div className="info-label">DNS</div>
              <div className="info-value copyable">
                <span>{vm.dns || 'Không có'}</span>
                {vm.dns && (
                  <button 
                    className="copy-btn" 
                    onClick={() => navigator.clipboard.writeText(vm.dns)}
                    aria-label="Sao chép DNS"
                  >
                    <i className="fas fa-copy"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="info-group">
              <div className="info-label">Subnet</div>
              <div className="info-value">{vm.subnet || 'Không có'}</div>
            </div>

            <div className="info-group">
              <div className="info-label">Security Group</div>
              <div className="info-value">{vm.securityGroup || 'Không có'}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="specs-info-card">
          <CardHeader>
            <CardTitle>Cấu hình</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="info-group">
              <div className="info-label">Loại máy ảo</div>
              <div className="info-value">{vm.instanceType || 'Không có thông tin'}</div>
            </div>

            <div className="info-group">
              <div className="info-label">Cấu hình</div>
              <div className="info-value">{renderSpecs(vm.specs)}</div>
            </div>

            <div className="info-group">
              <div className="info-label">Hệ điều hành</div>
              <div className="info-value">{vm.os || 'Không có thông tin'}</div>
            </div>

            <div className="info-group">
              <div className="info-label">Vùng</div>
              <div className="info-value">{vm.region || 'Không có thông tin'}</div>
            </div>

            <div className="info-group">
              <div className="info-label">Khu vực</div>
              <div className="info-value">{vm.zone || 'Không có thông tin'}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="status-info-card">
          <CardHeader>
            <CardTitle>Thời gian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="info-group">
              <div className="info-label">Thời gian tạo</div>
              <div className="info-value">{formatDateTime(vm.createdAt)}</div>
            </div>

            <div className="info-group">
              <div className="info-label">Cập nhật lần cuối</div>
              <div className="info-value">{formatDateTime(vm.updatedAt)}</div>
            </div>

            <div className="info-group">
              <div className="info-label">Thời gian chạy</div>
              <div className="info-value">{formatUptime(vm.uptime)}</div>
            </div>

            <div className="info-group">
              <div className="info-label">Lần khởi động cuối</div>
              <div className="info-value">{formatDateTime(vm.lastStartedAt)}</div>
            </div>

            <div className="info-group">
              <div className="info-label">Lần dừng cuối</div>
              <div className="info-value">{formatDateTime(vm.lastStoppedAt)}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="tags-card">
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <button className="add-tag-btn">
              <i className="fas fa-plus"></i>
              <span>Thêm tag</span>
            </button>
          </CardHeader>
          <CardContent>
            {vm.tags && vm.tags.length > 0 ? (
              <div className="tag-list">
                {vm.tags.map((tag, index) => (
                  <div key={index} className="tag-item">
                    <span className="tag-key">{tag.key}:</span>
                    <span className="tag-value">{tag.value}</span>
                    <button className="remove-tag-btn" aria-label="Xóa tag">
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-tags">
                <i className="fas fa-tags"></i>
                <p>Chưa có tag nào</p>
                <p className="hint">Tags giúp bạn phân loại và quản lý máy ảo dễ dàng hơn</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/**
 * Lấy text hiển thị cho trạng thái máy ảo
 * 
 * @param {string} status - Trạng thái máy ảo
 * @returns {string} Text hiển thị
 */
function getStatusText(status) {
  switch (status) {
    case 'running': return 'Đang chạy';
    case 'stopped': return 'Đã dừng';
    case 'starting': return 'Đang khởi động';
    case 'stopping': return 'Đang dừng';
    case 'error': return 'Lỗi';
    default: return status || 'Không xác định';
  }
}

export default InfoTab;