import React, { createContext, useState, useEffect, useCallback, useReducer } from 'react';
import vmService from '../services/vm.service';
import { VM_STATUS, VM_ACTIONS, PROVIDERS } from '../constants/vm.constants';

// Tạo context cho VM
export const VMContext = createContext();

// Reducer để quản lý state phức tạp
const vmReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_VMS_REQUEST':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case 'FETCH_VMS_SUCCESS':
      return {
        ...state,
        vms: action.payload,
        filteredVms: action.payload,
        isLoading: false,
        error: null
      };
    case 'FETCH_VMS_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    case 'FILTER_VMS':
      return {
        ...state,
        filteredVms: action.payload,
        filters: {
          ...state.filters,
          ...action.filters
        }
      };
    case 'SET_SELECTED_VM':
      return {
        ...state,
        selectedVM: action.payload
      };
    case 'VM_ACTION_REQUEST':
      return {
        ...state,
        actionLoading: {
          ...state.actionLoading,
          [action.payload.vmId]: action.payload.action
        }
      };
    case 'VM_ACTION_SUCCESS':
      // Cập nhật trạng thái VM sau khi thực hiện action thành công
      return {
        ...state,
        vms: state.vms.map(vm => 
          vm.id === action.payload.vmId 
            ? { ...vm, ...action.payload.updatedData } 
            : vm
        ),
        filteredVms: state.filteredVms.map(vm => 
          vm.id === action.payload.vmId 
            ? { ...vm, ...action.payload.updatedData } 
            : vm
        ),
        selectedVM: state.selectedVM?.id === action.payload.vmId 
          ? { ...state.selectedVM, ...action.payload.updatedData } 
          : state.selectedVM,
        actionLoading: {
          ...state.actionLoading,
          [action.payload.vmId]: null
        }
      };
    case 'VM_ACTION_FAILURE':
      return {
        ...state,
        actionLoading: {
          ...state.actionLoading,
          [action.payload.vmId]: null
        },
        error: action.payload.error
      };
    default:
      return state;
  }
};

// Initial state cho reducer
const initialState = {
  vms: [],
  filteredVms: [],
  selectedVM: null,
  isLoading: false,
  actionLoading: {}, // { vmId: 'action' } - để theo dõi action đang được thực hiện trên VM
  error: null,
  filters: {
    status: null,
    provider: null,
    search: '',
    tags: []
  }
};

/**
 * VMProvider cung cấp dữ liệu và thao tác với máy ảo cho toàn bộ ứng dụng
 */
