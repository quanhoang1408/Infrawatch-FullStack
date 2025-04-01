// DatePicker.jsx
import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import InputWithIcon from './InputWithIcon';

/**
 * Custom date picker component
 * @param {string} value - Selected date in ISO format (YYYY-MM-DD)
 * @param {function} onChange - Change handler
 * @param {string} placeholder - Input placeholder
 * @param {boolean} disabled - Whether the date picker is disabled
 * @param {string} minDate - Minimum selectable date
 * @param {string} maxDate - Maximum selectable date
 * @param {boolean} showWeekNumbers - Whether to show week numbers
 */
const DatePicker = ({
  value,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  minDate,
  maxDate,
  showWeekNumbers = false,
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-date-picker';
  const classes = [
    baseClass,
    disabled ? `${baseClass}--disabled` : '',
    className
  ].filter(Boolean).join(' ');
  
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    return value ? new Date(value) : new Date();
  });
  
  const containerRef = useRef(null);
  
  // Format date as YYYY-MM-DD
  const formatDate = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };
  
  // Parse date from YYYY-MM-DD
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  
  // Display formatted date
  const getDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    
    const date = parseDate(dateStr);
    if (!date) return '';
    
    return date.toLocaleDateString();
  };
  
  // Get all dates for the current month view
  const getDatesForMonth = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Get the days from previous month to fill the first week
    const prevMonthDays = [];
    if (firstDayOfWeek > 0) {
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevMonthYear = month === 0 ? year - 1 : year;
      const prevMonthLastDay = new Date(prevMonthYear, prevMonth + 1, 0).getDate();
      
      for (let i = 0; i < firstDayOfWeek; i++) {
        prevMonthDays.unshift({
          date: new Date(prevMonthYear, prevMonth, prevMonthLastDay - i),
          isCurrentMonth: false
        });
      }
    }
    
    // Get the days for the current month
    const currentMonthDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
      currentMonthDays.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Get the days from next month to fill the last week
    const nextMonthDays = [];
    const totalDays = prevMonthDays.length + currentMonthDays.length;
    const remainingDays = 42 - totalDays; // 6 rows of 7 days
    
    if (remainingDays > 0) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextMonthYear = month === 11 ? year + 1 : year;
      
      for (let i = 1; i <= remainingDays; i++) {
        nextMonthDays.push({
          date: new Date(nextMonthYear, nextMonth, i),
          isCurrentMonth: false
        });
      }
    }
    
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };
  
  // Check if a date is between min and max dates
  const isDateInRange = (date) => {
    if (!date) return true;
    
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    
    if (minDate) {
      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);
      if (d < min) return false;
    }
    
    if (maxDate) {
      const max = new Date(maxDate);
      max.setHours(0, 0, 0, 0);
      if (d > max) return false;
    }
    
    return true;
  };
  
  // Get week number for a date
  const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };
  
  // Handle calendar toggle
  const toggleCalendar = () => {
    if (!disabled) {
      setCalendarVisible(!calendarVisible);
    }
  };
  
  // Handle date selection
  const handleDateSelect = (date) => {
    if (isDateInRange(date)) {
      onChange?.(formatDate(date));
      setCalendarVisible(false);
    }
  };
  
  // Navigate to previous month
  const goToPrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };
  
  // Handle input change
  const handleInputChange = (e) => {
    const dateStr = e.target.value;
    onChange?.(dateStr);
    
    if (dateStr) {
      const date = parseDate(dateStr);
      if (date) {
        setViewDate(date);
      }
    }
  };
  
  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setCalendarVisible(false);
      }
    };
    
    if (calendarVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [calendarVisible]);
  
  // Days of the week
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  
  // Get month name
  const getMonthName = (month) => {
    return new Date(2000, month, 1).toLocaleString('default', { month: 'long' });
  };
  
  // Generate calendar days
  const calendarDays = getDatesForMonth(viewDate.getFullYear(), viewDate.getMonth());

  return (
    <div className={classes} ref={containerRef} {...rest}>
      <InputWithIcon
        type="text"
        value={getDisplayDate(value)}
        onChange={() => {}}
        onClick={toggleCalendar}
        placeholder={placeholder}
        readOnly
        disabled={disabled}
        icon={<i className="icon-calendar" />}
        iconPosition="right"
      />
      
      <input
        type="date"
        className={`${baseClass}__hidden-input`}
        value={value || ''}
        onChange={handleInputChange}
        min={minDate}
        max={maxDate}
        disabled={disabled}
      />
      
      {calendarVisible && (
        <div className={`${baseClass}__calendar`}>
          <div className={`${baseClass}__calendar-header`}>
            <button
              type="button"
              className={`${baseClass}__nav-button`}
              onClick={goToPrevMonth}
            >
              <i className="icon-chevron-left" />
            </button>
            
            <div className={`${baseClass}__month-year`}>
              {getMonthName(viewDate.getMonth())} {viewDate.getFullYear()}
            </div>
            
            <button
              type="button"
              className={`${baseClass}__nav-button`}
              onClick={goToNextMonth}
            >
              <i className="icon-chevron-right" />
            </button>
          </div>
          
          <div className={`${baseClass}__calendar-body`}>
            <div className={`${baseClass}__weekdays`}>
              {showWeekNumbers && (
                <div className={`${baseClass}__weekday ${baseClass}__weeknumber-header`}>
                  #
                </div>
              )}
              
              {daysOfWeek.map((day) => (
                <div key={day} className={`${baseClass}__weekday`}>
                  {day}
                </div>
              ))}
            </div>
            
            <div className={`${baseClass}__days`}>
              {showWeekNumbers && calendarDays.length > 0 && (
                <>
                  {Array.from({ length: 6 }).map((_, weekIndex) => {
                    const weekDate = calendarDays[weekIndex * 7].date;
                    return (
                      <div 
                        key={`week-${weekIndex}`} 
                        className={`${baseClass}__weeknumber`}
                      >
                        {getWeekNumber(weekDate)}
                      </div>
                    );
                  })}
                </>
              )}
              
              {calendarDays.map(({ date, isCurrentMonth }, index) => {
                const dateStr = formatDate(date);
                const isSelected = value === dateStr;
                const isToday = formatDate(new Date()) === dateStr;
                const isDisabled = !isDateInRange(date);
                
                return (
                  <div
                    key={`day-${index}`}
                    className={`
                      ${baseClass}__day
                      ${isCurrentMonth ? '' : `${baseClass}__day--outside`}
                      ${isSelected ? `${baseClass}__day--selected` : ''}
                      ${isToday ? `${baseClass}__day--today` : ''}
                      ${isDisabled ? `${baseClass}__day--disabled` : ''}
                    `}
                    onClick={() => !isDisabled && handleDateSelect(date)}
                  >
                    {date.getDate()}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className={`${baseClass}__calendar-footer`}>
            <button
              type="button"
              className={`${baseClass}__today-button`}
              onClick={() => handleDateSelect(new Date())}
              disabled={!isDateInRange(new Date())}
            >
              Today
            </button>
            
            <button
              type="button"
              className={`${baseClass}__clear-button`}
              onClick={() => onChange?.('')}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

DatePicker.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  minDate: PropTypes.string,
  maxDate: PropTypes.string,
  showWeekNumbers: PropTypes.bool,
  className: PropTypes.string
};

export default DatePicker;
