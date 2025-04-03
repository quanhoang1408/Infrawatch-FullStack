import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useVM, useVMActions, useTheme } from '../../hooks';
import { PageHeader } from '../../components/layout';
import { VMTable } from '../../components/vm';
import { Spinner, EmptyState, ErrorState, Card, CardContent } from '../../components/common';
import FilterBar from './FilterBar';
import './VMList.scss';

/**
 * Component trang danh sách máy ảo
 * 
 * @returns {JSX.Element} Component trang danh sách máy ảo
 */
const VMList = () => {
  const { theme } = useTheme();
  const { 
    vms, 
    loading, 
    error, 
    filters,
    fetchVMs, 
    filterVMs, 
    clearFilters 
  } = useVM();
  const { startVM, stopVM, restartVM, deleteVM } = useVMActions();
  const [selectedVMs, setSelectedVMs] = useState([]);
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);

  // Tải danh sách máy ảo khi component mount
  useEffect(() => {
    fetchVMs();
  }, []);

  /**
   * Xử lý khi chọn/bỏ chọn máy ảo
   * 
   * @param {string} vmId - ID của máy ảo
   * @param {boolean} isSelected - Trạng thái chọn
   */
  const handleSelectVM = (vmId, isSelected) => {
    setSelectedVMs(prev => {
      if (isSelected) {
        return [...prev, vmId];
      } else {
        return prev.filter(id => id !== vmId);
      }
    });
  };

  /**
   * Xử lý khi chọn/bỏ chọn tất cả máy ảo
   * 
   * @param {boolean} isSelected - Trạng thái chọn
   */
  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedVMs(vms.map(vm => vm.id));
    } else {
      setSelectedVMs([]);
    }
  };

  /**
   * Xử lý các hành động trên máy ảo
   * 
   * @param {string} action - Hành động
   * @param {string} vmId - ID của máy ảo
   */
  const handleVMAction = async (action, vmId) => {
    try {
      switch (action) {
        case 'start':
          await startVM(vmId);
          break;
        case 'stop':
          await stopVM(vmId);
          break;
        case 'restart':
          await restartVM(vmId);
          break;
        case 'delete':
          await deleteVM(vmId);
          break;
        default:
          console.warn(`Unknown action: ${action}`);
      }
    } catch (err) {
      console.error(`Error performing action ${action} on VM ${vmId}:`, err);
    }
  };

  /**
   * Xử lý các hành động hàng loạt
   * 
   * @param {string} action - Hành động
   */
  const handleBulkAction = async (action) => {
    if (selectedVMs.length === 0) return;

    // Hiển thị xác nhận trước khi thực hiện hành động hàng loạt
    if (window.confirm(`Bạn có chắc chắn muốn ${getActionText(action)} ${selectedVMs.length} máy ảo đã chọn?`)) {
      // Thực hiện hành động trên tất cả máy ảo đã chọn
      for (const vmId of selectedVMs) {
        await handleVMAction(action, vmId);
      }
      // Xóa danh sách máy ảo đã chọn sau khi hoàn thành
      setSelectedVMs([]);
      setIsBulkActionsOpen(false);
    }
  };

  /**
   * Lấy text mô tả hành động
   * 
   * @param {string} action - Hành động
   * @returns {string} Text mô tả
   */
  const getActionText = (action) => {
    switch (action) {
      case 'start': return 'khởi động';
      case 'stop': return 'dừng';
      case 'restart': return 'khởi động lại';
      case 'delete': return 'xóa';
      default: return action;
    }
  };

  // Tạo các hành động cho trang
  const pageActions = [
    {
      label: "Tạo máy ảo mới",
      icon: "plus",
      primary: true,
      to: "/vms/new"
    },
    {
      label: "Làm mới",
      icon: "refresh-cw",
      onClick: fetchVMs
    }
  ];

  // Tạo các hành động hàng loạt
  const bulkActions = [
    {
      label: "Khởi động",
      icon: "play",
      onClick: () => handleBulkAction('start'),
      disabled: selectedVMs.length === 0
    },
    {
      label: "Dừng",
      icon: "stop-circle",
      onClick: () => handleBulkAction('stop'),
      disabled: selectedVMs.length === 0
    },
    {
      label: "Khởi động lại",
      icon: "refresh-cw",
      onClick: () => handleBulkAction('restart'),
      disabled: selectedVMs.length === 0
    },
    {
      label: "Xóa",
      icon: "trash-2",
      color: "danger",
      onClick: () => handleBulkAction('delete'),
      disabled: selectedVMs.length === 0
    }
  ];

  // Nếu đang tải
  if (loading && vms.length === 0) {
    return (
      <div className={`vm-list-page ${theme}`}>
        <PageHeader 
          title="Danh sách máy ảo"
          subtitle="Quản lý tất cả máy ảo của bạn"
          actions={pageActions}
        />
        <div className="loading-container">
          <Spinner size="large" />
          <p>Đang tải danh sách máy ảo...</p>
        </div>
      </div>
    );
  }

  // Nếu có lỗi
  if (error) {
    return (
      <div className={`vm-list-page ${theme}`}>
        <PageHeader 
          title="Danh sách máy ảo"
          subtitle="Quản lý tất cả máy ảo của bạn"
          actions={pageActions}
        />
        <ErrorState 
          title="Không thể tải danh sách máy ảo" 
          message={error}
          action={{
            label: "Thử lại",
            onClick: fetchVMs
          }}
        />
      </div>
    );
  }

  // Nếu không có máy ảo nào
  if (!loading && vms.length === 0) {
    return (
      <div className={`vm-list-page ${theme}`}>
        <PageHeader 
          title="Danh sách máy ảo"
          subtitle="Quản lý tất cả máy ảo của bạn"
          actions={pageActions}
        />
        <EmptyState
          icon="server"
          title="Chưa có máy ảo nào"
          message="Bạn chưa có máy ảo nào. Tạo máy ảo mới để bắt đầu."
          action={{
            label: "Tạo máy ảo mới",
            to: "/vms/new"
          }}
        />
      </div>
    );
  }

  return (
    <div className={`vm-list-page ${theme}`}>
      <PageHeader 
        title="Danh sách máy ảo"
        subtitle={`Quản lý tất cả máy ảo của bạn (${vms.length} máy ảo)`}
        actions={pageActions}
      />

      <Card className="vm-list-card">
        <FilterBar 
          filters={filters}
          onFilterChange={filterVMs}
          onClearFilters={clearFilters}
        />

        <div className="bulk-actions-container">
          <div className="selection-info">
            {selectedVMs.length > 0 ? (
              <span>Đã chọn {selectedVMs.length} máy ảo</span>
            ) : (
              <span>Chọn máy ảo để thực hiện hành động hàng loạt</span>
            )}
          </div>
          
          <div className="bulk-actions">
            <button 
              className={`bulk-actions-toggle ${isBulkActionsOpen ? 'open' : ''}`}
              onClick={() => setIsBulkActionsOpen(!isBulkActionsOpen)}
              disabled={selectedVMs.length === 0}
            >
              <i className="fas fa-cog"></i>
              <span>Hành động hàng loạt</span>
              <i className={`fas fa-chevron-${isBulkActionsOpen ? 'up' : 'down'}`}></i>
            </button>
            
            {isBulkActionsOpen && (
              <div className="bulk-actions-menu">
                {bulkActions.map((action, index) => (
                  <button
                    key={index}
                    className={`bulk-action-item ${action.color || ''}`}
                    onClick={action.onClick}
                    disabled={action.disabled}
                  >
                    <i className={`fas fa-${action.icon}`}></i>
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <CardContent className="vm-table-container">
          <VMTable 
            vms={vms}
            loading={loading}
            selectedVMs={selectedVMs}
            onSelectVM={handleSelectVM}
            onSelectAll={handleSelectAll}
            onVMAction={handleVMAction}
            isSelectable={true}
          />
        </CardContent>

        {loading && vms.length > 0 && (
          <div className="table-overlay">
            <Spinner size="medium" />
            <span>Đang cập nhật...</span>
          </div>
        )}
      </Card>
    </div>
  );
};

export default VMList;