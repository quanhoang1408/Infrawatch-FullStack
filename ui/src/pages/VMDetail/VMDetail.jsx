import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useVM, useVMActions, useTheme } from '../../hooks';
import { PageHeader } from '../../components/layout';
import { VMDetailHeader } from '../../components/vm';
import { 
  Tabs, 
  Spinner, 
  ErrorState,
  ConfirmationDialog 
} from '../../components/common';
import InfoTab from './InfoTab';
import MonitoringTab from './MonitoringTab';
import LogsTab from './LogsTab';
import NetworkTab from './NetworkTab';
import StorageTab from './StorageTab';
import SecurityTab from './SecurityTab';
import './VMDetail.scss';

/**
 * Component trang chi tiết máy ảo
 * 
 * @returns {JSX.Element} Component trang chi tiết máy ảo
 */
const VMDetail = () => {
  const { vmId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const { 
    selectedVM, 
    loading, 
    error, 
    fetchVMById, 
    fetchVMStats 
  } = useVM();
  const { 
    startVM, 
    stopVM, 
    restartVM, 
    deleteVM, 
    actionInProgress 
  } = useVMActions();
  const [activeTab, setActiveTab] = useState('info');
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 giây
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    action: null,
    title: '',
    message: ''
  });

  // Lấy active tab từ URL nếu có
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab && ['info', 'monitoring', 'logs', 'network', 'storage', 'security'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location]);

  // Tải thông tin máy ảo khi component mount hoặc vmId thay đổi
  useEffect(() => {
    fetchVMById(vmId);
  }, [vmId, fetchVMById]);

  // Tải dữ liệu tài nguyên theo định kỳ nếu đang ở tab monitoring
  useEffect(() => {
    if (activeTab === 'monitoring' && vmId && refreshInterval > 0) {
      // Tải dữ liệu ngay lập tức
      fetchVMStats(vmId);
      
      // Thiết lập interval để tải dữ liệu định kỳ
      const intervalId = setInterval(() => {
        fetchVMStats(vmId);
      }, refreshInterval);
      
      // Xóa interval khi component unmount hoặc tab thay đổi
      return () => clearInterval(intervalId);
    }
  }, [activeTab, vmId, refreshInterval, fetchVMStats]);

  /**
   * Thay đổi tab và cập nhật URL
   * 
   * @param {string} tab - Tab mới
   */
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Cập nhật URL mà không reload trang
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', tab);
    navigate({
      pathname: location.pathname,
      search: searchParams.toString()
    }, { replace: true });
  };

  /**
   * Xử lý các hành động trên máy ảo
   * 
   * @param {string} action - Hành động cần thực hiện
   */
  const handleVMAction = async (action) => {
    try {
      switch (action) {
        case 'start':
          await startVM(vmId);
          break;
        case 'stop':
          setConfirmDialog({
            open: true,
            action: 'stop',
            title: 'Xác nhận dừng máy ảo',
            message: `Bạn có chắc chắn muốn dừng máy ảo "${selectedVM?.name}"? Các ứng dụng đang chạy có thể bị mất dữ liệu.`
          });
          break;
        case 'force-stop':
          setConfirmDialog({
            open: true,
            action: 'force-stop',
            title: 'Xác nhận buộc dừng máy ảo',
            message: `Cảnh báo: Bạn sắp buộc dừng máy ảo "${selectedVM?.name}". Hành động này tương đương với rút nguồn và có thể gây mất dữ liệu hoặc hỏng hệ thống. Tiếp tục?`
          });
          break;
        case 'restart':
          setConfirmDialog({
            open: true,
            action: 'restart',
            title: 'Xác nhận khởi động lại máy ảo',
            message: `Bạn có chắc chắn muốn khởi động lại máy ảo "${selectedVM?.name}"? Các ứng dụng đang chạy có thể bị mất dữ liệu nếu không được lưu.`
          });
          break;
        case 'delete':
          setConfirmDialog({
            open: true,
            action: 'delete',
            title: 'Xác nhận xóa máy ảo',
            message: `Cảnh báo: Bạn sắp xóa máy ảo "${selectedVM?.name}". Hành động này không thể hoàn tác và tất cả dữ liệu sẽ bị mất vĩnh viễn. Tiếp tục?`
          });
          break;
        default:
          console.warn(`Unknown action: ${action}`);
      }
    } catch (err) {
      console.error(`Error performing action ${action}:`, err);
    }
  };

  /**
   * Thực hiện hành động sau khi xác nhận
   */
  const handleConfirmAction = async () => {
    try {
      switch (confirmDialog.action) {
        case 'stop':
          await stopVM(vmId);
          break;
        case 'force-stop':
          await stopVM(vmId, true);
          break;
        case 'restart':
          await restartVM(vmId);
          break;
        case 'delete':
          await deleteVM(vmId);
          // Chuyển hướng về trang danh sách VM sau khi xóa
          navigate('/vms');
          break;
      }
    } catch (err) {
      console.error(`Error performing action ${confirmDialog.action}:`, err);
    } finally {
      // Đóng dialog xác nhận
      setConfirmDialog({
        open: false,
        action: null,
        title: '',
        message: ''
      });
    }
  };

  /**
   * Hủy hành động xác nhận
   */
  const handleCancelAction = () => {
    setConfirmDialog({
      open: false,
      action: null,
      title: '',
      message: ''
    });
  };

  /**
   * Thay đổi tần suất làm mới dữ liệu
   * 
   * @param {number} interval - Thời gian làm mới (ms)
   */
  const handleRefreshRateChange = (interval) => {
    setRefreshInterval(interval);
  };

  // Nếu đang tải và chưa có dữ liệu VM
  if (loading && !selectedVM) {
    return (
      <div className={`vm-detail-page ${theme}`}>
        <PageHeader 
          title="Chi tiết máy ảo"
          subtitle="Đang tải thông tin máy ảo..."
          backLink="/vms"
        />
        <div className="loading-container">
          <Spinner size="large" />
          <p>Đang tải thông tin máy ảo...</p>
        </div>
      </div>
    );
  }

  // Nếu có lỗi
  if (error) {
    return (
      <div className={`vm-detail-page ${theme}`}>
        <PageHeader 
          title="Chi tiết máy ảo"
          subtitle="Không thể tải thông tin máy ảo"
          backLink="/vms"
        />
        <ErrorState 
          title="Không thể tải thông tin máy ảo" 
          message={error}
          action={{
            label: "Thử lại",
            onClick: () => fetchVMById(vmId)
          }}
        />
      </div>
    );
  }

  // Nếu không tìm thấy VM
  if (!loading && !selectedVM) {
    return (
      <div className={`vm-detail-page ${theme}`}>
        <PageHeader 
          title="Chi tiết máy ảo"
          subtitle="Không tìm thấy máy ảo"
          backLink="/vms"
        />
        <ErrorState 
          title="Không tìm thấy máy ảo" 
          message={`Không tìm thấy máy ảo với ID: ${vmId}`}
          action={{
            label: "Quay lại danh sách",
            onClick: () => navigate('/vms')
          }}
        />
      </div>
    );
  }

  // Danh sách các tab
  const tabs = [
    { id: 'info', label: 'Thông tin', icon: 'info-circle' },
    { id: 'monitoring', label: 'Giám sát', icon: 'chart-line' },
    { id: 'logs', label: 'Logs', icon: 'list' },
    { id: 'network', label: 'Mạng', icon: 'network-wired' },
    { id: 'storage', label: 'Lưu trữ', icon: 'hdd' },
    { id: 'security', label: 'Bảo mật', icon: 'shield-alt' }
  ];

  return (
    <div className={`vm-detail-page ${theme}`}>
      <PageHeader 
        title="Chi tiết máy ảo"
        subtitle={selectedVM.name}
        backLink="/vms"
      />

      <VMDetailHeader 
        vm={selectedVM}
        onAction={handleVMAction}
        actionInProgress={actionInProgress}
      />

      <div className="vm-detail-content">
        <Tabs 
          tabs={tabs}
          activeTab={activeTab}
          onChange={handleTabChange}
        />

        <div className="tab-content">
          {loading && (
            <div className="tab-loading-overlay">
              <Spinner size="medium" />
              <span>Đang cập nhật...</span>
            </div>
          )}

          {activeTab === 'info' && (
            <InfoTab vm={selectedVM} />
          )}

          {activeTab === 'monitoring' && (
            <MonitoringTab 
              vm={selectedVM} 
              refreshInterval={refreshInterval}
              onRefreshRateChange={handleRefreshRateChange}
            />
          )}

          {activeTab === 'logs' && (
            <LogsTab vm={selectedVM} />
          )}

          {activeTab === 'network' && (
            <NetworkTab vm={selectedVM} />
          )}

          {activeTab === 'storage' && (
            <StorageTab vm={selectedVM} />
          )}

          {activeTab === 'security' && (
            <SecurityTab vm={selectedVM} />
          )}
        </div>
      </div>

      <ConfirmationDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={
          confirmDialog.action === 'delete' 
            ? 'Xóa máy ảo' 
            : confirmDialog.action === 'force-stop'
            ? 'Buộc dừng'
            : 'Xác nhận'
        }
        cancelLabel="Hủy"
        confirmVariant={confirmDialog.action === 'delete' ? 'danger' : 'primary'}
        isLoading={actionInProgress !== null}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />
    </div>
  );
};

export default VMDetail;