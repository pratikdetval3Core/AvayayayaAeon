/**
 * Reusable UI Components
 * Provides button, card, form input, modal, toast, and badge components
 */

class UIComponents {
  /**
   * Create a button element
   * @param {Object} options - Button configuration
   * @param {string} options.text - Button text
   * @param {string} options.variant - Button variant (primary, secondary, danger, outline)
   * @param {Function} options.onClick - Click handler
   * @param {boolean} options.disabled - Disabled state
   * @param {string} options.icon - Optional icon HTML
   * @param {string} options.className - Additional CSS classes
   * @returns {HTMLButtonElement}
   */
  static createButton({ text, variant = 'primary', onClick, disabled = false, icon = '', className = '' }) {
    const button = document.createElement('button');
    button.className = `btn btn-${variant} ${className}`.trim();
    button.disabled = disabled;
    
    if (icon) {
      button.innerHTML = `${icon}<span>${text}</span>`;
    } else {
      button.textContent = text;
    }
    
    if (onClick) {
      button.addEventListener('click', onClick);
    }
    
    return button;
  }

  /**
   * Create a card element
   * @param {Object} options - Card configuration
   * @param {string} options.title - Card title
   * @param {string} options.content - Card content (HTML string)
   * @param {string} options.className - Additional CSS classes
   * @returns {HTMLDivElement}
   */
  static createCard({ title, content, className = '' }) {
    const card = document.createElement('div');
    card.className = `card ${className}`.trim();
    
    if (title) {
      const header = document.createElement('div');
      header.className = 'card-header';
      header.textContent = title;
      card.appendChild(header);
    }
    
    const body = document.createElement('div');
    body.className = 'card-body';
    body.innerHTML = content;
    card.appendChild(body);
    
    return card;
  }

  /**
   * Create a form input group
   * @param {Object} options - Input configuration
   * @param {string} options.type - Input type (text, email, password, number, date)
   * @param {string} options.label - Input label
   * @param {string} options.id - Input ID
   * @param {string} options.name - Input name
   * @param {string} options.placeholder - Input placeholder
   * @param {boolean} options.required - Required field
   * @param {string} options.value - Initial value
   * @param {Function} options.onChange - Change handler
   * @param {string} options.error - Error message
   * @returns {HTMLDivElement}
   */
  static createInput({ type = 'text', label, id, name, placeholder = '', required = false, value = '', onChange, error = '' }) {
    const group = document.createElement('div');
    group.className = 'form-group';
    
    if (label) {
      const labelEl = document.createElement('label');
      labelEl.className = 'form-label';
      labelEl.htmlFor = id;
      labelEl.textContent = label;
      if (required) {
        labelEl.innerHTML += ' <span style="color: var(--danger-color)">*</span>';
      }
      group.appendChild(labelEl);
    }
    
    const input = document.createElement('input');
    input.type = type;
    input.className = 'form-input';
    input.id = id;
    input.name = name || id;
    input.placeholder = placeholder;
    input.required = required;
    input.value = value;
    
    if (onChange) {
      input.addEventListener('input', onChange);
    }
    
    group.appendChild(input);
    
    if (error) {
      const errorEl = document.createElement('div');
      errorEl.className = 'form-error';
      errorEl.textContent = error;
      group.appendChild(errorEl);
    }
    
    return group;
  }

