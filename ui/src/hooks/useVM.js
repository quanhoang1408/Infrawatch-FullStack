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
    updateVM
  };
};
