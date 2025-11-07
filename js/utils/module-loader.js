/**
 * Module Loader
 * Implements dynamic module loading and code splitting
 */

class ModuleLoader {
  constructor() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
  }

  /**
   * Load module dynamically
   * @param {string} modulePath - Path to module
   * @returns {Promise<any>} Module exports
   */
  async loadModule(modulePath) {
    // Return cached module if already loaded
    if (this.loadedModules.has(modulePath)) {
      return this.loadedModules.get(modulePath);
    }

    // Return existing loading promise if module is being loaded
    if (this.loadingPromises.has(modulePath)) {
      return this.loadingPromises.get(modulePath);
    }

    // Load module
    const loadPromise = import(modulePath)
      .then(module => {
        this.loadedModules.set(modulePath, module);
        this.loadingPromises.delete(modulePath);
        return module;
      })
      .catch(error => {
        this.loadingPromises.delete(modulePath);
        throw new Error(`Failed to load module ${modulePath}: ${error.message}`);
      });

    this.loadingPromises.set(modulePath, loadPromise);
    return loadPromise;
  }

  /**
   * Preload module without executing
   * @param {string} modulePath - Path to module
   */
  preloadModule(modulePath) {
    if (this.loadedModules.has(modulePath) || this.loadingPromises.has(modulePath)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = modulePath;
    document.head.appendChild(link);
  }

  /**
   * Preload multiple modules
   * @param {string[]} modulePaths - Array of module paths
   */
  preloadModules(modulePaths) {
    modulePaths.forEach(path => this.preloadModule(path));
  }

  /**
   * Load page module
   * @param {string} pageName - Page name (e.g., 'dashboard', 'attendance')
   * @returns {Promise<any>} Page module
   */
  async loadPage(pageName) {
    const modulePath = `../pages/${pageName}.js`;
    return this.loadModule(modulePath);
  }

  /**
   * Load service module
   * @param {string} serviceName - Service name (e.g., 'auth', 'attendance')
   * @returns {Promise<any>} Service module
   */
  async loadService(serviceName) {
    const modulePath = `../services/${serviceName}.js`;
    return this.loadModule(modulePath);
  }

  /**
   * Load component module
   * @param {string} componentName - Component name
   * @returns {Promise<any>} Component module
   */
  async loadComponent(componentName) {
    const modulePath = `../components/${componentName}.js`;
    return this.loadModule(modulePath);
  }

  /**
   * Unload module from cache
   * @param {string} modulePath - Path to module
   */
  unloadModule(modulePath) {
    this.loadedModules.delete(modulePath);
  }

  /**
   * Clear all cached modules
   */
  clearCache() {
    this.loadedModules.clear();
    this.loadingPromises.clear();
  }

  /**
   * Get loaded module count
   * @returns {number} Number of loaded modules
   */
  getLoadedCount() {
    return this.loadedModules.size;
  }

  /**
   * Check if module is loaded
   * @param {string} modulePath - Path to module
   * @returns {boolean} True if loaded
   */
  isLoaded(modulePath) {
    return this.loadedModules.has(modulePath);
  }

  /**
   * Load CSS file dynamically
   * @param {string} cssPath - Path to CSS file
   * @returns {Promise<void>}
   */
  loadCSS(cssPath) {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      const existingLink = document.querySelector(`link[href="${cssPath}"]`);
      if (existingLink) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssPath;
      
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load CSS: ${cssPath}`));
      
      document.head.appendChild(link);
    });
  }

  /**
   * Load multiple CSS files
   * @param {string[]} cssPaths - Array of CSS file paths
   * @returns {Promise<void[]>}
   */
  loadMultipleCSS(cssPaths) {
    return Promise.all(cssPaths.map(path => this.loadCSS(path)));
  }

  /**
   * Prefetch resource
   * @param {string} url - Resource URL
   * @param {string} type - Resource type ('script', 'style', 'image', 'fetch')
   */
  prefetch(url, type = 'fetch') {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = type;
    link.href = url;
    document.head.appendChild(link);
  }

  /**
   * Preconnect to origin
   * @param {string} origin - Origin URL
   */
  preconnect(origin) {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    document.head.appendChild(link);
  }
}

// Export singleton instance
const moduleLoader = new ModuleLoader();
export default moduleLoader;
