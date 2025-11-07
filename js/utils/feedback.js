/**
 * User Feedback Mechanisms
 * Provides toast notifications, alerts, confirmations, and form validation feedback
 */

import UIComponents from '../components/UIComponents.js';

/**
 * Toast notification system
 */
export class ToastNotification {
  /**
   * Show success toast
   * @param {string} message - Success message
   * @param {number} duration - Duration in milliseconds
   */
  static success(message, duration = 3000) {
    UIComponents.showToast({
      message,
      variant: 'success',
      duration
    });
  }
  
  /**
   * Show error toast
   * @param {string} message - Error message
   * @param {number} duration - Duration in milliseconds
   */
  static error(message, duration = 5000) {
    UIComponents.showToast({
      message,
      variant: 'error',
      duration
    });
  }
  
  /**
   * Show warning toast
   * @param {string} message - Warning message
   * @param {number} duration - Duration in milliseconds
   */
  static warning(message, duration = 4000) {
    UIComponents.showToast({
      message,
      variant: 'warning',
      duration
    });
  }
  
  /**
   * Show info toast
   * @param {string} message - Info message
   * @param {number} duration - Duration in milliseconds
   */
  static info(message, duration = 3000) {
    UIComponents.showToast({
      message,
      variant: 'info',
      duration
    });
  }
}

/**
 * Persistent alert system
 */
export class AlertSystem {
  /**
   * Show persistent alert
   * @param {Object} options - Alert configuration
   * @param {string} options.message - Alert message
   * @param {string} options.variant - Alert variant (success, error, warning, info)
   * @param {string} options.title - Optional alert title
   * @param {boolean} options.dismissible - Whether alert can be dismissed
   * @param {string} options.containerId - Container element ID to append alert
   * @returns {HTMLDivElement} Alert element
   */
  static show({ message, variant = 'info', title = '', dismissible = true, containerId = null }) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${variant}`;
    alert.setAttribute('role', 'alert');
    
    // Styling
    const colors = {
      success: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
      error: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
      warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
      info: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' }
    };
    
    const color = colors[variant] || colors.info;
    
    alert.style.cssText = `
      padding: var(--spacing-md);
      margin-bottom: var(--spacing-md);
      border-left: 4px solid ${color.border};
      background-color: ${color.bg};
      color: ${color.text};
      border-radius: var(--radius-md);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      animation: slideInAlert 0.3s ease-out;
    `;
    
    // Content
    const content = document.createElement('div');
    content.style.flex = '1';
    
    if (title) {
      const titleEl = document.createElement('div');
      titleEl.style.cssText = `
        font-weight: var(--font-weight-semibold);
        margin-bottom: var(--spacing-xs);
      `;
      titleEl.textContent = title;
      content.appendChild(titleEl);
    }
    
    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    content.appendChild(messageEl);
    
    alert.appendChild(content);
    
    // Dismiss button
    if (dismissible) {
      const dismissBtn = document.createElement('button');
      dismissBtn.innerHTML = '&times;';
      dismissBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: ${color.text};
        padding: 0;
        margin-left: var(--spacing-md);
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.7;
      `;
      dismissBtn.addEventListener('click', () => {
        alert.style.animation = 'slideOutAlert 0.3s ease-out';
        setTimeout(() => alert.remove(), 300);
      });
      alert.appendChild(dismissBtn);
    }
    
    // Append to container or body
    const container = containerId ? document.getElementById(containerId) : document.body;
    if (container) {
      if (containerId) {
        container.insertBefore(alert, container.firstChild);
      } else {
        container.appendChild(alert);
      }
    }
    
    // Add animations if not present
    if (!document.getElementById('alert-animations')) {
      const style = document.createElement('style');
      style.id = 'alert-animations';
      style.textContent = `
        @keyframes slideInAlert {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideOutAlert {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-20px);
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    return alert;
  }
  
  /**
   * Remove all alerts from a container
   * @param {string} containerId - Container element ID
   */
  static clearAll(containerId = null) {
    const container = containerId ? document.getElementById(containerId) : document.body;
    if (container) {
      const alerts = container.querySelectorAll('.alert');
      alerts.forEach(alert => alert.remove());
    }
  }
}

/**
 * Confirmation dialog system
 */
export class ConfirmDialog {
  /**
   * Show confirmation dialog for destructive actions
   * @param {Object} options - Confirmation options
   * @param {string} options.title - Dialog title
   * @param {string} options.message - Dialog message
   * @param {string} options.confirmText - Confirm button text
   * @param {string} options.cancelText - Cancel button text
   * @param {string} options.variant - Confirm button variant
   * @returns {Promise<boolean>} Resolves to true if confirmed
   */
  static async show({ 
    title = 'Confirm Action', 
    message, 
    confirmText = 'Confirm', 
    cancelText = 'Cancel',
    variant = 'danger'
  }) {
    return await UIComponents.confirm({
      title,
      message,
      confirmText,
      cancelText,
      variant
    });
  }
  
  /**
   * Show delete confirmation
   * @param {string} itemName - Name of item to delete
   * @returns {Promise<boolean>}
   */
  static async confirmDelete(itemName = 'this item') {
    return await this.show({
      title: 'Confirm Delete',
      message: `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });
  }
  
  /**
   * Show logout confirmation
   * @returns {Promise<boolean>}
   */
  static async confirmLogout() {
    return await this.show({
      title: 'Confirm Logout',
      message: 'Are you sure you want to log out?',
      confirmText: 'Logout',
      cancelText: 'Cancel',
      variant: 'primary'
    });
  }
  
  /**
   * Show discard changes confirmation
   * @returns {Promise<boolean>}
   */
  static async confirmDiscard() {
    return await this.show({
      title: 'Discard Changes',
      message: 'You have unsaved changes. Are you sure you want to discard them?',
      confirmText: 'Discard',
      cancelText: 'Keep Editing',
      variant: 'warning'
    });
  }
}

