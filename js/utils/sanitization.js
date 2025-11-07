/**
 * Input Sanitization Utilities
 * Provides functions to sanitize and validate user inputs to prevent XSS and injection attacks
 */

/**
 * HTML entities map for escaping
 */
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;'
};

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') {
    return '';
  }
  
  return str.replace(/[&<>"'\/]/g, (char) => HTML_ENTITIES[char]);
}

/**
 * Unescape HTML entities
 * @param {string} str - String to unescape
 * @returns {string} Unescaped string
 */
export function unescapeHtml(str) {
  if (typeof str !== 'string') {
    return '';
  }
  
  const textarea = document.createElement('textarea');
  textarea.innerHTML = str;
  return textarea.value;
}

/**
 * Strip all HTML tags from string
 * @param {string} str - String to strip
 * @returns {string} String without HTML tags
 */
export function stripHtmlTags(str) {
  if (typeof str !== 'string') {
    return '';
  }
  
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize text input by escaping HTML and trimming
 * @param {string} input - Input to sanitize
 * @param {object} options - Sanitization options
 * @returns {string} Sanitized input
 */
export function sanitizeText(input, options = {}) {
  const {
    maxLength = null,
    allowNewlines = true,
    trim = true,
    toLowerCase = false,
    toUpperCase = false
  } = options;
  
  if (typeof input !== 'string') {
    return '';
  }
  
  let sanitized = input;
  
  // Trim whitespace
  if (trim) {
    sanitized = sanitized.trim();
  }
  
  // Remove newlines if not allowed
  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]/g, ' ');
  }
  
  // Escape HTML
  sanitized = escapeHtml(sanitized);
  
  // Apply case transformation
  if (toLowerCase) {
    sanitized = sanitized.toLowerCase();
  } else if (toUpperCase) {
    sanitized = sanitized.toUpperCase();
  }
  
  // Truncate to max length
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Sanitize email address
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') {
    return '';
  }
  
  // Remove whitespace and convert to lowercase
  let sanitized = email.trim().toLowerCase();
  
  // Remove any HTML tags
  sanitized = stripHtmlTags(sanitized);
  
  // Remove any characters that aren't valid in email addresses
  sanitized = sanitized.replace(/[^a-z0-9@._+-]/g, '');
  
  return sanitized;
}

/**
 * Sanitize URL
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url) {
  if (typeof url !== 'string') {
    return '';
  }
  
  const sanitized = url.trim();
  
  // Check for javascript: protocol and other dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = sanitized.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      console.warn('Dangerous URL protocol detected:', protocol);
      return '';
    }
  }
  
  // Only allow http, https, and relative URLs
  if (sanitized.includes(':') && !sanitized.startsWith('http://') && !sanitized.startsWith('https://')) {
    return '';
  }
  
  return sanitized;
}

/**
 * Sanitize filename
 * @param {string} filename - Filename to sanitize
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(filename) {
  if (typeof filename !== 'string') {
    return '';
  }
  
  // Remove path separators and dangerous characters
  let sanitized = filename.replace(/[\/\\:*?"<>|]/g, '_');
  
  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop();
    const name = sanitized.substring(0, 255 - ext.length - 1);
    sanitized = `${name}.${ext}`;
  }
  
  return sanitized;
}

/**
 * Sanitize number input
 * @param {any} input - Input to sanitize
 * @param {object} options - Sanitization options
 * @returns {number|null} Sanitized number or null if invalid
 */
export function sanitizeNumber(input, options = {}) {
  const {
    min = null,
    max = null,
    decimals = null,
    allowNegative = true
  } = options;
  
  // Convert to number
  let num = Number(input);
  
  // Check if valid number
  if (isNaN(num) || !isFinite(num)) {
    return null;
  }
  
  // Check negative
  if (!allowNegative && num < 0) {
    num = 0;
  }
  
  // Apply min/max constraints
  if (min !== null && num < min) {
    num = min;
  }
  if (max !== null && num > max) {
    num = max;
  }
  
  // Round to specified decimals
  if (decimals !== null) {
    num = Number(num.toFixed(decimals));
  }
  
  return num;
}

