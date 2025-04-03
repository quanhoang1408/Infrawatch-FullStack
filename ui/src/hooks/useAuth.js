import { useContext, useState } from 'react';
import { AuthContext } from '../context';
import { authService } from '../services';
import { useNotification } from './useNotification';
import { useLocalStorage } from './useLocalStorage';
import { TOKEN_KEY, USER_KEY } from '../constants/storage.constants';

/**
 * Hook để quản lý trạng thái xác thực người dùng
 * 
 * @returns {Object} Các phương thức và trạng thái liên quan đến xác thực
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setItem, removeItem } = useLocalStorage();

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const { 
    isAuthenticated, 
    setIsAuthenticated, 
    user, 
    setUser, 
    accessToken, 
    setAccessToken 
  } = context;

  /**
   * Đăng nhập người dùng
   * 
   * @param {string} username - Tên đăng nhập
   * @param {string} password - Mật khẩu
   * @returns {Promise<Object>} - Thông tin người dùng nếu đăng nhập thành công
   */
  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(username, password);
      const { token, user } = response;
      
      setAccessToken(token);
      setUser(user);
      setIsAuthenticated(true);
      
      // Lưu thông tin vào localStorage để duy trì đăng nhập
      setItem(TOKEN_KEY, token);
      setItem(USER_KEY, JSON.stringify(user));
      
      showNotification({
        type: 'success',
        message: 'Đăng nhập thành công',
        description: `Chào mừng ${user.fullName || username} đã quay trở lại!`
      });
      
      return user;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Đăng nhập thất bại, vui lòng thử lại';
      setError(errorMessage);
      showNotification({
        type: 'error',
        message: 'Đăng nhập thất bại',
        description: errorMessage
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Đăng ký người dùng mới
   * 
   * @param {Object} userData - Thông tin người dùng mới
   * @returns {Promise<Object>} - Thông tin người dùng nếu đăng ký thành công
   */
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.register(userData);
      showNotification({
        type: 'success',
        message: 'Đăng ký thành công',
        description: 'Tài khoản của bạn đã được tạo, vui lòng đăng nhập'
      });
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại';
      setError(errorMessage);
      showNotification({
        type: 'error',
        message: 'Đăng ký thất bại',
        description: errorMessage
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Đăng xuất người dùng
   */
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Xóa trạng thái xác thực và localStorage ngay cả khi API thất bại
      setIsAuthenticated(false);
      setUser(null);
      setAccessToken(null);
      removeItem(TOKEN_KEY);
      removeItem(USER_KEY);
      
      showNotification({
        type: 'info',
        message: 'Đăng xuất thành công',
        description: 'Bạn đã đăng xuất khỏi hệ thống'
      });
    }
  };

  /**
   * Kiểm tra xem token hiện tại có hợp lệ không
   * 
   * @returns {Promise<boolean>} - True nếu token hợp lệ
   */
  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      const response = await authService.verifyToken();
      if (response.valid) {
        setIsAuthenticated(true);
        // Cập nhật thông tin người dùng nếu cần
        if (response.user) {
          setUser(response.user);
          setItem(USER_KEY, JSON.stringify(response.user));
        }
        return true;
      } else {
        // Token không hợp lệ, đăng xuất
        logout();
        return false;
      }
    } catch (err) {
      console.error('Token verification error:', err);
      logout();
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cập nhật thông tin người dùng
   * 
   * @param {Object} updatedData - Dữ liệu người dùng cần cập nhật
   * @returns {Promise<Object>} - Thông tin người dùng sau khi cập nhật
   */
  const updateUserProfile = async (updatedData) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedUser = await authService.updateProfile(updatedData);
      setUser(updatedUser);
      setItem(USER_KEY, JSON.stringify(updatedUser));
      
      showNotification({
        type: 'success',
        message: 'Cập nhật thành công',
        description: 'Thông tin cá nhân đã được cập nhật'
      });
      
      return updatedUser;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Cập nhật thất bại, vui lòng thử lại';
      setError(errorMessage);
      showNotification({
        type: 'error',
        message: 'Cập nhật thất bại',
        description: errorMessage
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Đổi mật khẩu người dùng
   * 
   * @param {string} currentPassword - Mật khẩu hiện tại
   * @param {string} newPassword - Mật khẩu mới
   * @returns {Promise<Object>} - Kết quả đổi mật khẩu
   */
  const changePassword = async (currentPassword, newPassword) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.changePassword(currentPassword, newPassword);
      
      showNotification({
        type: 'success',
        message: 'Đổi mật khẩu thành công',
        description: 'Mật khẩu của bạn đã được cập nhật'
      });
      
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Đổi mật khẩu thất bại, vui lòng thử lại';
      setError(errorMessage);
      showNotification({
        type: 'error',
        message: 'Đổi mật khẩu thất bại',
        description: errorMessage
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Kiểm tra người dùng hiện tại có quyền cụ thể hay không
   * 
   * @param {string} permission - Quyền cần kiểm tra
   * @returns {boolean} - True nếu người dùng có quyền
   */
  const hasPermission = (permission) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };

  /**
   * Kiểm tra người dùng có vai trò cụ thể hay không
   * 
   * @param {string} role - Vai trò cần kiểm tra
   * @returns {boolean} - True nếu người dùng có vai trò
   */
  const hasRole = (role) => {
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
  };

  return {
    isAuthenticated,
    user,
    accessToken,
    loading,
    error,
    login,
    register,
    logout,
    updateUserProfile,
    changePassword,
    checkAuthStatus,
    hasPermission,
    hasRole
  };
};

export default useAuth;