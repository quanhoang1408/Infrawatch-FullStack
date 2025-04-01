// VMFilterBar.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Search, Button, Dropdown } from '../common';
import ProviderIcon from './ProviderIcon';

/**
 * Filter bar for VM list
 * @param {array} providers - Available providers
 * @param {array} statuses - Available VM statuses
 * @param {array} types - Available VM types
 * @param {object} filters - Current filter values
 * @param {function} onFilterChange - Handler for filter changes
 * @param {function} onSearch - Handler for search changes
 * @param {function} onCreateVM - Handler for create VM button
 */
const VMFilterBar = ({
  providers = [],
  statuses = [],
  types = [],
  filters = {},
  onFilterChange,
  onSearch,
  onCreateVM,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-vm-filter-bar';
  const classes = [baseClass, className].filter(Boolean).join(' ');
  
  // Local filter state
  const [localFilters, setLocalFilters] = useState(filters);
  
  // Handle filter change
  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange?.(newFilters);
  };
  
  // Handle search
  const handleSearch = (query) => {
    onSearch?.(query);
  };
  
  // Render provider filter dropdown
  const renderProviderFilter = () => (
    <Dropdown
      trigger={
        <Button
          variant="outline"
          size="sm"
          icon={<i className="icon-cloud" />}
          iconPosition="left"
        >
          {localFilters.provider ? (
            <>
              <ProviderIcon provider={localFilters.provider} />
              <span style={{ marginLeft: '4px' }}>
                {providers.find(p => p.id === localFilters.provider)?.name || 'Provider'}
              </span>
            </>
          ) : (
            'All Providers'
          )}
          <i className="icon-chevron-down" style={{ marginLeft: '4px' }} />
        </Button>
      }
      placement="bottom-left"
    >
      <Dropdown.Item onClick={() => handleFilterChange('provider', null)}>
        All Providers
      </Dropdown.Item>
      
      <Dropdown.Divider />
      
      {providers.map(provider => (
        <Dropdown.Item 
          key={provider.id}
          onClick={() => handleFilterChange('provider', provider.id)}
        >
          <div className={`${baseClass}__provider-item`}>
            <ProviderIcon provider={provider.id} />
            <span>{provider.name}</span>
          </div>
        </Dropdown.Item>
      ))}
    </Dropdown>
  );
  
  // Render status filter dropdown
  const renderStatusFilter = () => (
    <Dropdown
      trigger={
        <Button
          variant="outline"
          size="sm"
          icon={<i className="icon-activity" />}
          iconPosition="left"
        >
          {localFilters.status || 'All Statuses'}
          <i className="icon-chevron-down" style={{ marginLeft: '4px' }} />
        </Button>
      }
      placement="bottom-left"
    >
      <Dropdown.Item onClick={() => handleFilterChange('status', null)}>
        All Statuses
      </Dropdown.Item>
      
      <Dropdown.Divider />
      
      {statuses.map(status => (
        <Dropdown.Item 
          key={status.id}
          onClick={() => handleFilterChange('status', status.id)}
        >
          {status.name}
        </Dropdown.Item>
      ))}
    </Dropdown>
  );
  
  // Render type filter dropdown
  const renderTypeFilter = () => (
    <Dropdown
      trigger={
        <Button
          variant="outline"
          size="sm"
          icon={<i className="icon-server" />}
          iconPosition="left"
        >
          {localFilters.type || 'All Types'}
          <i className="icon-chevron-down" style={{ marginLeft: '4px' }} />
        </Button>
      }
      placement="bottom-left"
    >
      <Dropdown.Item onClick={() => handleFilterChange('type', null)}>
        All Types
      </Dropdown.Item>
      
      <Dropdown.Divider />
      
      {types.map(type => (
        <Dropdown.Item 
          key={type.id}
          onClick={() => handleFilterChange('type', type.id)}
        >
          {type.name}
        </Dropdown.Item>
      ))}
    </Dropdown>
  );
  
  return (
    <div className={classes} {...rest}>
      <div className={`${baseClass}__filters`}>
        <div className={`${baseClass}__search`}>
          <Search
            placeholder="Search VMs..."
            onSearch={handleSearch}
            defaultValue={filters.search || ''}
          />
        </div>
        
        <div className={`${baseClass}__filter-dropdowns`}>
          {renderProviderFilter()}
          {renderStatusFilter()}
          {renderTypeFilter()}
        </div>
      </div>
      
      <div className={`${baseClass}__actions`}>
        <Button
          variant="primary"
          icon={<i className="icon-plus" />}
          onClick={onCreateVM}
        >
          Create VM
        </Button>
      </div>
    </div>
  );
};

VMFilterBar.propTypes = {
  providers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ),
  statuses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ),
  types: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ),
  filters: PropTypes.object,
  onFilterChange: PropTypes.func,
  onSearch: PropTypes.func,
  onCreateVM: PropTypes.func,
  className: PropTypes.string
};

export default VMFilterBar;