/**
 * Sanitize integer input
 * @param {any} input - Input to sanitize
 * @param {object} options - Sanitization options
 * @returns {number|null} Sanitized integer or null if invalid
 */
export function sanitizeInteger(input, options = {}) {
  const num = sanitizeNumber(input, { ...options, decimals: 0 });
  return num !== null ? Math.floor(num) : null;
}

/**
 * Sanitize phone number
 * @param {string} phone - Phone number to sanitize
 * @returns {string} Sanitized phone number
 */
export function sanitizePhone(phone) {
  if (typeof phone !== 'string') {
    return '';
  }
  
  // Remove all non-digit characters except + at the start
  let sanitized = phone.trim();
  const hasPlus = sanitized.startsWith('+');
  sanitized = sanitized.replace(/\D/g, '');
  
  if (hasPlus) {
    sanitized = '+' + sanitized;
  }
  
  return sanitized;
}

/**
 * Sanitize date input
 * @param {any} input - Date input to sanitize
 * @returns {Date|null} Valid Date object or null
 */
export function sanitizeDate(input) {
  if (!input) {
    return null;
  }
  
  const date = new Date(input);
  
  // Check if valid date
  if (isNaN(date.getTime())) {
    return null;
  }
  
  return date;
}

/**
 * Sanitize object by sanitizing all string properties
 * @param {object} obj - Object to sanitize
 * @param {object} schema - Schema defining how to sanitize each field
 * @returns {object} Sanitized object
 */
export function sanitizeObject(obj, schema = {}) {
  if (typeof obj !== 'object' || obj === null) {
    return {};
  }
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const fieldSchema = schema[key] || { type: 'text' };
    
    switch (fieldSchema.type) {
      case 'text':
        sanitized[key] = sanitizeText(value, fieldSchema.options);
        break;
      case 'email':
        sanitized[key] = sanitizeEmail(value);
        break;
      case 'url':
        sanitized[key] = sanitizeUrl(value);
        break;
      case 'number':
        sanitized[key] = sanitizeNumber(value, fieldSchema.options);
        break;
      case 'integer':
        sanitized[key] = sanitizeInteger(value, fieldSchema.options);
        break;
      case 'phone':
        sanitized[key] = sanitizePhone(value);
        break;
      case 'date':
        sanitized[key] = sanitizeDate(value);
        break;
      case 'filename':
        sanitized[key] = sanitizeFilename(value);
        break;
      case 'html':
        sanitized[key] = escapeHtml(value);
        break;
      case 'raw':
        // No sanitization, use with caution
        sanitized[key] = value;
        break;
      default:
        sanitized[key] = sanitizeText(value);
    }
  }
  
  return sanitized;
}

/**
 * Validate and sanitize file upload
 * @param {File} file - File to validate
 * @param {object} options - Validation options
 * @returns {object} Validation result with sanitized filename
 */
export function sanitizeFileUpload(file, options = {}) {
  const {
    allowedTypes = [],
    allowedExtensions = [],
    maxSize = 10 * 1024 * 1024, // 10MB default
    minSize = 0
  } = options;
  
  const result = {
    isValid: true,
    errors: [],
    sanitizedFilename: '',
    file: null
  };
  
  if (!file || !(file instanceof File)) {
    result.isValid = false;
    result.errors.push('Invalid file');
    return result;
  }
  
  // Sanitize filename
  result.sanitizedFilename = sanitizeFilename(file.name);
  
  // Check file size
  if (file.size > maxSize) {
    result.isValid = false;
    result.errors.push(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
  }
  
  if (file.size < minSize) {
    result.isValid = false;
    result.errors.push(`File size is below minimum required size of ${minSize / 1024 / 1024}MB`);
  }
  
  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    result.isValid = false;
    result.errors.push(`File type ${file.type} is not allowed`);
  }
  
  // Check file extension
  if (allowedExtensions.length > 0) {
    const extension = result.sanitizedFilename.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      result.isValid = false;
      result.errors.push(`File extension .${extension} is not allowed`);
    }
  }
  
  // Check for double extensions (potential security risk)
  const parts = result.sanitizedFilename.split('.');
  if (parts.length > 2) {
    console.warn('File has multiple extensions:', result.sanitizedFilename);
  }
  
  result.file = file;
  
  return result;
}