/**
 * Form validation feedback system
 */
export class FormValidation {
  /**
   * Show inline error for a form field
   * @param {string|HTMLElement} fieldId - Field ID or element
   * @param {string} errorMessage - Error message to display
   */
  static showError(fieldId, errorMessage) {
    const field = typeof fieldId === 'string' ? document.getElementById(fieldId) : fieldId;
    if (!field) return;
    
    // Add error class to field
    field.classList.add('error');
    field.setAttribute('aria-invalid', 'true');
    
    // Remove existing error message
    this.clearError(field);
    
    // Create error message element
    const errorEl = document.createElement('div');
    errorEl.className = 'form-error';
    errorEl.id = `${field.id}-error`;
    errorEl.setAttribute('role', 'alert');
    errorEl.style.cssText = `
      color: var(--danger-color);
      font-size: var(--font-size-sm);
      margin-top: var(--spacing-xs);
    `;
    errorEl.textContent = errorMessage;
    
    // Insert after field
    field.parentNode.insertBefore(errorEl, field.nextSibling);
    field.setAttribute('aria-describedby', errorEl.id);
  }
  
  /**
   * Clear error for a form field
   * @param {string|HTMLElement} fieldId - Field ID or element
   */
  static clearError(fieldId) {
    const field = typeof fieldId === 'string' ? document.getElementById(fieldId) : fieldId;
    if (!field) return;
    
    // Remove error class
    field.classList.remove('error');
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
    
    // Remove error message
    const errorEl = field.parentNode.querySelector('.form-error');
    if (errorEl) {
      errorEl.remove();
    }
  }
  
  /**
   * Show success state for a form field
   * @param {string|HTMLElement} fieldId - Field ID or element
   */
  static showSuccess(fieldId) {
    const field = typeof fieldId === 'string' ? document.getElementById(fieldId) : fieldId;
    if (!field) return;
    
    this.clearError(field);
    field.classList.add('success');
  }
  
