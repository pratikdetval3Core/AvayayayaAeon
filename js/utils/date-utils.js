/**
 * Date Formatting Utilities
 */

/**
 * Format a date to YYYY-MM-DD
 * @param {Date|string} date - Date object or date string
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return '';
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a date to DD/MM/YYYY
 * @param {Date|string} date - Date object or date string
 * @returns {string} Formatted date string
 */
export function formatDateDisplay(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return '';
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format a date and time to DD/MM/YYYY HH:MM
 * @param {Date|string} date - Date object or date string
 * @returns {string} Formatted datetime string
 */
export function formatDateTime(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return '';
  }
  const dateStr = formatDateDisplay(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}`;
}

/**
 * Format time to HH:MM:SS
 * @param {Date|string} date - Date object or date string
 * @returns {string} Formatted time string
 */
export function formatTime(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return '';
  }
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format time to HH:MM (12-hour format with AM/PM)
 * @param {Date|string} date - Date object or date string
 * @returns {string} Formatted time string
 */
export function formatTime12Hour(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return '';
  }
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Get current date as YYYY-MM-DD
 * @returns {string} Current date string
 */
export function getCurrentDate() {
  return formatDate(new Date());
}

/**
 * Get current timestamp
 * @returns {number} Current timestamp in milliseconds
 */
export function getCurrentTimestamp() {
  return Date.now();
}

/**
 * Calculate difference between two dates in days
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {number} Number of days
 */
export function getDaysDifference(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Calculate hours between two timestamps
 * @param {Date|string|number} startTime - Start time
 * @param {Date|string|number} endTime - End time
 * @returns {number} Hours worked (rounded to 2 decimals)
 */
export function calculateHours(startTime, endTime) {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const diffMs = end - start;
  const hours = diffMs / (1000 * 60 * 60);
  return Math.round(hours * 100) / 100;
}

/**
 * Check if a date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is today
 */
export function isToday(date) {
  const d = new Date(date);
  const today = new Date();
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
}

/**
 * Check if end date is after start date
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {boolean} True if end date is after start date
 */
export function isEndDateAfterStartDate(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return end >= start;
}

/**
 * Get date range as array of date strings
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {string[]} Array of date strings (YYYY-MM-DD)
 */
export function getDateRange(startDate, endDate) {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(formatDate(d));
  }
  
  return dates;
}
