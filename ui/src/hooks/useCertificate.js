import { useState, useEffect } from 'react';
import { certificateService } from '../services';
import useNotification from './useNotification';

/**
 * Hook để quản lý SSH certificates trong ứng dụng
 *
 * @returns {Object} Các phương thức và trạng thái liên quan đến SSH certificates
 */
export const useCertificate = () => {
  const [certificates, setCertificates] = useState([]);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showSuccess, showError, showConfirmation } = useNotification();

  /**
   * Tải danh sách certificates từ server
   */
  const fetchCertificates = async () => {
    setLoading(true);
    setError(null);

    try {
      // Sử dụng mock data tạm thời vì API chưa sẵn sàng
      // Trong thực tế, sẽ gọi API để lấy danh sách certificates
      const mockCertificates = [
        {
          id: 'cert-1',
          name: 'Development Certificate',
          status: 'active',
          issuedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'ssh'
        },
        {
          id: 'cert-2',
          name: 'Production Certificate',
          status: 'active',
          issuedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'ssh'
        }
      ];

      setCertificates(mockCertificates);
      return mockCertificates;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tải danh sách certificates';
      setError(errorMessage);
      showError('Lỗi tải dữ liệu', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Tải thông tin một certificate cụ thể
   *
   * @param {string} id - ID của certificate cần tải
   * @returns {Object} Thông tin chi tiết của certificate
   */
  const fetchCertificateById = async (id) => {
    setLoading(true);
    setError(null);

    try {
      // Trong thực tế, sẽ gọi API để lấy thông tin certificate
      // const certificate = await certificateService.getCertificate(vmId, id);

      // Sử dụng mock data tạm thời
      const certificate = certificates.find(cert => cert.id === id) || {
        id,
        name: 'Certificate ' + id,
        status: 'active',
        issuedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'ssh'
      };

      setSelectedCertificate(certificate);
      return certificate;
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Không thể tải thông tin certificate ID: ${id}`;
      setError(errorMessage);
      showError('Lỗi tải dữ liệu', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Tạo certificate mới
   *
   * @param {Object} certificateData - Dữ liệu certificate cần tạo
   * @returns {Object} Thông tin certificate sau khi tạo
   */
  const createCertificate = async (certificateData) => {
    setLoading(true);
    setError(null);

    try {
      // Tạo mock certificate mới
      const newCertificate = {
        id: 'cert-' + Date.now(),
        name: certificateData.name,
        status: 'active',
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (certificateData.validityDays || 30) * 24 * 60 * 60 * 1000).toISOString(),
        type: 'ssh'
      };

      // Cập nhật danh sách certificates
      setCertificates(prevCertificates => [...prevCertificates, newCertificate]);

      showSuccess(
        'Tạo certificate thành công',
        `Certificate "${newCertificate.name}" đã được tạo`
      );

      return {
        success: true,
        certificate: newCertificate
      };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tạo certificate mới';
      setError(errorMessage);
      showError('Lỗi tạo certificate', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cập nhật thông tin certificate
   *
   * @param {string} id - ID của certificate cần cập nhật
   * @param {Object} updateData - Dữ liệu cần cập nhật
   * @returns {Object} Thông tin certificate sau khi cập nhật
   */
  const updateCertificate = async (id, updateData) => {
    setLoading(true);
    setError(null);

    try {
      const updatedCertificate = await certificateService.updateCertificate(id, updateData);

      // Cập nhật danh sách certificates
      setCertificates(prevCertificates =>
        prevCertificates.map(cert =>
          cert.id === id ? updatedCertificate : cert
        )
      );

      // Cập nhật certificate đang được chọn nếu đang xem
      if (selectedCertificate && selectedCertificate.id === id) {
        setSelectedCertificate(updatedCertificate);
      }

      showSuccess(
        'Cập nhật certificate thành công',
        `Certificate "${updatedCertificate.name}" đã được cập nhật`
      );

      return updatedCertificate;
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Không thể cập nhật certificate ID: ${id}`;
      setError(errorMessage);
      showError('Lỗi cập nhật certificate', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Xóa certificate
   *
   * @param {string} id - ID của certificate cần xóa
   * @returns {Promise<boolean>} Kết quả xóa certificate
   */
  const deleteCertificate = async (id) => {
    const certToDelete = certificates.find(cert => cert.id === id);

    // Hiển thị xác nhận trước khi xóa
    return new Promise((resolve, reject) => {
      showConfirmation({
        title: 'Xác nhận xóa certificate',
        message: `Bạn có chắc chắn muốn xóa certificate "${certToDelete?.name || id}"? Hành động này không thể hoàn tác.`,
        onConfirm: async () => {
          setLoading(true);
          setError(null);

          try {
            // Trong thực tế, sẽ gọi API để xóa certificate
            // await certificateService.deleteCertificate(id);

            // Cập nhật danh sách certificates
            setCertificates(prevCertificates =>
              prevCertificates.filter(cert => cert.id !== id)
            );

            // Nếu đang xem certificate bị xóa, xóa khỏi selected
            if (selectedCertificate && selectedCertificate.id === id) {
              setSelectedCertificate(null);
            }

            showSuccess(
              'Xóa certificate thành công',
              `Certificate "${certToDelete?.name || id}" đã được xóa`
            );

            resolve(true);
          } catch (err) {
            const errorMessage = err.response?.data?.message || `Không thể xóa certificate ID: ${id}`;
            setError(errorMessage);
            showError('Lỗi xóa certificate', errorMessage);
            reject(err);
          } finally {
            setLoading(false);
          }
        },
        onCancel: () => {
          resolve(false); // Người dùng hủy xóa
        }
      });
    });
  };

  /**
   * Triển khai certificate vào máy ảo
   *
   * @param {string} certificateId - ID của certificate
   * @param {string} vmId - ID của máy ảo
   * @returns {Promise<Object>} Kết quả triển khai
   */
  const deployCertificate = async (certificateId, vmId) => {
    setLoading(true);
    setError(null);

    try {
      // Trong thực tế, sẽ gọi API để triển khai certificate
      // const result = await certificateService.deployCertificate(certificateId, vmId);

      // Sử dụng mock data tạm thời
      const result = { success: true, message: 'Certificate deployed successfully' };

      showSuccess(
        'Triển khai certificate thành công',
        `Certificate đã được triển khai vào máy ảo`
      );

      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể triển khai certificate vào máy ảo';
      setError(errorMessage);
      showError('Lỗi triển khai certificate', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Tạo và tải xuống private key của certificate
   *
   * @param {string} id - ID của certificate cần tải private key
   */
  const downloadPrivateKey = async (id) => {
    setLoading(true);
    setError(null);

    try {
      // Trong thực tế, sẽ gọi API để lấy private key
      // const privateKey = await certificateService.getPrivateKey(id);

      // Sử dụng mock data tạm thời
      const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA3Tz2mr7SZiAMfQyuvBjM9Oi...
-----END RSA PRIVATE KEY-----`;

      // Tạo file và tải xuống
      const blob = new Blob([privateKey], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `private_key_${id}.pem`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess(
        'Tải private key thành công',
        'Private key đã được tải xuống'
      );
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tải private key';
      setError(errorMessage);
      showError('Lỗi tải private key', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Thay đổi loại certificate (cá nhân/chung)
   *
   * @param {string} id - ID của certificate
   * @param {string} type - Loại certificate mới ('personal' hoặc 'shared')
   * @returns {Object} Thông tin certificate sau khi thay đổi
   */
  const changeCertificateType = async (id, type) => {
    if (type !== 'personal' && type !== 'shared') {
      throw new Error('Loại certificate không hợp lệ. Sử dụng "personal" hoặc "shared"');
    }

    return updateCertificate(id, { type });
  };

  /**
   * Revoke certificate
   *
   * @param {string} id - ID của certificate cần revoke
   * @returns {Promise<Object>} Kết quả revoke certificate
   */
  const revokeCertificate = async (id) => {
    setLoading(true);
    setError(null);

    try {
      // Trong thực tế, sẽ gọi API để revoke certificate
      // await certificateService.revokeCertificate(id);

      // Cập nhật danh sách certificates
      setCertificates(prevCertificates =>
        prevCertificates.map(cert =>
          cert.id === id
            ? { ...cert, status: 'revoked', revokedAt: new Date().toISOString() }
            : cert
        )
      );

      showSuccess(
        'Thu hồi certificate thành công',
        `Certificate đã được thu hồi`
      );

      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Không thể thu hồi certificate ID: ${id}`;
      setError(errorMessage);
      showError('Lỗi thu hồi certificate', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Tải danh sách certificates được gán cho một máy ảo
   *
   * @param {string} vmId - ID của máy ảo
   * @returns {Array} Danh sách certificates của máy ảo
   */
  const fetchVMCertificates = async (vmId) => {
    setLoading(true);
    setError(null);

    try {
      // Trong thực tế, sẽ gọi API để lấy danh sách certificates của máy ảo
      // const vmCertificates = await certificateService.getCertificates(vmId);

      // Sử dụng mock data tạm thời
      const vmCertificates = [
        {
          id: 'cert-vm-1',
          name: 'VM Development Certificate',
          status: 'active',
          issuedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'ssh'
        }
      ];

      return vmCertificates;
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Không thể tải certificates của máy ảo ID: ${vmId}`;
      setError(errorMessage);
      showError('Lỗi tải dữ liệu', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Tải danh sách certificates khi component mount
  useEffect(() => {
    fetchCertificates();
  }, []);

  return {
    certificates,
    selectedCertificate,
    loading,
    error,
    fetchCertificates,
    fetchCertificateById,
    createCertificate,
    updateCertificate,
    deleteCertificate,
    deployCertificate,
    downloadPrivateKey,
    changeCertificateType,
    fetchVMCertificates,
    setSelectedCertificate
  };
};

export default useCertificate;