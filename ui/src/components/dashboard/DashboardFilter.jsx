// DashboardFilter.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Dropdown } from '../common';

/**
 * Filter component for the dashboard
 * @param {array} providers - Available providers
 * @param {array} selectedProviders - Selected providers
 * @param {function} onFilterChange - Handler for filter changes
 */
const DashboardFilter = ({
  providers = [],
  selectedProviders = [],
  onFilterChange,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-dashboard-filter';
  const classes = [baseClass, className].filter(Boolean).join(' ');
  
  const [timeRange, setTimeRange] = useState('24h');
  const [localSelectedProviders, setLocalSelectedProviders] = useState(selectedProviders);
  
  // Time range options
  const timeRangeOptions = [
    { key: '1h', label: 'Last hour' },
    { key: '24h', label: 'Last 24 hours' },
    { key: '7d', label: 'Last 7 days' },
    { key: '30d', label: 'Last 30 days' }
  ];
  
  // Handle time range change
  const handleTimeRangeChange = (range) => {
    setTimeRange(range.key);
    onFilterChange?.({ timeRange: range.key, providers: localSelectedProviders });
  };
  
  // Handle provider selection change
  const handleProviderChange = (provider, checked) => {
    let newSelectedProviders;
    
    if (checked) {
      newSelectedProviders = [...localSelectedProviders, provider];
    } else {
      newSelectedProviders = localSelectedProviders.filter(p => p !== provider);
    }
    
    setLocalSelectedProviders(newSelectedProviders);
    onFilterChange?.({ timeRange, providers: newSelectedProviders });
  };
  
  // Handle "select all" providers
  const handleSelectAllProviders = () => {
    const allProviders = providers.map(p => p.id);
    setLocalSelectedProviders(allProviders);
    onFilterChange?.({ timeRange, providers: allProviders });
  };
  
  // Handle "clear all" providers
  const handleClearAllProviders = () => {
    setLocalSelectedProviders([]);
    onFilterChange?.({ timeRange, providers: [] });
  };
  
  // Provider filter dropdown
  const renderProviderFilter = () => (
    <Dropdown
      trigger={
        <Button
          variant="outline"
          size="sm"
          icon={<i className="icon-filter" />}
          iconPosition="left"
        >
          Providers
          <i className="icon-chevron-down" style={{ marginLeft: '4px' }} />
        </Button>
      }
      placement="bottom-left"
      closeOnClick={false}
    >
      <div className={`${baseClass}__provider-dropdown`}>
        <div className={`${baseClass}__provider-actions`}>
          <Button
            variant="text"
            size="sm"
            onClick={handleSelectAllProviders}
          >
            Select All
          </Button>
          <Button
            variant="text"
            size="sm"
            onClick={handleClearAllProviders}
          >
            Clear All
          </Button>
        </div>
        
        <div className={`${baseClass}__provider-list`}>
          {providers.map(provider => (
            <label key={provider.id} className={`${baseClass}__provider-item`}>
              <input
                type="checkbox"
                checked={localSelectedProviders.includes(provider.id)}
                onChange={(e) => handleProviderChange(provider.id, e.target.checked)}
              />
              <span>{provider.name}</span>
            </label>
          ))}
        </div>
      </div>
    </Dropdown>
  );
  
  // Time range filter dropdown
  const renderTimeRangeFilter = () => (
    <Dropdown
      trigger={
        <Button
          variant="outline"
          size="sm"
          icon={<i className="icon-calendar" />}
          iconPosition="left"
        >
          {timeRangeOptions.find(r => r.key === timeRange)?.label || 'Time Range'}
          <i className="icon-chevron-down" style={{ marginLeft: '4px' }} />
        </Button>
      }
      placement="bottom-left"
    >
      {timeRangeOptions.map(range => (
        <Dropdown.Item 
          key={range.key}
          onClick={() => handleTimeRangeChange(range)}
        >
          {range.label}
        </Dropdown.Item>
      ))}
    </Dropdown>
  );
  
  return (
    <div className={classes} {...rest}>
      <div className={`${baseClass}__filters`}>
        {renderProviderFilter()}
        {renderTimeRangeFilter()}
      </div>
    </div>
  );
};

DashboardFilter.propTypes = {
  providers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ),
  selectedProviders: PropTypes.arrayOf(PropTypes.string),
  onFilterChange: PropTypes.func,
  className: PropTypes.string
};

export default DashboardFilter;
