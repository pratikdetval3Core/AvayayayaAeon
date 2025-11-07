/**
 * Geolocation Service
 * Handles device location tracking and permission management
 */

class GeolocationService {
  constructor() {
    this.watchId = null;
    this.currentPosition = null;
    this.permissionGranted = false;
  }

  /**
   * Request permission to access device location
   * @returns {Promise<boolean>} True if permission granted
   */
  async requestPermission() {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }

    try {
      // Try to get position to trigger permission prompt
      await this.getCurrentPosition();
      this.permissionGranted = true;
      return true;
    } catch (error) {
      if (error.code === 1) {
        // Permission denied
        this.permissionGranted = false;
        throw new Error('Location permission denied');
      }
      throw error;
    }
  }

  /**
   * Get current device position
   * @returns {Promise<{lat: number, lon: number, timestamp: number}>}
   */
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            timestamp: position.timestamp,
            accuracy: position.coords.accuracy
          };
          this.currentPosition = locationData;
          resolve(locationData);
        },
        (error) => {
          reject(this._handleGeolocationError(error));
        },
        options
      );
    });
  }

  /**
   * Start watching position for continuous tracking
   * @param {Function} callback - Called with position updates
   * @returns {number} Watch ID
   */
  watchPosition(callback) {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }

    if (this.watchId !== null) {
      this.stopWatching();
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          timestamp: position.timestamp,
          accuracy: position.coords.accuracy
        };
        this.currentPosition = locationData;
        callback(locationData);
      },
      (error) => {
        callback(null, this._handleGeolocationError(error));
      },
      options
    );

    return this.watchId;
  }

  /**
   * Stop watching position
   */
  stopWatching() {
    if (this.watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Check if location services are enabled
   * @returns {boolean}
   */
  isLocationEnabled() {
    return 'geolocation' in navigator;
  }

  /**
   * Format coordinates for display
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {number} precision - Decimal places (default: 6)
   * @returns {string} Formatted coordinates
   */
  formatCoordinates(lat, lon, precision = 6) {
    if (lat === null || lat === undefined || lon === null || lon === undefined) {
      return 'Location unavailable';
    }

    const latFixed = parseFloat(lat).toFixed(precision);
    const lonFixed = parseFloat(lon).toFixed(precision);
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';

    return `${Math.abs(latFixed)}° ${latDir}, ${Math.abs(lonFixed)}° ${lonDir}`;
  }

  /**
   * Format coordinates as simple string
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {string} Simple coordinate string
   */
  formatSimple(lat, lon) {
    if (lat === null || lat === undefined || lon === null || lon === undefined) {
      return 'N/A';
    }
    return `${parseFloat(lat).toFixed(6)}, ${parseFloat(lon).toFixed(6)}`;
  }

  /**
   * Handle geolocation errors
   * @private
   */
  _handleGeolocationError(error) {
    let message = 'Unable to retrieve location';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Location permission denied. Please enable location access in your browser settings.';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Location information is unavailable. Please check your device settings.';
        break;
      case error.TIMEOUT:
        message = 'Location request timed out. Please try again.';
        break;
      default:
        message = `Location error: ${error.message}`;
    }

    const err = new Error(message);
    err.code = error.code;
    return err;
  }

  /**
   * Get cached position if available
   * @returns {Object|null}
   */
  getCachedPosition() {
    return this.currentPosition;
  }
}

// Export singleton instance
const geolocationService = new GeolocationService();
export default geolocationService;
