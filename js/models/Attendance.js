/**
 * Attendance Model
 */
import { generateUUID } from '../utils/uuid.js';
import { isRequired, isValidCoordinates } from '../utils/validation.js';

class Attendance {
  constructor(data = {}) {
    this.id = data.id || generateUUID();
    this.userId = data.userId || '';
    this.date = data.date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    this.markInTime = data.markInTime || null;
    this.markInLocation = data.markInLocation || null; // { lat, lon }
    this.markOutTime = data.markOutTime || null;
    this.markOutLocation = data.markOutLocation || null; // { lat, lon }
    this.hoursWorked = data.hoursWorked || null;
    this.status = data.status || 'pending'; // 'pending' | 'approved' | 'rejected'
    this.approvedBy = data.approvedBy || null;
    this.approvalDate = data.approvalDate || null;
    this.rejectionReason = data.rejectionReason || null;
    this.createdAt = data.createdAt || Date.now();
  }

  /**
   * Validate attendance data
   * @returns {object} Validation result with isValid and errors
   */
  validate() {
    const errors = [];

    // Validate userId
    if (!isRequired(this.userId)) {
      errors.push('User ID is required');
    }

    // Validate date
    if (!isRequired(this.date)) {
      errors.push('Date is required');
    }

    // Validate mark in location if provided
    if (this.markInLocation) {
      if (!this.markInLocation.lat || !this.markInLocation.lon) {
        errors.push('Mark in location must have lat and lon properties');
      } else if (!isValidCoordinates(this.markInLocation.lat, this.markInLocation.lon)) {
        errors.push('Invalid mark in location coordinates');
      }
    }

    // Validate mark out location if provided
    if (this.markOutLocation) {
      if (!this.markOutLocation.lat || !this.markOutLocation.lon) {
        errors.push('Mark out location must have lat and lon properties');
      } else if (!isValidCoordinates(this.markOutLocation.lat, this.markOutLocation.lon)) {
        errors.push('Invalid mark out location coordinates');
      }
    }

    // Validate status
    if (!['pending', 'approved', 'rejected'].includes(this.status)) {
      errors.push('Status must be "pending", "approved", or "rejected"');
    }

    // Validate mark out time is after mark in time
    if (this.markInTime && this.markOutTime) {
      if (this.markOutTime <= this.markInTime) {
        errors.push('Mark out time must be after mark in time');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate hours worked
   * @returns {number|null} Hours worked or null if not marked out
   */
  calculateHoursWorked() {
    if (!this.markInTime || !this.markOutTime) {
      return null;
    }

    const diffMs = this.markOutTime - this.markInTime;
    const hours = diffMs / (1000 * 60 * 60);
    return Math.round(hours * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Mark in with timestamp and location
   * @param {object} location - Location object with lat and lon
   */
  markIn(location) {
    this.markInTime = Date.now();
    this.markInLocation = location;
  }

  /**
   * Mark out with timestamp and location
   * @param {object} location - Location object with lat and lon
   */
  markOut(location) {
    this.markOutTime = Date.now();
    this.markOutLocation = location;
    this.hoursWorked = this.calculateHoursWorked();
  }

  /**
   * Approve attendance
   * @param {string} approverId - ID of approver
   */
  approve(approverId) {
    this.status = 'approved';
    this.approvedBy = approverId;
    this.approvalDate = Date.now();
    this.rejectionReason = null;
  }

  /**
   * Reject attendance
   * @param {string} approverId - ID of approver
   * @param {string} reason - Rejection reason
   */
  reject(approverId, reason) {
    this.status = 'rejected';
    this.approvedBy = approverId;
    this.approvalDate = Date.now();
    this.rejectionReason = reason;
  }

  /**
   * Convert to plain object for storage
   * @returns {object}
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      date: this.date,
      markInTime: this.markInTime,
      markInLocation: this.markInLocation,
      markOutTime: this.markOutTime,
      markOutLocation: this.markOutLocation,
      hoursWorked: this.hoursWorked,
      status: this.status,
      approvedBy: this.approvedBy,
      approvalDate: this.approvalDate,
      rejectionReason: this.rejectionReason,
      createdAt: this.createdAt
    };
  }

  /**
   * Create Attendance instance from plain object
   * @param {object} data - Plain object data
   * @returns {Attendance}
   */
  static fromJSON(data) {
    return new Attendance(data);
  }

  /**
   * Check if attendance is complete (marked in and out)
   * @returns {boolean}
   */
  isComplete() {
    return this.markInTime !== null && this.markOutTime !== null;
  }

  /**
   * Check if attendance is pending approval
   * @returns {boolean}
   */
  isPending() {
    return this.status === 'pending';
  }
}

export default Attendance;
