/**
 * Location Display Component
 * Reusable component for displaying and tracking location coordinates
 */

import geolocationService from '../services/geolocation.js';

class LocationDisplay {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }

    this.options = {
      showToggle: true,
      autoStart: false,
      updateInterval: 5000,
      showAccuracy: false,
      onLocationChange: null,
      onError: null,
      ...options
    };

    this.isTracking = false;
    this.currentLocation = null;
    this.watchId = null;

    this.render();
    this.attachEventListeners();

    if (this.options.autoStart) {
      this.startTracking();
    }
  }

  /**
   * Render the component HTML
   */
  render() {
    const html = `
      <div class="location-display">
        ${this.options.showToggle ? `
          <div class="location-toggle">
            <label class="toggle-switch">
              <input type="checkbox" id="location-toggle-input" ${this.isTracking ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
            <span class="toggle-label">Enable Location Tracking</span>
          </div>
        ` : ''}
        
        <div class="location-info" id="location-info">
          <div class="location-status" id="location-status">
            <span class="status-icon">📍</span>
            <span class="status-text">Location tracking disabled</span>
          </div>
          
          <div class="location-coordinates" id="location-coordinates" style="display: none;">
            <div class="coordinate-row">
              <span class="coordinate-label">Latitude:</span>
              <span class="coordinate-value" id="latitude-value">--</span>
            </div>
            <div class="coordinate-row">
              <span class="coordinate-label">Longitude:</span>
              <span class="coordinate-value" id="longitude-value">--</span>
            </div>
            ${this.options.showAccuracy ? `
              <div class="coordinate-row">
                <span class="coordinate-label">Accuracy:</span>
                <span class="coordinate-value" id="accuracy-value">--</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    if (this.options.showToggle) {
      const toggleInput = document.getElementById('location-toggle-input');
      if (toggleInput) {
        toggleInput.addEventListener('change', (e) => {
          if (e.target.checked) {
            this.startTracking();
          } else {
            this.stopTracking();
          }
        });
      }
    }
  }

  /**
   * Start location tracking
   */
  async startTracking() {
    try {
      this.updateStatus('Requesting location permission...', 'loading');

      // Check if geolocation is available
      if (!geolocationService.isLocationEnabled()) {
        throw new Error('Geolocation is not supported by this browser');
      }

      // Get initial position
      const position = await geolocationService.getCurrentPosition();
      this.updateLocation(position);

      // Start watching position
      this.watchId = geolocationService.watchPosition((location, error) => {
        if (error) {
          this.handleError(error);
        } else {
          this.updateLocation(location);
        }
      });

      this.isTracking = true;
      this.updateStatus('Location tracking active', 'active');
      
      // Show coordinates
      const coordinatesEl = document.getElementById('location-coordinates');
      if (coordinatesEl) {
        coordinatesEl.style.display = 'block';
      }

    } catch (error) {
      this.handleError(error);
      
      // Uncheck toggle if tracking failed
      if (this.options.showToggle) {
        const toggleInput = document.getElementById('location-toggle-input');
        if (toggleInput) {
          toggleInput.checked = false;
        }
      }
    }
  }

  /**
   * Stop location tracking
   */
  stopTracking() {
    geolocationService.stopWatching();
    this.isTracking = false;
    this.watchId = null;
    this.currentLocation = null;

    this.updateStatus('Location tracking disabled', 'inactive');
    
    // Hide coordinates
    const coordinatesEl = document.getElementById('location-coordinates');
    if (coordinatesEl) {
      coordinatesEl.style.display = 'none';
    }

    // Reset coordinate values
    this.updateCoordinateDisplay(null);
  }

  /**
   * Update location data
   */
  updateLocation(location) {
    this.currentLocation = location;
    this.updateCoordinateDisplay(location);

    // Call callback if provided
    if (this.options.onLocationChange && typeof this.options.onLocationChange === 'function') {
      this.options.onLocationChange(location);
    }
  }

  /**
   * Update coordinate display
   */
  updateCoordinateDisplay(location) {
    const latEl = document.getElementById('latitude-value');
    const lonEl = document.getElementById('longitude-value');
    const accEl = document.getElementById('accuracy-value');

    if (location) {
      if (latEl) latEl.textContent = location.lat.toFixed(6);
      if (lonEl) lonEl.textContent = location.lon.toFixed(6);
      if (accEl && this.options.showAccuracy) {
        accEl.textContent = `±${Math.round(location.accuracy)}m`;
      }
    } else {
      if (latEl) latEl.textContent = '--';
      if (lonEl) lonEl.textContent = '--';
      if (accEl) accEl.textContent = '--';
    }
  }

  /**
   * Update status message
   */
  updateStatus(message, type = 'inactive') {
    const statusEl = document.getElementById('location-status');
    if (!statusEl) return;

    const statusText = statusEl.querySelector('.status-text');
    const statusIcon = statusEl.querySelector('.status-icon');

    if (statusText) {
      statusText.textContent = message;
    }

    // Update icon based on status
    if (statusIcon) {
      switch (type) {
        case 'active':
          statusIcon.textContent = '✓';
          statusIcon.style.color = 'var(--secondary-color, #10b981)';
          break;
        case 'loading':
          statusIcon.textContent = '⟳';
          statusIcon.style.color = 'var(--primary-color, #2563eb)';
          break;
        case 'error':
          statusIcon.textContent = '⚠';
          statusIcon.style.color = 'var(--danger-color, #ef4444)';
          break;
        default:
          statusIcon.textContent = '📍';
          statusIcon.style.color = 'var(--text-secondary, #6b7280)';
      }
    }

    // Update status class
    statusEl.className = `location-status status-${type}`;
  }

  /**
   * Handle errors
   */
  handleError(error) {
    console.error('Location error:', error);
    
    const message = error.message || 'Unable to retrieve location';
    this.updateStatus(message, 'error');

    // Call error callback if provided
    if (this.options.onError && typeof this.options.onError === 'function') {
      this.options.onError(error);
    }
  }

  /**
   * Get current location
   */
  getCurrentLocation() {
    return this.currentLocation;
  }

  /**
   * Check if tracking is active
   */
  isActive() {
    return this.isTracking;
  }

  /**
   * Destroy component
   */
  destroy() {
    this.stopTracking();
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

export default LocationDisplay;