/**
 * Sanitize form data
 * @param {FormData} formData - FormData object to sanitize
 * @param {object} schema - Schema defining how to sanitize each field
 * @returns {object} Sanitized data object
 */
export function sanitizeFormData(formData, schema = {}) {
  const sanitized = {};
  
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      // Handle file uploads separately
      sanitized[key] = value;
    } else {
      const fieldSchema = schema[key] || { type: 'text' };
      
      switch (fieldSchema.type) {
        case 'text':
          sanitized[key] = sanitizeText(value, fieldSchema.options);
          break;
        case 'email':
          sanitized[key] = sanitizeEmail(value);
          break;
        case 'url':
          sanitized[key] = sanitizeUrl(value);
          break;
        case 'number':
          sanitized[key] = sanitizeNumber(value, fieldSchema.options);
          break;
        case 'integer':
          sanitized[key] = sanitizeInteger(value, fieldSchema.options);
          break;
        case 'phone':
          sanitized[key] = sanitizePhone(value);
          break;
        case 'date':
          sanitized[key] = sanitizeDate(value);
          break;
        default:
          sanitized[key] = sanitizeText(value);
      }
    }
  }
  
  return sanitized;
}

/**
 * Prevent SQL injection (for future backend integration)
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
export function preventSqlInjection(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Escape single quotes
  let sanitized = input.replace(/'/g, "''");
  
  // Remove SQL keywords (basic protection)
  const sqlKeywords = [
    'DROP', 'DELETE', 'INSERT', 'UPDATE', 'SELECT',
    'UNION', 'EXEC', 'EXECUTE', 'SCRIPT', 'JAVASCRIPT'
  ];
  
  const upperInput = sanitized.toUpperCase();
  for (const keyword of sqlKeywords) {
    if (upperInput.includes(keyword)) {
      console.warn('Potential SQL injection attempt detected');
    }
  }
  
  return sanitized;
}

/**
 * Create a sanitization middleware for form submissions
 * @param {object} schema - Sanitization schema
 * @returns {Function} Middleware function
 */
export function createSanitizationMiddleware(schema) {
  return function(data) {
    return sanitizeObject(data, schema);
  };
}

/**
 * Sanitize content for safe display in HTML
 * @param {string} content - Content to sanitize
 * @param {object} options - Sanitization options
 * @returns {string} Sanitized content
 */
export function sanitizeForDisplay(content, options = {}) {
  const {
    allowLineBreaks = true,
    maxLength = null
  } = options;
  
  if (typeof content !== 'string') {
    return '';
  }
  
  let sanitized = escapeHtml(content);
  
  // Convert line breaks to <br> if allowed
  if (allowLineBreaks) {
    sanitized = sanitized.replace(/\n/g, '<br>');
  }
  
  // Truncate if needed
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '...';
  }
  
  return sanitized;
}

/**
 * Batch sanitize multiple inputs
 * @param {object} inputs - Object with input values
 * @param {object} schemas - Object with sanitization schemas for each input
 * @returns {object} Sanitized inputs
 */
export function batchSanitize(inputs, schemas) {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(inputs)) {
    const schema = schemas[key];
    
    if (schema) {
      if (typeof schema === 'function') {
        sanitized[key] = schema(value);
      } else if (typeof schema === 'object') {
        sanitized[key] = sanitizeObject({ value }, { value: schema }).value;
      } else {
        sanitized[key] = sanitizeText(value);
      }
    } else {
      sanitized[key] = sanitizeText(value);
    }
  }
  
  return sanitized;
}

// Export all sanitization functions
export default {
  escapeHtml,
  unescapeHtml,
  stripHtmlTags,
  sanitizeText,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeFilename,
  sanitizeNumber,
  sanitizeInteger,
  sanitizePhone,
  sanitizeDate,
  sanitizeObject,
  sanitizeFileUpload,
  sanitizeFormData,
  preventSqlInjection,
  createSanitizationMiddleware,
  sanitizeForDisplay,
  batchSanitize
};
