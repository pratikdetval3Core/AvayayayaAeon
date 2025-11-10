/**
 * Accessibility Utility
 * Provides accessibility enhancements and keyboard navigation support
 */

class AccessibilityManager {
  constructor() {
    this.focusableElements = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');
    
    this.init();
  }

  /**
   * Initialize accessibility features
   */
  init() {
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupSkipLinks();
  }

  /**
   * Setup keyboard navigation
   */
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Escape key to close modals/dialogs
      if (e.key === 'Escape') {
        this.handleEscape();
      }
      
      // Tab key for focus management
      if (e.key === 'Tab') {
        this.handleTab(e);
      }
      
      // Arrow keys for navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        this.handleArrowKeys(e);
      }
    });
  }

  /**
   * Setup focus management
   */
  setupFocusManagement() {
    // Show focus indicators when using keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
      }
    });

    // Hide focus indicators when using mouse
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-nav');
    });
  }

  /**
   * Setup skip links for screen readers
   */
  setupSkipLinks() {
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
      skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(skipLink.getAttribute('href'));
        if (target) {
          target.focus();
          target.scrollIntoView();
        }
      });
    }
  }

  /**
   * Handle Escape key press
   */
  handleEscape() {
    // Close open modals
    const openModal = document.querySelector('.modal.show, .dialog.show');
    if (openModal) {
      const closeButton = openModal.querySelector('[data-dismiss]');
      if (closeButton) {
        closeButton.click();
      }
    }

    // Close open dropdowns
    const openDropdown = document.querySelector('.dropdown.show');
    if (openDropdown) {
      openDropdown.classList.remove('show');
    }
  }

  /**
   * Handle Tab key press
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleTab(e) {
    const modal = document.querySelector('.modal.show, .dialog.show');
    if (modal) {
      this.trapFocus(e, modal);
    }
  }

  /**
   * Handle arrow key navigation
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleArrowKeys(e) {
    const target = e.target;
    
    // Handle list navigation
    if (target.closest('[role="listbox"], [role="menu"]')) {
      e.preventDefault();
      this.navigateList(e);
    }
    
    // Handle tab navigation
    if (target.closest('[role="tablist"]')) {
      e.preventDefault();
      this.navigateTabs(e);
    }
  }

  /**
   * Trap focus within a container
   * @param {KeyboardEvent} e - Keyboard event
   * @param {HTMLElement} container - Container element
   */
  trapFocus(e, container) {
    const focusable = container.querySelectorAll(this.focusableElements);
    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  /**
   * Navigate list with arrow keys
   * @param {KeyboardEvent} e - Keyboard event
   */
  navigateList(e) {
    const list = e.target.closest('[role="listbox"], [role="menu"]');
    const items = Array.from(list.querySelectorAll('[role="option"], [role="menuitem"]'));
    const currentIndex = items.indexOf(e.target);

    let nextIndex;
    if (e.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % items.length;
    } else if (e.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + items.length) % items.length;
    } else {
      return;
    }

    items[nextIndex].focus();
  }

  /**
   * Navigate tabs with arrow keys
   * @param {KeyboardEvent} e - Keyboard event
   */
  navigateTabs(e) {
    const tablist = e.target.closest('[role="tablist"]');
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    const currentIndex = tabs.indexOf(e.target);

    let nextIndex;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else {
      return;
    }

    tabs[nextIndex].click();
    tabs[nextIndex].focus();
  }

  /**
   * Add ARIA label to element
   * @param {HTMLElement} element - Element
   * @param {string} label - ARIA label
   */
  addAriaLabel(element, label) {
    if (element && label) {
      element.setAttribute('aria-label', label);
    }
  }

  /**
   * Add ARIA described by
   * @param {HTMLElement} element - Element
   * @param {string} descriptionId - ID of description element
   */
  addAriaDescribedBy(element, descriptionId) {
    if (element && descriptionId) {
      element.setAttribute('aria-describedby', descriptionId);
    }
  }

  /**
   * Set ARIA live region
   * @param {HTMLElement} element - Element
   * @param {string} politeness - 'polite' or 'assertive'
   */
  setAriaLive(element, politeness = 'polite') {
    if (element) {
      element.setAttribute('aria-live', politeness);
      element.setAttribute('aria-atomic', 'true');
    }
  }

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   * @param {string} politeness - 'polite' or 'assertive'
   */
  announce(message, politeness = 'polite') {
    let announcer = document.getElementById('aria-announcer');
    
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'aria-announcer';
      announcer.className = 'sr-only';
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', politeness);
      announcer.setAttribute('aria-atomic', 'true');
      document.body.appendChild(announcer);
    }

    // Clear and set new message
    announcer.textContent = '';
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);
  }

  /**
   * Get all focusable elements in container
   * @param {HTMLElement} container - Container element
   * @returns {NodeList} Focusable elements
   */
  getFocusableElements(container = document) {
    return container.querySelectorAll(this.focusableElements);
  }

  /**
   * Focus first element in container
   * @param {HTMLElement} container - Container element
   */
  focusFirst(container) {
    const focusable = this.getFocusableElements(container);
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }

  /**
   * Check if element is visible
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} True if visible
   */
  isVisible(element) {
    return !!(
      element.offsetWidth ||
      element.offsetHeight ||
      element.getClientRects().length
    );
  }

  /**
   * Set focus to element with fallback
   * @param {HTMLElement} element - Element to focus
   * @param {HTMLElement} fallback - Fallback element
   */
  setFocus(element, fallback = null) {
    if (element && this.isVisible(element)) {
      element.focus();
    } else if (fallback && this.isVisible(fallback)) {
      fallback.focus();
    }
  }

  /**
   * Create skip link
   * @param {string} targetId - ID of target element
   * @param {string} text - Link text
   * @returns {HTMLElement} Skip link element
   */
  createSkipLink(targetId, text = 'Skip to main content') {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.className = 'skip-link';
    skipLink.textContent = text;
    
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus();
        target.scrollIntoView();
      }
    });
    
    return skipLink;
  }

  /**
   * Add keyboard shortcuts
   * @param {Object} shortcuts - Shortcut configuration
   */
  addKeyboardShortcuts(shortcuts) {
    document.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      const modifiers = {
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        meta: e.metaKey
      };

      for (const [shortcut, handler] of Object.entries(shortcuts)) {
        if (this.matchesShortcut(key, modifiers, shortcut)) {
          e.preventDefault();
          handler(e);
        }
      }
    });
  }

  /**
   * Check if key combination matches shortcut
   * @param {string} key - Pressed key
   * @param {Object} modifiers - Modifier keys
   * @param {string} shortcut - Shortcut string
   * @returns {boolean} True if matches
   */
  matchesShortcut(key, modifiers, shortcut) {
    const parts = shortcut.toLowerCase().split('+');
    const shortcutKey = parts[parts.length - 1];
    
    if (key !== shortcutKey) return false;
    
    const requiredModifiers = {
      ctrl: parts.includes('ctrl'),
      alt: parts.includes('alt'),
      shift: parts.includes('shift'),
      meta: parts.includes('meta')
    };
    
    return Object.keys(requiredModifiers).every(
      mod => modifiers[mod] === requiredModifiers[mod]
    );
  }
}

// Export singleton instance
const accessibilityManager = new AccessibilityManager();
export default accessibilityManager;
