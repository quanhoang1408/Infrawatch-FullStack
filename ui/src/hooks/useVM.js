import { useContext, useState, useEffect, useCallback } from 'react';
import { VMContext } from '../context';
import { vmService } from '../services';
import useNotification from './useNotification';

/**
 * Hook để quản lý và truy xuất dữ liệu máy ảo
 *
 * @returns {Object} Các phương thức và trạng thái liên quan đến VM
 */
export const useVM = () => {
  const context = useContext(VMContext);
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!context) {
    throw new Error('useVM must be used within a VMProvider');
  }

  const {
    vms,
    selectedVM,
    filters,
    isLoading,
    error: contextError,
    fetchVMs: contextFetchVMs,
    getVMDetail,
    filterVMs: contextFilterVMs
  } = context;

  /**
   * Tải danh sách máy ảo từ server
   */
  const fetchVMs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Use the context's fetchVMs function
      const vmsData = await contextFetchVMs();
      return vmsData;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tải danh sách máy ảo';
      setError(errorMessage);
      showError('Lỗi tải dữ liệu', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contextFetchVMs, showError]);

  /**
   * Tải chi tiết của một máy ảo cụ thể
   *
   * @param {string} vmId - ID của máy ảo cần tải
   * @returns {Object} Thông tin chi tiết của máy ảo
   */
  const fetchVMById = async (vmId) => {
    setLoading(true);
    setError(null);

    try {
      // Use the context's getVMDetail function
      const vmData = await getVMDetail(vmId);
      return vmData;
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Không thể tải thông tin máy ảo ID: ${vmId}`;
      setError(errorMessage);
      showError('Lỗi tải dữ liệu', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Tải dữ liệu giám sát của một máy ảo
   *
   * @param {string} vmId - ID của máy ảo cần tải dữ liệu giám sát
   * @param {Object} options - Tùy chọn như khoảng thời gian
   * @returns {Object} Dữ liệu giám sát của máy ảo
   */
  const fetchVMStats = async (vmId, options = {}) => {
    const { timeRange = '1h', metrics = ['cpu', 'memory', 'disk', 'network'] } = options;

    setLoading(true);
    setError(null);

    try {
      const response = await vmService.getVMStats(vmId, timeRange, metrics);
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Không thể tải dữ liệu giám sát máy ảo ID: ${vmId}`;
      setError(errorMessage);
      showError('Lỗi tải dữ liệu giám sát', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Lọc danh sách máy ảo theo các tiêu chí
   *
   * @param {Object} filterOptions - Các tiêu chí lọc
   */
  const filterVMs = (filterOptions) => {
    contextFilterVMs(filterOptions);
  };

  /**
   * Xóa tất cả bộ lọc hiện tại
   */
  const clearFilters = () => {
    contextFilterVMs({
      status: null,
      provider: null,
      search: '',
      sortBy: 'name',
      sortOrder: 'asc',
      page: 1,
      limit: 10
    });
  };

  /**
   * Cập nhật thông tin của một máy ảo
   *
   * @param {string} vmId - ID của máy ảo cần cập nhật
   * @param {Object} updateData - Dữ liệu cần cập nhật
   * @returns {Object} Thông tin máy ảo sau khi cập nhật
   */
  const updateVM = async (vmId, updateData) => {
    setLoading(true);
    setError(null);

    try {
      const updatedVM = await vmService.updateVM(vmId, updateData);

      // Refresh VM data after update
      await fetchVMs();

      // If we're viewing this VM, refresh its details
      if (selectedVM && selectedVM.id === vmId) {
        await getVMDetail(vmId);
      }

      showSuccess(
        'Cập nhật thành công',
        `Máy ảo ${updatedVM.name} đã được cập nhật`
      );

      return updatedVM;
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Không thể cập nhật máy ảo ID: ${vmId}`;
      setError(errorMessage);
      showError('Lỗi cập nhật', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Tải danh sách logs của một máy ảo
   *
   * @param {string} vmId - ID của máy ảo
   * @param {Object} options - Các tùy chọn như giới hạn, trang, loại log
   * @returns {Array} Danh sách logs
   */
  const fetchVMLogs = async (vmId, options = {}) => {
    const { limit = 100, page = 1, logType = 'all' } = options;

    setLoading(true);
    setError(null);

    try {
      const logs = await vmService.getVMLogs(vmId, { limit, page, logType });
      return logs;
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Không thể tải logs của máy ảo ID: ${vmId}`;
      setError(errorMessage);
      showError('Lỗi tải logs', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Lấy thông tin bảo mật của một máy ảo
   *
   * @param {string} vmId - ID của máy ảo
   * @returns {Object} Thông tin bảo mật của máy ảo
   */
  const getVMSecurityDetails = async (vmId) => {
    console.log('useVM - getVMSecurityDetails called with vmId:', vmId);

    if (!vmId) {
      const error = new Error('VM ID is required');
      console.error('useVM - getVMSecurityDetails error:', error);
      throw error;
    }

    setLoading(true);
    setError(null);

    try {
      // Trong thực tế, sẽ gọi API để lấy thông tin bảo mật
      // const securityDetails = await vmService.getVMSecurityDetails(vmId);

      // Sử dụng mock data tạm thời
      const securityDetails = {
        passwordAuth: true,
        rootLogin: false,
        autoUpdates: true,
        firewallEnabled: true,
        sshKeys: [
          {
            id: 'key-1',
            name: 'Development Key',
            fingerprint: 'SHA256:abcdefghijklmnopqrstuvwxyz1234567890ABCDEF',
            addedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'key-2',
            name: 'Production Key',
            fingerprint: 'SHA256:123456789abcdefghijklmnopqrstuvwxyzABCDEF',
            addedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            lastUsed: null
          }
        ],
        certificates: [
          {
            id: 'cert-1',
            name: 'Development Certificate',
            status: 'active',
            issuedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            expiresAt: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        securityScans: [
          {
            id: 'scan-1',
            scanDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'completed',
            vulnerabilities: 3,
            criticalVulnerabilities: 1
          },
          {
            id: 'scan-2',
            scanDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'completed',
            vulnerabilities: 5,
            criticalVulnerabilities: 2
          }
        ]
      };

      return securityDetails;
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Không thể tải thông tin bảo mật của máy ảo ID: ${vmId}`;
      setError(errorMessage);
      showError('Lỗi tải thông tin bảo mật', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cập nhật cài đặt bảo mật của một máy ảo
   *
   * @param {string} vmId - ID của máy ảo
   * @param {Object} updateData - Dữ liệu cập nhật
   * @returns {Object} Kết quả cập nhật
   */
  const updateVMSecurity = async (vmId, updateData) => {
    setLoading(true);
    setError(null);

    try {
      // Trong thực tế, sẽ gọi API để cập nhật cài đặt bảo mật
      // const result = await vmService.updateVMSecurity(vmId, updateData);

      // Sử dụng mock data tạm thời
      let result = { success: true };

      // Xử lý các loại hành động khác nhau
      if (updateData.action === 'addSSHKey') {
        result.key = {
          id: 'key-' + Date.now(),
          name: updateData.keyName,
          fingerprint: 'SHA256:' + Math.random().toString(36).substring(2, 15),
          addedAt: new Date().toISOString(),
          lastUsed: null
        };
      } else if (updateData.action === 'runSecurityScan') {
        result.scan = {
          id: 'scan-' + Date.now(),
          scanDate: new Date().toISOString(),
          status: 'in-progress',
          vulnerabilities: 0,
          criticalVulnerabilities: 0
        };
      }

      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Không thể cập nhật cài đặt bảo mật của máy ảo ID: ${vmId}`;
      setError(errorMessage);
      showError('Lỗi cập nhật cài đặt bảo mật', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Use context loading and error states if local ones are not set
  const finalLoading = loading || (isLoading && !loading);
  const finalError = error || (contextError && !error);

  return {
    vms,
    selectedVM,
    filters,
    loading: finalLoading,
    error: finalError,
    fetchVMs,
    fetchVMById,
    getVMDetail,  // Also expose the original context function
    fetchVMStats,
    fetchVMLogs,
    filterVMs,
    clearFilters,
    updateVM,
    getVMSecurityDetails,
    updateVMSecurity
  };
};
