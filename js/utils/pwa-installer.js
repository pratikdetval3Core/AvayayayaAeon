/**
 * PWA Installer
 * Handles service worker registration and app installation
 */

class PWAInstaller {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.serviceWorkerRegistration = null;
    
    this.init();
  }

  /**
   * Initialize PWA features
   */
  async init() {
    // Check if already installed
    this.checkInstallation();
    
    // Register service worker
    await this.registerServiceWorker();
    
    // Setup install prompt
    this.setupInstallPrompt();
    
    // Setup update checker
    this.setupUpdateChecker();
    
    // Setup online/offline detection
    this.setupConnectionMonitoring();
  }

  /**
   * Register service worker
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.log('[PWA] Service workers not supported');
      return;
    }

    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('[PWA] Service worker registered:', this.serviceWorkerRegistration);
      
      // Listen for updates
      this.serviceWorkerRegistration.addEventListener('updatefound', () => {
        const newWorker = this.serviceWorkerRegistration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.notifyUpdate();
          }
        });
      });
    } catch (error) {
      console.error('[PWA] Service worker registration failed:', error);
    }
  }

  /**
   * Setup install prompt
   */
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent default install prompt
      e.preventDefault();
      
      // Store the event for later use
      this.deferredPrompt = e;
      
      // Show custom install button
      this.showInstallButton();
      
      console.log('[PWA] Install prompt available');
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed');
      this.isInstalled = true;
      this.hideInstallButton();
      this.deferredPrompt = null;
    });
  }

  /**
   * Show install button
   */
  showInstallButton() {
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
      installBtn.style.display = 'block';
      installBtn.addEventListener('click', () => this.promptInstall());
    }
  }

  /**
   * Hide install button
   */
  hideInstallButton() {
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
      installBtn.style.display = 'none';
    }
  }

  /**
   * Prompt user to install app
   */
  async promptInstall() {
    if (!this.deferredPrompt) {
      console.log('[PWA] Install prompt not available');
      return;
    }

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for user response
    const { outcome } = await this.deferredPrompt.userChoice;
    console.log('[PWA] Install prompt outcome:', outcome);

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted install');
    } else {
      console.log('[PWA] User dismissed install');
    }

    // Clear the deferred prompt
    this.deferredPrompt = null;
  }

  /**
   * Check if app is installed
   */
  checkInstallation() {
    // Check if running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('[PWA] App is installed');
    }

    // Check if running as PWA on iOS
    if (window.navigator.standalone === true) {
      this.isInstalled = true;
      console.log('[PWA] App is installed (iOS)');
    }
  }

  /**
   * Setup update checker
   */
  setupUpdateChecker() {
    // Check for updates every hour
    setInterval(() => {
      if (this.serviceWorkerRegistration) {
        this.serviceWorkerRegistration.update();
      }
    }, 3600000);
  }

  /**
   * Notify user of available update
   */
  notifyUpdate() {
    console.log('[PWA] Update available');
    
    // Show update notification
    const updateNotification = document.createElement('div');
    updateNotification.className = 'update-notification';
    updateNotification.innerHTML = `
      <div class="update-content">
        <p>A new version is available!</p>
        <button onclick="pwaInstaller.applyUpdate()">Update Now</button>
        <button onclick="this.parentElement.parentElement.remove()">Later</button>
      </div>
    `;
    
    document.body.appendChild(updateNotification);
  }

  /**
   * Apply update
   */
  applyUpdate() {
    if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.waiting) {
      // Tell the service worker to skip waiting
      this.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload the page
      window.location.reload();
    }
  }

  /**
   * Setup connection monitoring
   */
  setupConnectionMonitoring() {
    window.addEventListener('online', () => {
      console.log('[PWA] Connection restored');
      this.showConnectionStatus('online');
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      console.log('[PWA] Connection lost');
      this.showConnectionStatus('offline');
    });
  }

  /**
   * Show connection status
   * @param {string} status - 'online' or 'offline'
   */
  showConnectionStatus(status) {
    const statusEl = document.getElementById('connectionStatus');
    if (statusEl) {
      statusEl.textContent = status === 'online' ? 'Online' : 'Offline';
      statusEl.className = `connection-status ${status}`;
    }
  }

  /**
   * Sync pending data when online
   */
  async syncPendingData() {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      return;
    }

    try {
      // Request background sync
      const registration = await navigator.serviceWorker.ready;
      
      if ('sync' in registration) {
        await registration.sync.register('sync-attendance');
        await registration.sync.register('sync-invoices');
        await registration.sync.register('sync-leave');
        await registration.sync.register('sync-kpi');
        
        console.log('[PWA] Background sync registered');
      }
    } catch (error) {
      console.error('[PWA] Background sync failed:', error);
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('[PWA] Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  /**
   * Show notification
   * @param {string} title - Notification title
   * @param {Object} options - Notification options
   */
  async showNotification(title, options = {}) {
    const hasPermission = await this.requestNotificationPermission();
    
    if (!hasPermission) {
      console.log('[PWA] Notification permission denied');
      return;
    }

    if (this.serviceWorkerRegistration) {
      await this.serviceWorkerRegistration.showNotification(title, {
        icon: '/assets/images/icon-192x192.png',
        badge: '/assets/images/badge-72x72.png',
        vibrate: [200, 100, 200],
        ...options
      });
    } else {
      new Notification(title, options);
    }
  }

  /**
   * Clear cache
   */
  async clearCache() {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('[PWA] Cache cleared');
    }
  }

  /**
   * Get cache size
   */
  async getCacheSize() {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      let totalSize = 0;
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
      }
      
      return totalSize;
    }
    
    return 0;
  }

  /**
   * Check if online
   */
  isOnline() {
    return navigator.onLine;
  }

  /**
   * Get installation status
   */
  getInstallationStatus() {
    return {
      isInstalled: this.isInstalled,
      canInstall: this.deferredPrompt !== null,
      isOnline: this.isOnline()
    };
  }
}

// Export singleton instance
const pwaInstaller = new PWAInstaller();
export default pwaInstaller;

// Make available globally for inline scripts
if (typeof window !== 'undefined') {
  window.pwaInstaller = pwaInstaller;
}
