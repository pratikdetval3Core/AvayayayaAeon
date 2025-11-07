/**
 * Haptic Feedback
 * Provides haptic feedback for touch interactions
 */

class HapticFeedback {
  constructor() {
    this.supported = this.checkSupport();
  }

  /**
   * Check if haptic feedback is supported
   * @returns {boolean} True if supported
   */
  checkSupport() {
    return 'vibrate' in navigator;
  }

  /**
   * Trigger light haptic feedback
   */
  light() {
    if (this.supported) {
      navigator.vibrate(10);
    }
  }

  /**
   * Trigger medium haptic feedback
   */
  medium() {
    if (this.supported) {
      navigator.vibrate(20);
    }
  }

  /**
   * Trigger heavy haptic feedback
   */
  heavy() {
    if (this.supported) {
      navigator.vibrate(30);
    }
  }

  /**
   * Trigger success haptic feedback
   */
  success() {
    if (this.supported) {
      navigator.vibrate([10, 50, 10]);
    }
  }

  /**
   * Trigger error haptic feedback
   */
  error() {
    if (this.supported) {
      navigator.vibrate([30, 50, 30, 50, 30]);
    }
  }

  /**
   * Trigger warning haptic feedback
   */
  warning() {
    if (this.supported) {
      navigator.vibrate([20, 50, 20]);
    }
  }

  /**
   * Trigger selection haptic feedback
   */
  selection() {
    if (this.supported) {
      navigator.vibrate(5);
    }
  }

  /**
   * Trigger impact haptic feedback
   */
  impact() {
    if (this.supported) {
      navigator.vibrate(15);
    }
  }

  /**
   * Trigger notification haptic feedback
   */
  notification() {
    if (this.supported) {
      navigator.vibrate([10, 30, 10, 30, 10]);
    }
  }

  /**
   * Trigger custom haptic pattern
   * @param {number|number[]} pattern - Vibration pattern
   */
  custom(pattern) {
    if (this.supported) {
      navigator.vibrate(pattern);
    }
  }

  /**
   * Stop vibration
   */
  stop() {
    if (this.supported) {
      navigator.vibrate(0);
    }
  }

  /**
   * Add haptic feedback to button clicks
   * @param {string} selector - Button selector
   * @param {string} type - Feedback type (light, medium, heavy)
   */
  addToButtons(selector = 'button, .btn', type = 'light') {
    const buttons = document.querySelectorAll(selector);
    
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        this[type]();
      }, { passive: true });
    });
  }

  /**
   * Add haptic feedback to form inputs
   * @param {string} selector - Input selector
   */
  addToInputs(selector = 'input, select, textarea') {
    const inputs = document.querySelectorAll(selector);
    
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        this.selection();
      }, { passive: true });
      
      input.addEventListener('change', () => {
        this.light();
      }, { passive: true });
    });
  }

  /**
   * Add haptic feedback to checkboxes and radios
   * @param {string} selector - Checkbox/radio selector
   */
  addToCheckboxes(selector = 'input[type="checkbox"], input[type="radio"]') {
    const checkboxes = document.querySelectorAll(selector);
    
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.medium();
      }, { passive: true });
    });
  }

  /**
   * Add haptic feedback to switches
   * @param {string} selector - Switch selector
   */
  addToSwitches(selector = '.switch input, .toggle input') {
    const switches = document.querySelectorAll(selector);
    
    switches.forEach(switchEl => {
      switchEl.addEventListener('change', () => {
        this.medium();
      }, { passive: true });
    });
  }

  /**
   * Add haptic feedback to swipe actions
   * @param {HTMLElement} element - Element to add swipe feedback
   */
  addToSwipe(element) {
    let startX = 0;
    let triggered = false;
    
    element.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      triggered = false;
    }, { passive: true });
    
    element.addEventListener('touchmove', (e) => {
      const currentX = e.touches[0].clientX;
      const diff = Math.abs(currentX - startX);
      
      if (diff > 50 && !triggered) {
        this.light();
        triggered = true;
      }
    }, { passive: true });
  }

  /**
   * Add haptic feedback to long press
   * @param {HTMLElement} element - Element to add long press feedback
   * @param {Function} callback - Callback function
   */
  addToLongPress(element, callback) {
    let pressTimer;
    
    element.addEventListener('touchstart', () => {
      pressTimer = setTimeout(() => {
        this.heavy();
        if (callback) callback();
      }, 500);
    }, { passive: true });
    
    element.addEventListener('touchend', () => {
      clearTimeout(pressTimer);
    }, { passive: true });
    
    element.addEventListener('touchmove', () => {
      clearTimeout(pressTimer);
    }, { passive: true });
  }

  /**
   * Initialize haptic feedback for common elements
   */
  initializeAll() {
    this.addToButtons();
    this.addToInputs();
    this.addToCheckboxes();
    this.addToSwitches();
  }
}

// Export singleton instance
const hapticFeedback = new HapticFeedback();
export default hapticFeedback;
