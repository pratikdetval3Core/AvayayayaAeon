/**
 * KPI (Key Performance Indicator) Model
 */
import { generateUUID } from '../utils/uuid.js';
import { isRequired, isValidCoordinates } from '../utils/validation.js';

class KPI {
  constructor(data = {}) {
    this.id = data.id || generateUUID();
    this.userId = data.userId || '';
    this.title = data.title || '';
    this.description = data.description || '';
    this.value = data.value || '';
    this.status = data.status || 'pending'; // 'in_progress' | 'completed' | 'pending'
    this.image = data.image || null; // base64 encoded image
    this.location = data.location || null; // { lat, lon }
    this.locationEnabled = data.locationEnabled || false;
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
  }

  /**
   * Validate KPI data
   * @returns {object} Validation result with isValid and errors
   */
  validate() {
    const errors = [];

    // Validate userId
    if (!isRequired(this.userId)) {
      errors.push('User ID is required');
    }

    // Validate title
    if (!isRequired(this.title)) {
      errors.push('Title is required');
    }

    // Validate description
    if (!isRequired(this.description)) {
      errors.push('Description is required');
    }

    // Validate value
    if (!isRequired(this.value)) {
      errors.push('Value is required');
    }

    // Validate status
    if (!['in_progress', 'completed', 'pending'].includes(this.status)) {
      errors.push('Status must be "in_progress", "completed", or "pending"');
    }

    // Validate location if enabled
    if (this.locationEnabled && this.location) {
      if (!this.location.lat || !this.location.lon) {
        errors.push('Location must have lat and lon properties');
      } else if (!isValidCoordinates(this.location.lat, this.location.lon)) {
        errors.push('Invalid location coordinates');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Update KPI status
   * @param {string} status - New status
   */
  updateStatus(status) {
    if (['in_progress', 'completed', 'pending'].includes(status)) {
      this.status = status;
      this.updatedAt = Date.now();
    }
  }

  /**
   * Update KPI data
   * @param {object} updates - Object with fields to update
   */
  update(updates) {
    const allowedFields = ['title', 'description', 'value', 'status', 'image', 'location', 'locationEnabled'];
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        this[field] = updates[field];
      }
    }
    
    this.updatedAt = Date.now();
  }

  /**
   * Convert to plain object for storage
   * @returns {object}
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      title: this.title,
      description: this.description,
      value: this.value,
      status: this.status,
      image: this.image,
      location: this.location,
      locationEnabled: this.locationEnabled,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Create KPI instance from plain object
   * @param {object} data - Plain object data
   * @returns {KPI}
   */
  static fromJSON(data) {
    return new KPI(data);
  }

  /**
   * Check if KPI has an image
   * @returns {boolean}
   */
  hasImage() {
    return this.image !== null && this.image !== '';
  }

  /**
   * Check if KPI has location data
   * @returns {boolean}
   */
  hasLocation() {
    return this.location !== null && this.locationEnabled;
  }

  /**
   * Check if KPI is completed
   * @returns {boolean}
   */
  isCompleted() {
    return this.status === 'completed';
  }

  /**
   * Check if KPI is in progress
   * @returns {boolean}
   */
  isInProgress() {
    return this.status === 'in_progress';
  }

  /**
   * Check if KPI is pending
   * @returns {boolean}
   */
  isPending() {
    return this.status === 'pending';
  }

  /**
   * Get formatted status
   * @returns {string}
   */
  getFormattedStatus() {
    const statusMap = {
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'pending': 'Pending'
    };
    return statusMap[this.status] || this.status;
  }

  /**
   * Get image size in MB
   * @returns {number}
   */
  getImageSizeInMB() {
    if (!this.image) return 0;
    // Base64 string length * 0.75 to get approximate byte size
    const bytes = this.image.length * 0.75;
    return Math.round((bytes / (1024 * 1024)) * 100) / 100;
  }
}

export default KPI;
