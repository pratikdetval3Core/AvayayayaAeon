/**
 * Lazy Loading Utility
 * Implements lazy loading for images and other resources
 */

class LazyLoader {
  constructor() {
    this.observer = null;
    this.init();
  }

  /**
   * Initialize Intersection Observer for lazy loading
   */
  init() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.loadElement(entry.target);
              this.observer.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '50px 0px',
          threshold: 0.01
        }
      );
    }
  }

  /**
   * Load element (image or iframe)
   * @param {HTMLElement} element - Element to load
   */
  loadElement(element) {
    if (element.tagName === 'IMG') {
      this.loadImage(element);
    } else if (element.tagName === 'IFRAME') {
      this.loadIframe(element);
    } else if (element.dataset.bg) {
      this.loadBackgroundImage(element);
    }
  }

  /**
   * Load image
   * @param {HTMLImageElement} img - Image element
   */
  loadImage(img) {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;

    if (!src && !srcset) return;

    // Add loading class
    img.classList.add('lazy-loading');

    // Create temporary image to preload
    const tempImg = new Image();
    
    tempImg.onload = () => {
      if (src) img.src = src;
      if (srcset) img.srcset = srcset;
      
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-loaded');
      
      // Remove data attributes
      delete img.dataset.src;
      delete img.dataset.srcset;
    };

    tempImg.onerror = () => {
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-error');
    };

    if (src) tempImg.src = src;
  }

  /**
   * Load background image
   * @param {HTMLElement} element - Element with background image
   */
  loadBackgroundImage(element) {
    const bg = element.dataset.bg;
    if (!bg) return;

    element.classList.add('lazy-loading');

    const img = new Image();
    img.onload = () => {
      element.style.backgroundImage = `url(${bg})`;
      element.classList.remove('lazy-loading');
      element.classList.add('lazy-loaded');
      delete element.dataset.bg;
    };

    img.onerror = () => {
      element.classList.remove('lazy-loading');
      element.classList.add('lazy-error');
    };

    img.src = bg;
  }

  /**
   * Load iframe
   * @param {HTMLIFrameElement} iframe - Iframe element
   */
  loadIframe(iframe) {
    const src = iframe.dataset.src;
    if (!src) return;

    iframe.src = src;
    delete iframe.dataset.src;
  }

  /**
   * Observe element for lazy loading
   * @param {HTMLElement} element - Element to observe
   */
  observe(element) {
    if (this.observer) {
      this.observer.observe(element);
    } else {
      // Fallback: load immediately if IntersectionObserver not supported
      this.loadElement(element);
    }
  }

  /**
   * Observe multiple elements
   * @param {NodeList|Array} elements - Elements to observe
   */
  observeAll(elements) {
    elements.forEach(element => this.observe(element));
  }

  /**
   * Initialize lazy loading for all images with data-src
   */
  initImages() {
    const images = document.querySelectorAll('img[data-src], img[data-srcset]');
    this.observeAll(images);
  }

  /**
   * Initialize lazy loading for all background images with data-bg
   */
  initBackgrounds() {
    const elements = document.querySelectorAll('[data-bg]');
    this.observeAll(elements);
  }

  /**
   * Initialize lazy loading for all iframes with data-src
   */
  initIframes() {
    const iframes = document.querySelectorAll('iframe[data-src]');
    this.observeAll(iframes);
  }

  /**
   * Initialize all lazy loading
   */
  initAll() {
    this.initImages();
    this.initBackgrounds();
    this.initIframes();
  }

  /**
   * Disconnect observer
   */
  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Export singleton instance
const lazyLoader = new LazyLoader();
export default lazyLoader;