export const VMProvider = ({ children }) => {
  // Sử dụng reducer để quản lý state phức tạp
  const [state, dispatch] = useReducer(vmReducer, initialState);
  
  // State để lưu trữ resource metrics của VM được chọn
  const [resourceMetrics, setResourceMetrics] = useState({
    cpu: [],
    memory: [],
    disk: [],
    network: []
  });

  /**
   * Lấy danh sách máy ảo từ API
   */
  const fetchVMs = useCallback(async () => {
    dispatch({ type: 'FETCH_VMS_REQUEST' });
    
    try {
      const vms = await vmService.getVMs();
      dispatch({ type: 'FETCH_VMS_SUCCESS', payload: vms });
      return vms;
    } catch (error) {
      dispatch({ type: 'FETCH_VMS_FAILURE', payload: error.message });
      throw error;
    }
  }, []);

  /**
   * Lọc danh sách máy ảo dựa trên các tiêu chí
   * @param {Object} filters Các tiêu chí lọc
   */
  const filterVMs = useCallback((filters) => {
    const { vms } = state;
    let filteredResults = [...vms];
    
    // Lọc theo status
    if (filters.status) {
      filteredResults = filteredResults.filter(vm => vm.status === filters.status);
    }
    
    // Lọc theo provider
    if (filters.provider) {
      filteredResults = filteredResults.filter(vm => vm.provider === filters.provider);
    }
    
    // Lọc theo search text (tìm kiếm theo tên hoặc IP)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredResults = filteredResults.filter(vm => 
        vm.name.toLowerCase().includes(searchLower) || 
        vm.ipAddress?.toLowerCase().includes(searchLower)
      );
    }
    
    // Lọc theo tags
    if (filters.tags && filters.tags.length > 0) {
      filteredResults = filteredResults.filter(vm => 
        filters.tags.some(tag => vm.tags?.includes(tag))
      );
    }
    
    dispatch({ 
      type: 'FILTER_VMS', 
      payload: filteredResults,
      filters
    });
  }, [state]);

  /**
   * Lấy thông tin chi tiết của một máy ảo
   * @param {string} vmId ID của máy ảo
   */
  const getVMDetail = useCallback(async (vmId) => {
    try {
      const vmDetail = await vmService.getVMById(vmId);
      dispatch({ type: 'SET_SELECTED_VM', payload: vmDetail });
      return vmDetail;
    } catch (error) {
      console.error(`Error fetching VM detail for ${vmId}:`, error);
      throw error;
    }
  }, []);

  /**
   * Lấy dữ liệu resource metrics của VM
   * @param {string} vmId ID của máy ảo
   * @param {string} timeRange Khoảng thời gian (1h, 24h, 7d, 30d)
   */
  const fetchVMMetrics = useCallback(async (vmId, timeRange = '1h') => {
    try {
      const metrics = await vmService.getVMMetrics(vmId, timeRange);
      setResourceMetrics(metrics);
      return metrics;
    } catch (error) {
      console.error(`Error fetching VM metrics for ${vmId}:`, error);
      throw error;
    }
  }, []);

  /**
   * Thực hiện các action trên VM (start, stop, restart, etc.)
   * @param {string} vmId ID của máy ảo
   * @param {string} action Hành động cần thực hiện
   */
  const performVMAction = useCallback(async (vmId, action) => {
    dispatch({ 
      type: 'VM_ACTION_REQUEST', 
      payload: { vmId, action } 
    });
    
    try {
      let response;
      let updatedData = {};
      
      switch (action) {
        case VM_ACTIONS.START:
          response = await vmService.startVM(vmId);
          updatedData = { status: VM_STATUS.RUNNING };
          break;
        case VM_ACTIONS.STOP:
          response = await vmService.stopVM(vmId);
          updatedData = { status: VM_STATUS.STOPPED };
          break;
        case VM_ACTIONS.RESTART:
          response = await vmService.restartVM(vmId);
          updatedData = { status: VM_STATUS.RUNNING };
          break;
        case VM_ACTIONS.TERMINATE:
          response = await vmService.terminateVM(vmId);
          // VM sẽ được xóa khỏi danh sách sau khi fetch lại
          updatedData = { status: VM_STATUS.TERMINATED };
          break;
        default:
          throw new Error(`Unsupported VM action: ${action}`);
      }
      
      dispatch({ 
        type: 'VM_ACTION_SUCCESS', 
        payload: { 
          vmId, 
          action, 
          updatedData,
          response 
        } 
      });
      
      // Refresh danh sách VM sau một số action quan trọng
      if ([VM_ACTIONS.TERMINATE].includes(action)) {
        await fetchVMs();
      }
      
      return response;
    } catch (error) {
      dispatch({ 
        type: 'VM_ACTION_FAILURE', 
        payload: { 
          vmId, 
          action, 
          error: error.message 
        } 
      });
      throw error;
    }
  }, [fetchVMs]);

  /**
   * Tạo máy ảo mới
   * @param {Object} vmData Dữ liệu cho máy ảo mới
   */
  const createVM = useCallback(async (vmData) => {
    try {
      const newVM = await vmService.createVM(vmData);
      // Refresh danh sách VM sau khi tạo mới
      await fetchVMs();
      return newVM;
    } catch (error) {
      console.error('Error creating VM:', error);
      throw error;
    }
  }, [fetchVMs]);

  // Lấy danh sách VM khi component được mount
  useEffect(() => {
    fetchVMs();
  }, [fetchVMs]);

  // Value object chứa tất cả state và functions sẽ được chia sẻ qua context
  const contextValue = {
    vms: state.vms,
    filteredVms: state.filteredVms,
    selectedVM: state.selectedVM,
    isLoading: state.isLoading,
    actionLoading: state.actionLoading,
    error: state.error,
    filters: state.filters,
    resourceMetrics,
    fetchVMs,
    filterVMs,
    getVMDetail,
    fetchVMMetrics,
    performVMAction,
    createVM,
    vmStatus: VM_STATUS,
    vmActions: VM_ACTIONS,
    providers: PROVIDERS
  };

  return (
    <VMContext.Provider value={contextValue}>
      {children}
    </VMContext.Provider>
  );
};

export default VMContext;