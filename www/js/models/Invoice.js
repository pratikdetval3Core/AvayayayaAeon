/**
 * Invoice Model
 */
import { generateUUID } from '../utils/uuid.js';
import { isRequired, isValidCoordinates, isValidDate, isInRange } from '../utils/validation.js';

class Invoice {
  constructor(data = {}) {
    this.id = data.id || generateUUID();
    this.userId = data.userId || '';
    this.fileName = data.fileName || '';
    this.fileData = data.fileData || ''; // base64 encoded
    this.fileType = data.fileType || '';
    this.description = data.description || '';
    this.amount = data.amount || 0;
    this.invoiceDate = data.invoiceDate || new Date().toISOString().split('T')[0];
    this.location = data.location || null; // { lat, lon }
    this.locationEnabled = data.locationEnabled || false;
    this.status = data.status || 'pending'; // 'pending' | 'processed' | 'rejected'
    this.uploadedAt = data.uploadedAt || Date.now();
  }

  /**
   * Validate invoice data
   * @returns {object} Validation result with isValid and errors
   */
  validate() {
    const errors = [];

    // Validate userId
    if (!isRequired(this.userId)) {
      errors.push('User ID is required');
    }

    // Validate fileName
    if (!isRequired(this.fileName)) {
      errors.push('File name is required');
    }

    // Validate fileData
    if (!isRequired(this.fileData)) {
      errors.push('File data is required');
    }

    // Validate fileType
    if (!isRequired(this.fileType)) {
      errors.push('File type is required');
    }

    // Validate allowed file types
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (this.fileType && !allowedTypes.includes(this.fileType)) {
      errors.push('File type must be PDF, JPEG, JPG, or PNG');
    }

    // Validate description
    if (!isRequired(this.description)) {
      errors.push('Description is required');
    }

    // Validate amount
    if (!isInRange(this.amount, 0)) {
      errors.push('Amount must be a positive number');
    }

    // Validate invoice date
    if (!isValidDate(this.invoiceDate)) {
      errors.push('Invalid invoice date');
    }

    // Validate location if enabled
    if (this.locationEnabled && this.location) {
      if (!this.location.lat || !this.location.lon) {
        errors.push('Location must have lat and lon properties');
      } else if (!isValidCoordinates(this.location.lat, this.location.lon)) {
        errors.push('Invalid location coordinates');
      }
    }

    // Validate status
    if (!['pending', 'processed', 'rejected'].includes(this.status)) {
      errors.push('Status must be "pending", "processed", or "rejected"');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Update invoice status
   * @param {string} status - New status
   */
  updateStatus(status) {
    if (['pending', 'processed', 'rejected'].includes(status)) {
      this.status = status;
    }
  }

  /**
   * Convert to plain object for storage
   * @returns {object}
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      fileName: this.fileName,
      fileData: this.fileData,
      fileType: this.fileType,
      description: this.description,
      amount: this.amount,
      invoiceDate: this.invoiceDate,
      location: this.location,
      locationEnabled: this.locationEnabled,
      status: this.status,
      uploadedAt: this.uploadedAt
    };
  }

  /**
   * Create Invoice instance from plain object
   * @param {object} data - Plain object data
   * @returns {Invoice}
   */
  static fromJSON(data) {
    return new Invoice(data);
  }

  /**
   * Get file size in MB
   * @returns {number}
   */
  getFileSizeInMB() {
    if (!this.fileData) return 0;
    // Base64 string length * 0.75 to get approximate byte size
    const bytes = this.fileData.length * 0.75;
    return Math.round((bytes / (1024 * 1024)) * 100) / 100;
  }

  /**
   * Check if invoice is pending
   * @returns {boolean}
   */
  isPending() {
    return this.status === 'pending';
  }

  /**
   * Check if invoice is processed
   * @returns {boolean}
   */
  isProcessed() {
    return this.status === 'processed';
  }
}

export default Invoice;