  /**
   * Create a select dropdown
   * @param {Object} options - Select configuration
   * @param {string} options.label - Select label
   * @param {string} options.id - Select ID
   * @param {string} options.name - Select name
   * @param {Array} options.options - Array of {value, text} objects
   * @param {string} options.value - Initial value
   * @param {boolean} options.required - Required field
   * @param {Function} options.onChange - Change handler
   * @returns {HTMLDivElement}
   */
  static createSelect({ label, id, name, options = [], value = '', required = false, onChange }) {
    const group = document.createElement('div');
    group.className = 'form-group';
    
    if (label) {
      const labelEl = document.createElement('label');
      labelEl.className = 'form-label';
      labelEl.htmlFor = id;
      labelEl.textContent = label;
      if (required) {
        labelEl.innerHTML += ' <span style="color: var(--danger-color)">*</span>';
      }
      group.appendChild(labelEl);
    }
    
    const select = document.createElement('select');
    select.className = 'form-select';
    select.id = id;
    select.name = name || id;
    select.required = required;
    
    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.text;
      if (opt.value === value) {
        option.selected = true;
      }
      select.appendChild(option);
    });
    
    if (onChange) {
      select.addEventListener('change', onChange);
    }
    
    group.appendChild(select);
    
    return group;
  }

  /**
   * Create a textarea
   * @param {Object} options - Textarea configuration
   * @param {string} options.label - Textarea label
   * @param {string} options.id - Textarea ID
   * @param {string} options.name - Textarea name
   * @param {string} options.placeholder - Textarea placeholder
   * @param {boolean} options.required - Required field
   * @param {string} options.value - Initial value
   * @param {number} options.rows - Number of rows
   * @param {Function} options.onChange - Change handler
   * @returns {HTMLDivElement}
   */
  static createTextarea({ label, id, name, placeholder = '', required = false, value = '', rows = 4, onChange }) {
    const group = document.createElement('div');
    group.className = 'form-group';
    
    if (label) {
      const labelEl = document.createElement('label');
      labelEl.className = 'form-label';
      labelEl.htmlFor = id;
      labelEl.textContent = label;
      if (required) {
        labelEl.innerHTML += ' <span style="color: var(--danger-color)">*</span>';
      }
      group.appendChild(labelEl);
    }
    
    const textarea = document.createElement('textarea');
    textarea.className = 'form-textarea';
    textarea.id = id;
    textarea.name = name || id;
    textarea.placeholder = placeholder;
    textarea.required = required;
    textarea.rows = rows;
    textarea.value = value;
    
    if (onChange) {
      textarea.addEventListener('input', onChange);
    }
    
    group.appendChild(textarea);
    
    return group;
  }

  /**
   * Create a status badge
   * @param {Object} options - Badge configuration
   * @param {string} options.text - Badge text
   * @param {string} options.variant - Badge variant (success, warning, danger, info)
   * @param {string} options.className - Additional CSS classes
   * @returns {HTMLSpanElement}
   */
  static createBadge({ text, variant = 'info', className = '' }) {
    const badge = document.createElement('span');
    badge.className = `badge badge-${variant} ${className}`.trim();
    badge.textContent = text;
    return badge;
  }

  /**
   * Show a toast notification
   * @param {Object} options - Toast configuration
   * @param {string} options.message - Toast message
   * @param {string} options.variant - Toast variant (success, error, info, warning)
   * @param {number} options.duration - Duration in milliseconds (default: 3000)
   */
  static showToast({ message, variant = 'info', duration = 3000 }) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${variant}`;
    toast.textContent = message;
    
    // Apply variant-specific styling
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    
    if (colors[variant]) {
      toast.style.backgroundColor = colors[variant];
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideDown 0.3s ease-out forwards';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, duration);
  }

  /**
   * Create and show a modal dialog
   * @param {Object} options - Modal configuration
   * @param {string} options.title - Modal title
   * @param {string} options.content - Modal content (HTML string)
   * @param {Array} options.buttons - Array of button configurations
   * @param {Function} options.onClose - Close handler
   * @param {boolean} options.closeOnBackdrop - Close on backdrop click (default: true)
   * @returns {Object} Modal controller with close method
   */
  static createModal({ title, content, buttons = [], onClose, closeOnBackdrop = true }) {
    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: var(--z-modal-backdrop);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      animation: fadeIn 0.2s ease-out;
    `;
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
      background-color: var(--surface);
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      z-index: var(--z-modal);
      animation: slideUpModal 0.3s ease-out;
    `;
    
    // Modal header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: var(--spacing-lg);
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    titleEl.style.cssText = `
      margin: 0;
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-semibold);
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 28px;
      cursor: pointer;
      color: var(--text-secondary);
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    header.appendChild(titleEl);
    header.appendChild(closeBtn);
    
    // Modal body
    const body = document.createElement('div');
    body.className = 'modal-body';
    body.style.cssText = `
      padding: var(--spacing-lg);
    `;
    body.innerHTML = content;
    
    // Modal footer
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    footer.style.cssText = `
      padding: var(--spacing-lg);
      border-top: 1px solid var(--border);
      display: flex;
      gap: var(--spacing-sm);
      justify-content: flex-end;
    `;
    
    buttons.forEach(btnConfig => {
      const btn = UIComponents.createButton(btnConfig);
      footer.appendChild(btn);
    });
    
    modal.appendChild(header);
    modal.appendChild(body);
    if (buttons.length > 0) {
      modal.appendChild(footer);
    }
    
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    
    // Close function
    const close = () => {
      backdrop.style.animation = 'fadeOut 0.2s ease-out';
      modal.style.animation = 'slideDownModal 0.2s ease-out';
      setTimeout(() => {
        document.body.removeChild(backdrop);
        if (onClose) onClose();
      }, 200);
    };
    
    closeBtn.addEventListener('click', close);
    
    if (closeOnBackdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          close();
        }
      });
    }
    
    // Add animations to document if not already present
    if (!document.getElementById('modal-animations')) {
      const style = document.createElement('style');
      style.id = 'modal-animations';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slideUpModal {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes slideDownModal {
          from { transform: translateY(0); }
          to { transform: translateY(100%); }
        }
        @keyframes slideDown {
          to { 
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
        }
        @media (min-width: 768px) {
          .modal-backdrop {
            align-items: center !important;
          }
          .modal {
            border-radius: var(--radius-lg) !important;
            max-height: 80vh !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    return { close };
  }

  /**
   * Show a confirmation dialog
   * @param {Object} options - Confirmation configuration
   * @param {string} options.title - Dialog title
   * @param {string} options.message - Dialog message
   * @param {string} options.confirmText - Confirm button text (default: "Confirm")
   * @param {string} options.cancelText - Cancel button text (default: "Cancel")
   * @param {string} options.variant - Confirm button variant (default: "danger")
   * @returns {Promise<boolean>} Resolves to true if confirmed, false if cancelled
   */
  static confirm({ title = 'Confirm', message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger' }) {
    return new Promise((resolve) => {
      const modal = UIComponents.createModal({
        title,
        content: `<p>${message}</p>`,
        buttons: [
          {
            text: cancelText,
            variant: 'outline',
            onClick: () => {
              modal.close();
              resolve(false);
            }
          },
          {
            text: confirmText,
            variant,
            onClick: () => {
              modal.close();
              resolve(true);
            }
          }
        ],
        onClose: () => resolve(false)
      });
    });
  }
}

export default UIComponents;
