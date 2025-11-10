/**
 * Centralized Error Handling System
 */

/**
 * Error types enumeration
 */
export const ErrorTypes = {
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  GEOLOCATION: 'geolocation',
  CAMERA: 'camera',
  STORAGE: 'storage',
  NETWORK: 'network',
  UNKNOWN: 'unknown'
};

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(message, type = ErrorTypes.UNKNOWN, severity = ErrorSeverity.ERROR, details = null) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Geolocation error handler
 * @param {GeolocationPositionError} error - Geolocation error object
 * @returns {AppError} Formatted application error
 */
export function handleGeolocationError(error) {
  let message = 'Unable to get your location';
  let details = null;
  
  switch (error.code) {
    case error.PERMISSION_DENIED:
      message = 'Location access denied. Please enable location permissions in your browser settings.';
      details = 'User denied the request for geolocation';
      break;
    case error.POSITION_UNAVAILABLE:
      message = 'Location information is unavailable. Please check your device settings.';
      details = 'Location information is unavailable';
      break;
    case error.TIMEOUT:
      message = 'Location request timed out. Please try again.';
      details = 'The request to get user location timed out';
      break;
    default:
      message = 'An unknown error occurred while getting your location.';
      details = error.message;
  }
  
  return new AppError(message, ErrorTypes.GEOLOCATION, ErrorSeverity.WARNING, details);
}

/**
 * Camera error handler
 * @param {Error} error - Camera/media error object
 * @returns {AppError} Formatted application error
 */
export function handleCameraError(error) {
  let message = 'Unable to access camera';
  let details = error.message;
  
  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    message = 'Camera access denied. Please enable camera permissions in your browser settings.';
  } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    message = 'No camera found on your device. Please use file upload instead.';
  } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
    message = 'Camera is already in use by another application.';
  } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
    message = 'Camera does not meet the required specifications.';
  } else if (error.name === 'NotSupportedError') {
    message = 'Camera is not supported on this device or browser.';
  } else if (error.name === 'TypeError') {
    message = 'Camera access is not supported in this context. Please use HTTPS.';
  }
  
  return new AppError(message, ErrorTypes.CAMERA, ErrorSeverity.WARNING, details);
}

/**
 * Storage error handler
 * @param {Error} error - Storage error object
 * @returns {AppError} Formatted application error
 */
export function handleStorageError(error) {
  let message = 'Storage operation failed';
  let severity = ErrorSeverity.ERROR;
  let details = error.message;
  
  if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
    message = 'Storage quota exceeded. Please clear some data or free up space.';
    severity = ErrorSeverity.WARNING;
  } else if (error.name === 'SecurityError') {
    message = 'Storage access denied due to security restrictions.';
    severity = ErrorSeverity.ERROR;
  } else if (error.name === 'InvalidStateError') {
    message = 'Storage is not available. Please check your browser settings.';
    severity = ErrorSeverity.ERROR;
  } else if (error.name === 'DataError') {
    message = 'Invalid data provided for storage operation.';
    severity = ErrorSeverity.ERROR;
  } else if (error.name === 'NotFoundError') {
    message = 'Requested data not found in storage.';
    severity = ErrorSeverity.WARNING;
  }
  
  return new AppError(message, ErrorTypes.STORAGE, severity, details);
}

/**
 * Network error handler
 * @param {Error} error - Network error object
 * @returns {AppError} Formatted application error
 */
export function handleNetworkError(error) {
  let message = 'Network error occurred';
  let details = error.message;
  
  if (!navigator.onLine) {
    message = 'No internet connection. Please check your network settings.';
  } else if (error.message.includes('timeout')) {
    message = 'Request timed out. Please try again.';
  } else if (error.message.includes('fetch')) {
    message = 'Failed to fetch data. Please check your connection.';
  }
  
  return new AppError(message, ErrorTypes.NETWORK, ErrorSeverity.WARNING, details);
}

/**
 * Error logger
 */
class ErrorLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 100;
  }
  
  /**
   * Log an error
   * @param {AppError|Error} error - Error to log
   */
  log(error) {
    const logEntry = {
      timestamp: error.timestamp || new Date().toISOString(),
      message: error.message,
      type: error.type || ErrorTypes.UNKNOWN,
      severity: error.severity || ErrorSeverity.ERROR,
      details: error.details || error.stack,
      userAgent: navigator.userAgent
    };
    
    this.logs.push(logEntry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    // Log to console in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.error('[Error Log]', logEntry);
    }
    
    // Store in localStorage for persistence
    try {
      localStorage.setItem('app_error_logs', JSON.stringify(this.logs.slice(-20)));
    } catch (e) {
      // Ignore storage errors in error logger
    }
  }
  
  /**
   * Get all error logs
   * @returns {Array} Array of error log entries
   */
  getLogs() {
    return [...this.logs];
  }
  
  /**
   * Clear all error logs
   */
  clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem('app_error_logs');
    } catch (e) {
      // Ignore storage errors
    }
  }
  
  /**
   * Get logs by type
   * @param {string} type - Error type to filter by
   * @returns {Array} Filtered error logs
   */
  getLogsByType(type) {
    return this.logs.filter(log => log.type === type);
  }
  
  /**
   * Get logs by severity
   * @param {string} severity - Error severity to filter by
   * @returns {Array} Filtered error logs
   */
  getLogsBySeverity(severity) {
    return this.logs.filter(log => log.severity === severity);
  }
}

// Create singleton instance
export const errorLogger = new ErrorLogger();

/**
 * Centralized error handler
 * @param {Error|AppError} error - Error to handle
 * @param {object} options - Handler options
 * @param {boolean} options.showToUser - Whether to show error to user
 * @param {boolean} options.logError - Whether to log the error
 * @param {Function} options.callback - Optional callback function
 * @returns {AppError} Processed application error
 */
export function handleError(error, options = {}) {
  const {
    showToUser = true,
    logError = true,
    callback = null
  } = options;
  
  let appError;
  
  // Convert to AppError if needed
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof GeolocationPositionError) {
    appError = handleGeolocationError(error);
  } else if (error.name && error.name.includes('NotAllowedError')) {
    appError = handleCameraError(error);
  } else if (error.name && (error.name.includes('QuotaExceededError') || error.name.includes('StateError'))) {
    appError = handleStorageError(error);
  } else {
    appError = new AppError(
      error.message || 'An unexpected error occurred',
      ErrorTypes.UNKNOWN,
      ErrorSeverity.ERROR,
      error.stack
    );
  }
  
  // Log the error
  if (logError) {
    errorLogger.log(appError);
  }
  
  // Show to user if requested
  if (showToUser && window.showNotification) {
    window.showNotification(appError.message, 'error');
  }
  
  // Execute callback if provided
  if (callback && typeof callback === 'function') {
    callback(appError);
  }
  
  return appError;
}

/**
 * Async error wrapper
 * @param {Function} fn - Async function to wrap
 * @param {object} options - Error handler options
 * @returns {Function} Wrapped function
 */
export function asyncErrorHandler(fn, options = {}) {
  return async function(...args) {
    try {
      return await fn.apply(this, args);
    } catch (error) {
      handleError(error, options);
      throw error;
    }
  };
}

/**
 * Initialize error handler
 */
export function initErrorHandler() {
  // Load previous error logs from localStorage
  try {
    const savedLogs = localStorage.getItem('app_error_logs');
    if (savedLogs) {
      errorLogger.logs = JSON.parse(savedLogs);
    }
  } catch (e) {
    // Ignore errors loading logs
  }
  
  // Global error handler
  window.addEventListener('error', (event) => {
    handleError(new Error(event.message), {
      showToUser: false,
      logError: true
    });
  });
  
  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    handleError(new Error(event.reason), {
      showToUser: false,
      logError: true
    });
  });
}
