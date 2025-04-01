// Select.jsx
import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Custom select component
 * @param {string|number} value - Selected value
 * @param {function} onChange - Change handler
 * @param {array} options - Select options
 * @param {string} placeholder - Placeholder text
 * @param {boolean} disabled - Whether the select is disabled
 * @param {boolean} clearable - Whether the select can be cleared
 * @param {boolean} searchable - Whether the select is searchable
 * @param {boolean} loading - Whether the select is loading
 */
const Select = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  disabled = false,
  clearable = false,
  searchable = false,
  loading = false,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-select';
  const classes = [
    baseClass,
    disabled ? `${baseClass}--disabled` : '',
    className
  ].filter(Boolean).join(' ');
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  
  // Get selected option
  const selectedOption = options.find(option => 
    option.value === value || option.value === Number(value)
  );
  
  // Filter options based on search value
  const filteredOptions = searchable && searchValue
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchValue.toLowerCase())
      )
    : options;
  
  // Toggle dropdown
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };
  
  // Handle option selection
  const handleOptionSelect = (option) => {
    onChange?.(option.value);
    setIsOpen(false);
    setSearchValue('');
  };
  
  // Clear selection
  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.(null);
    setSearchValue('');
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
  };
  
  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={classes} ref={containerRef} {...rest}>
      <div
        className={`${baseClass}__control`}
        onClick={toggleDropdown}
      >
        <div className={`${baseClass}__value-container`}>
          {selectedOption ? (
            <div className={`${baseClass}__single-value`}>
              {selectedOption.label}
            </div>
          ) : (
            <div className={`${baseClass}__placeholder`}>
              {placeholder}
            </div>
          )}
        </div>
        
        <div className={`${baseClass}__indicators`}>
          {clearable && selectedOption && (
            <div
              className={`${baseClass}__clear-indicator`}
              onClick={handleClear}
            >
              <i className="icon-x" />
            </div>
          )}
          
          <div className={`${baseClass}__dropdown-indicator`}>
            <i className={`icon-chevron-${isOpen ? 'up' : 'down'}`} />
          </div>
        </div>
      </div>
      
      {isOpen && (
        <div className={`${baseClass}__menu`}>
          {searchable && (
            <div className={`${baseClass}__search`}>
              <input
                ref={searchInputRef}
                type="text"
                className={`${baseClass}__search-input`}
                value={searchValue}
                onChange={handleSearchChange}
                placeholder="Search..."
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          
          <div className={`${baseClass}__menu-list`}>
            {loading ? (
              <div className={`${baseClass}__loading`}>
                <i className="icon-loader" />
                <span>Loading...</span>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className={`${baseClass}__no-options`}>
                No options available
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`
                    ${baseClass}__option
                    ${option.value === value ? `${baseClass}__option--selected` : ''}
                  `}
                  onClick={() => handleOptionSelect(option)}
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

Select.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  clearable: PropTypes.bool,
  searchable: PropTypes.bool,
  loading: PropTypes.bool,
  className: PropTypes.string
};

export default Select;