  /**
   * Clear all validation states from a form
   * @param {string|HTMLFormElement} formId - Form ID or element
   */
  static clearForm(formId) {
    const form = typeof formId === 'string' ? document.getElementById(formId) : formId;
    if (!form) return;
    
    const fields = form.querySelectorAll('input, select, textarea');
    fields.forEach(field => {
      this.clearError(field);
      field.classList.remove('success');
    });
  }
  
  /**
   * Validate form and show errors
   * @param {string|HTMLFormElement} formId - Form ID or element
   * @param {object} errors - Object with field names as keys and error messages as values
   * @returns {boolean} True if no errors
   */
  static validateAndShow(formId, errors) {
    const form = typeof formId === 'string' ? document.getElementById(formId) : formId;
    if (!form) return false;
    
    // Clear existing errors
    this.clearForm(form);
    
    // Show new errors
    let hasErrors = false;
    for (const fieldName in errors) {
      const field = form.querySelector(`[name="${fieldName}"]`);
      if (field) {
        this.showError(field, errors[fieldName]);
        hasErrors = true;
      }
    }
    
    // Focus first error field
    if (hasErrors) {
      const firstError = form.querySelector('.error');
      if (firstError) {
        firstError.focus();
      }
    }
    
    return !hasErrors;
  }
}

/**
 * Loading state manager
 */
export class LoadingState {
  /**
   * Show loading state on a button
   * @param {string|HTMLButtonElement} buttonId - Button ID or element
   * @param {string} loadingText - Text to show while loading
   */
  static showButton(buttonId, loadingText = 'Loading...') {
    const button = typeof buttonId === 'string' ? document.getElementById(buttonId) : buttonId;
    if (!button) return;
    
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.innerHTML = `
      <span class="spinner"></span>
      <span>${loadingText}</span>
    `;
    
    // Add spinner styles if not present
    if (!document.getElementById('spinner-styles')) {
      const style = document.createElement('style');
      style.id = 'spinner-styles';
      style.textContent = `
        .spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin-right: 8px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  /**
   * Hide loading state on a button
   * @param {string|HTMLButtonElement} buttonId - Button ID or element
   */
  static hideButton(buttonId) {
    const button = typeof buttonId === 'string' ? document.getElementById(buttonId) : buttonId;
    if (!button) return;
    
    button.disabled = false;
    button.textContent = button.dataset.originalText || 'Submit';
    delete button.dataset.originalText;
  }
  
  /**
   * Show loading overlay on a container
   * @param {string|HTMLElement} containerId - Container ID or element
   * @param {string} message - Loading message
   * @returns {HTMLDivElement} Loading overlay element
   */
  static showOverlay(containerId, message = 'Loading...') {
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container) return null;
    
    // Remove existing overlay
    this.hideOverlay(container);
    
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;
    
    overlay.innerHTML = `
      <div class="spinner" style="width: 40px; height: 40px; border-width: 4px;"></div>
      <div style="margin-top: var(--spacing-md); color: var(--text-secondary);">${message}</div>
    `;
    
    container.style.position = 'relative';
    container.appendChild(overlay);
    
    return overlay;
  }
  
  /**
   * Hide loading overlay from a container
   * @param {string|HTMLElement} containerId - Container ID or element
   */
  static hideOverlay(containerId) {
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container) return;
    
    const overlay = container.querySelector('.loading-overlay');
    if (overlay) {
      overlay.remove();
    }
  }
}

/**
 * Global notification function for easy access
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds
 */
export function showNotification(message, type = 'info', duration = 3000) {
  switch (type) {
    case 'success':
      ToastNotification.success(message, duration);
      break;
    case 'error':
      ToastNotification.error(message, duration);
      break;
    case 'warning':
      ToastNotification.warning(message, duration);
      break;
    case 'info':
    default:
      ToastNotification.info(message, duration);
      break;
  }
}

// Make showNotification globally available
if (typeof window !== 'undefined') {
  window.showNotification = showNotification;
}

export default {
  ToastNotification,
  AlertSystem,
  ConfirmDialog,
  FormValidation,
  LoadingState,
  showNotification
};
