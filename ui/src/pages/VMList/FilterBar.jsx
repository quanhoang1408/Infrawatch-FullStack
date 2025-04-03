import React, { useState, useEffect } from 'react';
import { useDebounce } from '../../hooks';

/**
 * Component thanh lọc cho danh sách máy ảo
 * 
 * @param {Object} props - Props component
 * @param {Object} props.filters - Bộ lọc hiện tại
 * @param {Function} props.onFilterChange - Callback khi bộ lọc thay đổi
 * @param {Function} props.onClearFilters - Callback khi xóa bộ lọc
 * @returns {JSX.Element} Component thanh lọc
 */
const FilterBar = ({ filters, onFilterChange, onClearFilters }) => {
  const [searchText, setSearchText] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchText, 500);
  const [activeFilters, setActiveFilters] = useState(0);

  // Áp dụng tìm kiếm sau khi debounce
  useEffect(() => {
    onFilterChange({ search: debouncedSearch });
  }, [debouncedSearch, onFilterChange]);

  // Đếm số lượng bộ lọc đang active
  useEffect(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status) count++;
    if (filters.provider) count++;
    if (filters.sortBy !== 'name' || filters.sortOrder !== 'asc') count++;
    setActiveFilters(count);
  }, [filters]);

  /**
   * Xử lý khi thay đổi trạng thái lọc
   * 
   * @param {string} status - Trạng thái lọc mới
   */
  const handleStatusChange = (status) => {
    onFilterChange({ status: status === 'all' ? null : status });
  };

  /**
   * Xử lý khi thay đổi nhà cung cấp lọc
   * 
   * @param {string} provider - Nhà cung cấp lọc mới
   */
  const handleProviderChange = (provider) => {
    onFilterChange({ provider: provider === 'all' ? null : provider });
  };

  /**
   * Xử lý khi thay đổi sắp xếp
   * 
   * @param {string} sortBy - Trường sắp xếp
   */
  const handleSortChange = (sortBy) => {
    // Nếu đã sắp xếp theo trường này, đảo ngược thứ tự
    if (sortBy === filters.sortBy) {
      onFilterChange({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      onFilterChange({ sortBy, sortOrder: 'asc' });
    }
  };

  return (
    <div className="filter-bar">
      <div className="filter-group search-group">
        <div className="search-input-wrapper">
          <i className="fas fa-search search-icon"></i>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc IP..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="search-input"
          />
          {searchText && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchText('')}
              aria-label="Xóa tìm kiếm"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      <div className="filter-group">
        <label htmlFor="status-filter">Trạng thái:</label>
        <select
          id="status-filter"
          value={filters.status || 'all'}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="filter-select"
        >
          <option value="all">Tất cả</option>
          <option value="running">Đang chạy</option>
          <option value="stopped">Đã dừng</option>
          <option value="starting">Đang khởi động</option>
          <option value="stopping">Đang dừng</option>
          <option value="error">Lỗi</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="provider-filter">Nhà cung cấp:</label>
        <select
          id="provider-filter"
          value={filters.provider || 'all'}
          onChange={(e) => handleProviderChange(e.target.value)}
          className="filter-select"
        >
          <option value="all">Tất cả</option>
          <option value="AWS">AWS</option>
          <option value="Azure">Azure</option>
          <option value="GCP">Google Cloud</option>
          <option value="VMware">VMware</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="sort-filter">Sắp xếp theo:</label>
        <div className="sort-controls">
          <select
            id="sort-filter"
            value={filters.sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="filter-select"
          >
            <option value="name">Tên</option>
            <option value="status">Trạng thái</option>
            <option value="provider">Nhà cung cấp</option>
            <option value="createdAt">Ngày tạo</option>
            <option value="cpuUsage">CPU</option>
            <option value="memoryUsage">Bộ nhớ</option>
          </select>
          <button
            className="sort-direction-btn"
            onClick={() => onFilterChange({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
            aria-label={filters.sortOrder === 'asc' ? 'Sắp xếp tăng dần' : 'Sắp xếp giảm dần'}
          >
            <i className={`fas fa-sort-${filters.sortOrder === 'asc' ? 'up' : 'down'}`}></i>
          </button>
        </div>
      </div>

      {activeFilters > 0 && (
        <div className="filter-actions">
          <button className="clear-filters-btn" onClick={onClearFilters}>
            <i className="fas fa-times"></i>
            <span>Xóa bộ lọc ({activeFilters})</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterBar;