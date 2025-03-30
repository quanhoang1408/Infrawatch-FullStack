import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

// Add plugins
dayjs.extend(relativeTime);
dayjs.locale('vi');

/**
 * Format date as relative time (e.g. "a few seconds ago")
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date
 */
export const formatRelativeTime = (date) => {
  return dayjs(date).fromNow();
};

/**
 * Format date as standard date string
 * @param {string|Date} date - Date to format
 * @param {string} format - Date format (default: DD/MM/YYYY HH:mm)
 * @returns {string} - Formatted date
 */
export const formatDate = (date, format = 'DD/MM/YYYY HH:mm') => {
  return dayjs(date).format(format);
};

/**
 * Format date as time only
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted time
 */
export const formatTime = (date) => {
  return dayjs(date).format('HH:mm:ss');
};

/**
 * Check if date is today
 * @param {string|Date} date - Date to check
 * @returns {boolean} - True if date is today
 */
export const isToday = (date) => {
  return dayjs(date).isSame(dayjs(), 'day');
};

/**
 * Check if date is yesterday
 * @param {string|Date} date - Date to check
 * @returns {boolean} - True if date is yesterday
 */
export const isYesterday = (date) => {
  return dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day');
};

/**
 * Get time difference in milliseconds
 * @param {string|Date} date1 - First date
 * @param {string|Date} date2 - Second date (default: now)
 * @returns {number} - Difference in milliseconds
 */
export const getTimeDifference = (date1, date2 = new Date()) => {
  return dayjs(date2).diff(dayjs(date1));
};

/**
 * Format duration in milliseconds to human readable format
 * @param {number} duration - Duration in milliseconds
 * @returns {string} - Formatted duration
 */
export const formatDuration = (duration) => {
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  const days = Math.floor(duration / (1000 * 60 * 60 * 24));
  
  const parts = [];
  
  if (days > 0) {
    parts.push(`${days} ngày`);
  }
  
  if (hours > 0) {
    parts.push(`${hours} giờ`);
  }
  
  if (minutes > 0) {
    parts.push(`${minutes} phút`);
  }
  
  if (seconds > 0 && parts.length === 0) {
    parts.push(`${seconds} giây`);
  }
  
  return parts.join(', ');
};

/**
 * Format date intelligently based on how recent it is
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date
 */
export const formatDateIntelligently = (date) => {
  if (isToday(date)) {
    return `Hôm nay, ${formatTime(date)}`;
  } else if (isYesterday(date)) {
    return `Hôm qua, ${formatTime(date)}`;
  } else if (dayjs(date).isAfter(dayjs().subtract(7, 'day'))) {
    return formatRelativeTime(date);
  } else {
    return formatDate(date);
  }
};