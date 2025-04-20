import { useState } from 'react';
import { vmService } from '../services';
import useNotification from './useNotification';
import { useVM } from './useVM';

/**
 * Hook để thực hiện các hành động lên máy ảo
 *
 * @returns {Object} Các phương thức thực hiện hành động và trạng thái
 */
export const useVMActions = () => {
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(null);
  const { showSuccess, showError, showConfirmation } = useNotification();
  const { fetchVMs, vms, fetchVMById } = useVM();

  /**
   * Khởi động máy ảo
   *
   * @param {string} vmId - ID của máy ảo cần khởi động
   * @returns {Promise<Object>} Kết quả thực hiện
   */
  const startVM = async (vmId) => {
    setLoading(true);
    setActionInProgress('start');

    try {
      const vm = vms.find(vm => vm.id === vmId);
      const vmName = vm?.name || vmId;

      const result = await vmService.startVM(vmId);
      showSuccess(
        'Khởi động máy ảo',
        `Máy ảo ${vmName} đã bắt đầu khởi động`
      );

      // Tải lại thông tin máy ảo để cập nhật trạng thái
      await fetchVMById(vmId);
      await fetchVMs();

      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Không thể khởi động máy ảo ID: ${vmId}`;
      showError('Lỗi khởi động', errorMessage);
      throw err;
    } finally {
      setLoading(false);
      setActionInProgress(null);
    }
  };

  /**
   * Dừng máy ảo
   *
   * @param {string} vmId - ID của máy ảo cần dừng
   * @param {boolean} force - Có dừng cưỡng chế không
   * @returns {Promise<Object>} Kết quả thực hiện
   */
  const stopVM = async (vmId, force = false) => {
    setLoading(true);
    setActionInProgress('stop');

    try {
      const vm = vms.find(vm => vm.id === vmId);
      const vmName = vm?.name || vmId;

      const result = await vmService.stopVM(vmId, force);
      showSuccess(
        'Dừng máy ảo',
        `Máy ảo ${vmName} đang dừng lại${force ? ' (cưỡng chế)' : ''}`
      );

      // Tải lại thông tin máy ảo để cập nhật trạng thái
      await fetchVMById(vmId);
      await fetchVMs();

      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Không thể dừng máy ảo ID: ${vmId}`;
      showError('Lỗi dừng máy ảo', errorMessage);
      throw err;
    } finally {
      setLoading(false);
      setActionInProgress(null);
    }
  };

  /**
   * Khởi động lại máy ảo
   *
   * @param {string} vmId - ID của máy ảo cần khởi động lại
   * @returns {Promise<Object>} Kết quả thực hiện
   */
  const restartVM = async (vmId) => {
    setLoading(true);
    setActionInProgress('restart');

    try {
      const vm = vms.find(vm => vm.id === vmId);
      const vmName = vm?.name || vmId;

      const result = await vmService.restartVM(vmId);
      showSuccess(
        'Khởi động lại máy ảo',
        `Máy ảo ${vmName} đang khởi động lại`
      );

      // Tải lại thông tin máy ảo để cập nhật trạng thái
      await fetchVMById(vmId);
      await fetchVMs();

      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Không thể khởi động lại máy ảo ID: ${vmId}`;
      showError('Lỗi khởi động lại', errorMessage);
      throw err;
    } finally {
      setLoading(false);
      setActionInProgress(null);
    }
  };

  /**
   * Xóa máy ảo
   *
   * @param {string} vmId - ID của máy ảo cần xóa
   * @returns {Promise<Object>} Kết quả thực hiện
   */
  const deleteVM = async (vmId) => {
    const vm = vms.find(vm => vm.id === vmId);
    const vmName = vm?.name || vmId;

    // Hiển thị xác nhận trước khi xóa
    return new Promise((resolve, reject) => {
      showConfirmation({
        title: 'Xác nhận xóa máy ảo',
        message: `Bạn có chắc chắn muốn xóa máy ảo "${vmName}"? Hành động này không thể hoàn tác.`,
        onConfirm: async () => {
          setLoading(true);
          setActionInProgress('delete');

          try {
            const result = await vmService.deleteVM(vmId);
            showSuccess(
              'Xóa máy ảo',
              `Máy ảo ${vmName} đã được xóa thành công`
            );

            // Tải lại danh sách máy ảo
            await fetchVMs();

            resolve(result);
          } catch (err) {
            const errorMessage = err.response?.data?.message || `Không thể xóa máy ảo ID: ${vmId}`;
            showError('Lỗi xóa máy ảo', errorMessage);
            reject(err);
          } finally {
            setLoading(false);
            setActionInProgress(null);
          }
        },
        onCancel: () => {
          resolve(null); // Không thực hiện hành động nếu người dùng hủy
        }
      });
    });
  };

  /**
   * Tạo máy ảo mới
   *
   * @param {Object} vmData - Thông tin máy ảo mới
   * @returns {Promise<Object>} Thông tin máy ảo sau khi tạo
   */
  const createVM = async (vmData) => {
    setLoading(true);
    setActionInProgress('create');

    try {
      const newVM = await vmService.createVM(vmData);
      showSuccess(
        'Tạo máy ảo',
        `Máy ảo ${newVM.name} đã được tạo thành công`
      );

      // Tải lại danh sách máy ảo
      await fetchVMs();

      return newVM;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tạo máy ảo mới';
      showError('Lỗi tạo máy ảo', errorMessage);
      throw err;
    } finally {
      setLoading(false);
      setActionInProgress(null);
    }
  };

  /**
   * Thay đổi kích thước máy ảo
   *
   * @param {string} vmId - ID của máy ảo
   * @param {Object} specs - Thông số mới (CPU, RAM, disk)
   * @returns {Promise<Object>} Kết quả thực hiện
   */
  const resizeVM = async (vmId, specs) => {
    setLoading(true);
    setActionInProgress('resize');

    try {
      const vm = vms.find(vm => vm.id === vmId);
      const vmName = vm?.name || vmId;

      const result = await vmService.resizeVM(vmId, specs);
      showSuccess(
        'Thay đổi kích thước máy ảo',
        `Máy ảo ${vmName} đã được điều chỉnh kích thước thành công`
      );

      // Tải lại thông tin máy ảo để cập nhật
      await fetchVMById(vmId);
      await fetchVMs();

      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Không thể thay đổi kích thước máy ảo ID: ${vmId}`;
      showError('Lỗi thay đổi kích thước', errorMessage);
      throw err;
    } finally {
      setLoading(false);
      setActionInProgress(null);
    }
  };

  /**
   * Tạo snapshot của máy ảo
   *
   * @param {string} vmId - ID của máy ảo
   * @param {string} name - Tên của snapshot
   * @param {string} description - Mô tả snapshot
   * @returns {Promise<Object>} Thông tin snapshot sau khi tạo
   */
  const createVMSnapshot = async (vmId, name, description = '') => {
    setLoading(true);
    setActionInProgress('snapshot');

    try {
      const vm = vms.find(vm => vm.id === vmId);
      const vmName = vm?.name || vmId;

      const snapshot = await vmService.createSnapshot(vmId, { name, description });
      showSuccess(
        'Tạo snapshot',
        `Snapshot "${name}" cho máy ảo ${vmName} đã được tạo thành công`
      );

      return snapshot;
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Không thể tạo snapshot cho máy ảo ID: ${vmId}`;
      showError('Lỗi tạo snapshot', errorMessage);
      throw err;
    } finally {
      setLoading(false);
      setActionInProgress(null);
    }
  };

  /**
   * Khôi phục máy ảo từ snapshot
   *
   * @param {string} vmId - ID của máy ảo
   * @param {string} snapshotId - ID của snapshot
   * @returns {Promise<Object>} Kết quả thực hiện
   */
  const restoreVMSnapshot = async (vmId, snapshotId) => {
    setLoading(true);
    setActionInProgress('restore');

    try {
      const vm = vms.find(vm => vm.id === vmId);
      const vmName = vm?.name || vmId;

      const result = await vmService.restoreSnapshot(vmId, snapshotId);
      showSuccess(
        'Khôi phục snapshot',
        `Máy ảo ${vmName} đã được khôi phục từ snapshot thành công`
      );

      // Tải lại thông tin máy ảo để cập nhật
      await fetchVMById(vmId);

      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Không thể khôi phục snapshot cho máy ảo ID: ${vmId}`;
      showError('Lỗi khôi phục snapshot', errorMessage);
      throw err;
    } finally {
      setLoading(false);
      setActionInProgress(null);
    }
  };

  /**
   * Cập nhật SSH certificate cho máy ảo
   *
   * @param {string} vmId - ID của máy ảo
   * @returns {Promise<Object>} Kết quả thực hiện
   */
  const updateSSHCertificate = async (vmId) => {
    setLoading(true);
    setActionInProgress('updateSSH');

    try {
      const vm = vms.find(vm => vm.id === vmId);
      const vmName = vm?.name || vmId;

      const result = await vmService.updateSSHCertificate(vmId);
      showSuccess(
        'Cập nhật SSH certificate',
        `SSH certificate của máy ảo ${vmName} đã được cập nhật thành công`
      );

      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Không thể cập nhật SSH certificate cho máy ảo ID: ${vmId}`;
      showError('Lỗi cập nhật SSH certificate', errorMessage);
      throw err;
    } finally {
      setLoading(false);
      setActionInProgress(null);
    }
  };

  /**
   * Cập nhật SSH key cho máy ảo
   *
   * @param {string} vmId - ID của máy ảo
   * @param {string} sshUser - Tên người dùng SSH
   * @returns {Promise<Object>} Kết quả thực hiện
   */
  const updateSSHKey = async (vmId, sshUser) => {
    console.log('useVMActions - updateSSHKey called with vmId:', vmId, 'and sshUser:', sshUser);
    setLoading(true);
    setActionInProgress('updateSSHKey');

    try {
      if (!vmId) {
        throw new Error('VM ID is required');
      }

      if (!sshUser) {
        throw new Error('SSH username is required');
      }

      const vm = vms.find(vm => vm.id === vmId);
      const vmName = vm?.name || vmId;

      console.log('Calling updateSSHKey API with vmId:', vmId, 'and sshUser:', sshUser);
      const result = await vmService.updateSSHKey(vmId, { sshUser });
      showSuccess(
        'Cập nhật SSH key',
        `Lệnh cập nhật SSH key cho người dùng ${sshUser} trên máy ảo ${vmName} đã được gửi thành công`
      );

      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Không thể cập nhật SSH key cho máy ảo ID: ${vmId}`;
      showError('Lỗi cập nhật SSH key', errorMessage);
      throw err;
    } finally {
      setLoading(false);
      setActionInProgress(null);
    }
  };

  return {
    loading,
    actionInProgress,
    startVM,
    stopVM,
    restartVM,
    deleteVM,
    createVM,
    resizeVM,
    createVMSnapshot,
    restoreVMSnapshot,
    updateSSHCertificate,
    updateSSHKey
  };
};

export default useVMActions;