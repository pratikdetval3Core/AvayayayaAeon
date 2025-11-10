/**
 * Loading and Empty State Components
 * Provides spinner, skeleton screens, empty states, and error states
 */

class LoadingStates {
  /**
   * Create a loading spinner
   * @param {Object} options - Spinner configuration
   * @param {string} options.size - Spinner size (small, medium, large)
   * @param {string} options.color - Spinner color (CSS color value)
   * @param {string} options.className - Additional CSS classes
   * @returns {HTMLDivElement}
   */
  static createSpinner({ size = 'medium', color = 'var(--primary-color)', className = '' }) {
    const spinner = document.createElement('div');
    spinner.className = `spinner ${className}`.trim();
    
    const sizes = {
      small: '16px',
      medium: '24px',
      large: '40px'
    };
    
    spinner.style.cssText = `
      display: inline-block;
      width: ${sizes[size] || sizes.medium};
      height: ${sizes[size] || sizes.medium};
      border: 3px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top-color: ${color};
      animation: spin 0.8s linear infinite;
    `;
    
    return spinner;
  }

  /**
   * Create a full-page loading overlay
   * @param {string} message - Optional loading message
   * @returns {HTMLDivElement}
   */
  static createLoadingOverlay(message = 'Loading...') {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-md);
      z-index: var(--z-modal);
    `;
    
    const spinner = LoadingStates.createSpinner({ size: 'large' });
    const text = document.createElement('p');
    text.textContent = message;
    text.style.cssText = `
      color: var(--text-secondary);
      font-size: var(--font-size-base);
      margin: 0;
    `;
    
    overlay.appendChild(spinner);
    overlay.appendChild(text);
    
    return overlay;
  }

  /**
   * Show loading overlay
   * @param {string} message - Optional loading message
   * @returns {Function} Function to hide the overlay
   */
  static showLoading(message = 'Loading...') {
    const overlay = LoadingStates.createLoadingOverlay(message);
    overlay.id = 'global-loading-overlay';
    document.body.appendChild(overlay);
    
    return () => {
      const existingOverlay = document.getElementById('global-loading-overlay');
      if (existingOverlay) {
        document.body.removeChild(existingOverlay);
      }
    };
  }

  /**
   * Create a skeleton screen element
   * @param {Object} options - Skeleton configuration
   * @param {string} options.type - Skeleton type (text, circle, rect)
   * @param {string} options.width - Width (CSS value)
   * @param {string} options.height - Height (CSS value)
   * @param {string} options.className - Additional CSS classes
   * @returns {HTMLDivElement}
   */
  static createSkeleton({ type = 'text', width = '100%', height = '20px', className = '' }) {
    const skeleton = document.createElement('div');
    skeleton.className = `skeleton skeleton-${type} ${className}`.trim();
    
    const baseStyles = `
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      width: ${width};
      height: ${height};
    `;
    
    if (type === 'circle') {
      skeleton.style.cssText = baseStyles + 'border-radius: 50%;';
    } else if (type === 'text') {
      skeleton.style.cssText = baseStyles + 'border-radius: var(--radius-sm);';
    } else {
      skeleton.style.cssText = baseStyles + 'border-radius: var(--radius-md);';
    }
    
    // Add shimmer animation if not already present
    if (!document.getElementById('skeleton-animations')) {
      const style = document.createElement('style');
      style.id = 'skeleton-animations';
      style.textContent = `
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    return skeleton;
  }

  /**
   * Create a skeleton card for list items
   * @returns {HTMLDivElement}
   */
  static createSkeletonCard() {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'margin-bottom: var(--spacing-md);';
    
    const header = LoadingStates.createSkeleton({ width: '60%', height: '24px' });
    header.style.marginBottom = 'var(--spacing-md)';
    
    const line1 = LoadingStates.createSkeleton({ width: '100%', height: '16px' });
    line1.style.marginBottom = 'var(--spacing-sm)';
    
    const line2 = LoadingStates.createSkeleton({ width: '80%', height: '16px' });
    line2.style.marginBottom = 'var(--spacing-sm)';
    
    const line3 = LoadingStates.createSkeleton({ width: '40%', height: '16px' });
    
    card.appendChild(header);
    card.appendChild(line1);
    card.appendChild(line2);
    card.appendChild(line3);
    
    return card;
  }

  /**
   * Create an empty state component
   * @param {Object} options - Empty state configuration
   * @param {string} options.icon - Icon HTML or emoji
   * @param {string} options.title - Empty state title
   * @param {string} options.message - Empty state message
   * @param {Object} options.action - Optional action button config
   * @returns {HTMLDivElement}
   */
  static createEmptyState({ icon = '📭', title = 'No data', message = 'There is nothing to display yet.', action = null }) {
    const container = document.createElement('div');
    container.className = 'empty-state';
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-3xl) var(--spacing-lg);
      text-align: center;
      min-height: 300px;
    `;
    
    const iconEl = document.createElement('div');
    iconEl.className = 'empty-state-icon';
    iconEl.innerHTML = icon;
    iconEl.style.cssText = `
      font-size: 64px;
      margin-bottom: var(--spacing-lg);
      opacity: 0.5;
    `;
    
    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    titleEl.style.cssText = `
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
      margin-bottom: var(--spacing-sm);
    `;
    
    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    messageEl.style.cssText = `
      font-size: var(--font-size-base);
      color: var(--text-secondary);
      margin-bottom: var(--spacing-lg);
      max-width: 400px;
    `;
    
    container.appendChild(iconEl);
    container.appendChild(titleEl);
    container.appendChild(messageEl);
    
    if (action) {
      const button = document.createElement('button');
      button.className = `btn btn-${action.variant || 'primary'}`;
      button.textContent = action.text;
      if (action.onClick) {
        button.addEventListener('click', action.onClick);
      }
      container.appendChild(button);
    }
    
    return container;
  }

  /**
   * Create an error state component
   * @param {Object} options - Error state configuration
   * @param {string} options.title - Error title
   * @param {string} options.message - Error message
   * @param {Object} options.action - Optional retry button config
   * @returns {HTMLDivElement}
   */
  static createErrorState({ title = 'Something went wrong', message = 'An error occurred. Please try again.', action = null }) {
    const container = document.createElement('div');
    container.className = 'error-state';
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-3xl) var(--spacing-lg);
      text-align: center;
      min-height: 300px;
    `;
    
    const iconEl = document.createElement('div');
    iconEl.className = 'error-state-icon';
    iconEl.innerHTML = '⚠️';
    iconEl.style.cssText = `
      font-size: 64px;
      margin-bottom: var(--spacing-lg);
    `;
    
    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    titleEl.style.cssText = `
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-semibold);
      color: var(--danger-color);
      margin-bottom: var(--spacing-sm);
    `;
    
    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    messageEl.style.cssText = `
      font-size: var(--font-size-base);
      color: var(--text-secondary);
      margin-bottom: var(--spacing-lg);
      max-width: 400px;
    `;
    
    container.appendChild(iconEl);
    container.appendChild(titleEl);
    container.appendChild(messageEl);
    
    if (action) {
      const button = document.createElement('button');
      button.className = `btn btn-${action.variant || 'primary'}`;
      button.textContent = action.text || 'Try Again';
      if (action.onClick) {
        button.addEventListener('click', action.onClick);
      }
      container.appendChild(button);
    }
    
    return container;
  }

  /**
   * Replace element content with loading skeleton
   * @param {HTMLElement} element - Target element
   * @param {number} count - Number of skeleton cards to show
   */
  static showSkeletonLoading(element, count = 3) {
    element.innerHTML = '';
    for (let i = 0; i < count; i++) {
      element.appendChild(LoadingStates.createSkeletonCard());
    }
  }

  /**
   * Replace element content with empty state
   * @param {HTMLElement} element - Target element
   * @param {Object} options - Empty state options
   */
  static showEmptyState(element, options) {
    element.innerHTML = '';
    element.appendChild(LoadingStates.createEmptyState(options));
  }

  /**
   * Replace element content with error state
   * @param {HTMLElement} element - Target element
   * @param {Object} options - Error state options
   */
  static showErrorState(element, options) {
    element.innerHTML = '';
    element.appendChild(LoadingStates.createErrorState(options));
  }
}

export default LoadingStates;
