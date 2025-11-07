/**
 * Data Validation Utilities
 */

import {
  sanitizeText,
  sanitizeEmail,
  sanitizeFileUpload,
  escapeHtml
} from './sanitization.js';

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with isValid and errors
 */
export function validatePassword(password) {
  const errors = [];
  
  if (!password || typeof password !== 'string') {
    return { isValid: false, errors: ['Password is required'] };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @returns {boolean} True if value is not empty
 */
export function isRequired(value) {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return true;
}

/**
 * Validate string length
 * @param {string} value - String to validate
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @returns {boolean} True if length is within range
 */
export function isValidLength(value, min = 0, max = Infinity) {
  if (typeof value !== 'string') {
    return false;
  }
  const length = value.trim().length;
  return length >= min && length <= max;
}

/**
 * Validate number range
 * @param {number} value - Number to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if number is within range
 */
export function isInRange(value, min = -Infinity, max = Infinity) {
  const num = Number(value);
  if (isNaN(num)) {
    return false;
  }
  return num >= min && num <= max;
}

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if valid date format
 */
export function isValidDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validate date range (end date must be after or equal to start date)
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {boolean} True if valid date range
 */
export function isValidDateRange(startDate, endDate) {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return false;
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  return end >= start;
}

/**
 * Validate file type
 * @param {File} file - File object to validate
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {boolean} True if file type is allowed
 */
export function isValidFileType(file, allowedTypes) {
  if (!file || !file.type) {
    return false;
  }
  return allowedTypes.includes(file.type);
}

/**
 * Validate file size
 * @param {File} file - File object to validate
 * @param {number} maxSizeInMB - Maximum file size in megabytes
 * @returns {boolean} True if file size is within limit
 */
export function isValidFileSize(file, maxSizeInMB) {
  if (!file || !file.size) {
    return false;
  }
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}

/**
 * Sanitize string input (remove HTML tags and special characters)
 * @param {string} input - String to sanitize
 * @returns {string} Sanitized string
 * @deprecated Use sanitizeText from sanitization.js instead
 */
export function sanitizeInput(input) {
  return sanitizeText(input);
}

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {object} Validation result with isValid and error
 */
export function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: 'Username is required' };
  }
  
  const trimmed = username.trim();
  
  if (trimmed.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' };
  }
  
  if (trimmed.length > 30) {
    return { isValid: false, error: 'Username must not exceed 30 characters' };
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, hyphens, and underscores' };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate coordinates (latitude and longitude)
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {boolean} True if valid coordinates
 */
export function isValidCoordinates(lat, lon) {
  const latitude = Number(lat);
  const longitude = Number(lon);
  
  if (isNaN(latitude) || isNaN(longitude)) {
    return false;
  }
  
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

/**
 * Validate file (combines type and size validation)
 * @param {File} file - File object to validate
 * @param {object} options - Validation options
 * @param {string[]} options.allowedTypes - Array of allowed MIME types
 * @param {number} options.maxSizeInMB - Maximum file size in megabytes
 * @returns {object} Validation result with isValid and error
 */
export function validateFile(file, options = {}) {
  const { allowedTypes = [], maxSizeInMB = 10 } = options;
  
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }
  
  // Use sanitization utility for comprehensive validation
  const allowedExtensions = options.allowedExtensions || [];
  const sanitizationResult = sanitizeFileUpload(file, {
    allowedTypes,
    allowedExtensions,
    maxSize: maxSizeInMB * 1024 * 1024
  });
  
  if (!sanitizationResult.isValid) {
    return {
      isValid: false,
      error: sanitizationResult.errors.join(', '),
      sanitizedFilename: sanitizationResult.sanitizedFilename
    };
  }
  
  return {
    isValid: true,
    error: null,
    sanitizedFilename: sanitizationResult.sanitizedFilename
  };
}

/**
 * Validate form data against rules
 * @param {object} data - Form data object
 * @param {object} rules - Validation rules object
 * @param {boolean} sanitize - Whether to sanitize inputs (default: true)
 * @returns {object} Validation result with isValid, errors, and sanitizedData
 */
export function validateForm(data, rules, sanitize = true) {
  const errors = {};
  const sanitizedData = {};
  let isValid = true;
  
  for (const field in rules) {
    let value = data[field];
    const fieldRules = rules[field];
    
    // Sanitize input if enabled
    if (sanitize && typeof value === 'string') {
      if (fieldRules.email) {
        value = sanitizeEmail(value);
      } else {
        value = sanitizeText(value, {
          maxLength: fieldRules.maxLength,
          allowNewlines: fieldRules.allowNewlines !== false
        });
      }
    }
    
    sanitizedData[field] = value;
    
    if (fieldRules.required && !isRequired(value)) {
      errors[field] = `${field} is required`;
      isValid = false;
      continue;
    }
    
    if (fieldRules.email && !isValidEmail(value)) {
      errors[field] = 'Invalid email format';
      isValid = false;
      continue;
    }
    
    if (fieldRules.minLength && !isValidLength(value, fieldRules.minLength)) {
      errors[field] = `${field} must be at least ${fieldRules.minLength} characters`;
      isValid = false;
      continue;
    }
    
    if (fieldRules.maxLength && !isValidLength(value, 0, fieldRules.maxLength)) {
      errors[field] = `${field} must not exceed ${fieldRules.maxLength} characters`;
      isValid = false;
      continue;
    }
    
    if (fieldRules.custom && typeof fieldRules.custom === 'function') {
      const customResult = fieldRules.custom(value);
      if (!customResult.isValid) {
        errors[field] = customResult.error;
        isValid = false;
      }
    }
  }
  
  return { isValid, errors, sanitizedData };
}

/**
 * Validate and sanitize form input
 * @param {HTMLFormElement} form - Form element
 * @param {object} rules - Validation rules
 * @returns {object} Validation result with sanitized data
 */
export function validateAndSanitizeForm(form, rules) {
  const formData = new FormData(form);
  const data = {};
  
  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }
  
  return validateForm(data, rules, true);
}
