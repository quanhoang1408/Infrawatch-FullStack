// TimeRangeSelector.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Dropdown } from '../common';
import '../styles/components/charts/TimeRangeSelector.scss';

/**
 * Time range selector component for charts
 * @param {function} onChange - Called when range changes
 * @param {array} ranges - Available time ranges
 * @param {string} defaultRange - Default selected range
 * @param {boolean} showCustomRange - Allow custom date range selection
 */
const TimeRangeSelector = ({
  onChange,
  ranges = [
    { key: '1h', label: 'Last hour' },
    { key: '24h', label: 'Last 24 hours' },
    { key: '7d', label: 'Last 7 days' },
    { key: '30d', label: 'Last 30 days' },
    { key: '90d', label: 'Last 90 days' }
  ],
  defaultRange = '24h',
  showCustomRange = true,
  className = '',
  ...rest
}) => {
  const [selectedRange, setSelectedRange] = useState(defaultRange);
  const [customVisible, setCustomVisible] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  
  const baseClass = 'iw-time-range-selector';
  const classes = [baseClass, className].filter(Boolean).join(' ');
  
  // Set default range on mount
  useEffect(() => {
    const range = ranges.find(r => r.key === defaultRange);
    if (range) {
      handleRangeChange(range);
    }
  }, []);
  
  const handleRangeChange = (range) => {
    setSelectedRange(range.key);
    setCustomVisible(false);
    
    // Calculate actual date range based on range key
    const end = new Date();
    let start;
    
    switch (range.key) {
      case '1h':
        start = new Date(end.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    }
    
    onChange?.({ 
      key: range.key, 
      label: range.label,
      start,
      end
    });
  };
  
  const handleShowCustomRange = () => {
    setCustomVisible(true);
    
    // Set default custom range to today and yesterday
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Format dates for input fields (YYYY-MM-DD)
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };
    
    setCustomStart(formatDate(yesterday));
    setCustomEnd(formatDate(today));
  };
  
  const handleCustomRangeApply = () => {
    const start = new Date(customStart);
    const end = new Date(customEnd);
    
    // Add time to end date to include the entire day
    end.setHours(23, 59, 59, 999);
    
    // Only apply if dates are valid and start is before end
    if (start && end && start <= end) {
      setSelectedRange('custom');
      setCustomVisible(false);
      
      // Calculate difference in days for the label
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      onChange?.({
        key: 'custom',
        label: `Custom (${diffDays} days)`,
        start,
        end
      });
    }
  };
  
  const selectedRangeLabel = (() => {
    if (selectedRange === 'custom') {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `Custom (${diffDays} days)`;
    }
    
    const range = ranges.find(r => r.key === selectedRange);
    return range ? range.label : 'Select range';
  })();
  
  const renderRangeOptions = () => {
    return (
      <>
        {ranges.map((range) => (
          <Dropdown.Item 
            key={range.key}
            onClick={() => handleRangeChange(range)}
          >
            {range.label}
          </Dropdown.Item>
        ))}
        
        {showCustomRange && (
          <>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleShowCustomRange}>
              Custom Range...
            </Dropdown.Item>
          </>
        )}
      </>
    );
  };
  
  return (
    <div className={classes} {...rest}>
      {customVisible ? (
        <div className={`${baseClass}__custom-range`}>
          <div className={`${baseClass}__date-inputs`}>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className={`${baseClass}__date-input`}
            />
            <span className={`${baseClass}__date-separator`}>to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className={`${baseClass}__date-input`}
            />
          </div>
          <div className={`${baseClass}__custom-actions`}>
            <Button
              variant="text"
              size="sm"
              onClick={() => setCustomVisible(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCustomRangeApply}
            >
              Apply
            </Button>
          </div>
        </div>
      ) : (
        <Dropdown
          trigger={
            <Button
              variant="outline"
              size="sm"
              className={`${baseClass}__dropdown-trigger`}
              icon={<i className="icon-calendar" />}
              iconPosition="left"
            >
              {selectedRangeLabel}
              <i className="icon-chevron-down" style={{ marginLeft: '4px' }} />
            </Button>
          }
          placement="bottom-right"
        >
          {renderRangeOptions()}
        </Dropdown>
      )}
    </div>
  );
};

TimeRangeSelector.propTypes = {
  onChange: PropTypes.func,
  ranges: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  defaultRange: PropTypes.string,
  showCustomRange: PropTypes.bool,
  className: PropTypes.string
};

export default TimeRangeSelector;