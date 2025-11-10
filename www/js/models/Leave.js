/**
 * Leave Application Model
 */
import { generateUUID } from '../utils/uuid.js';
import { isRequired, isValidDate, isValidDateRange } from '../utils/validation.js';

class Leave {
  constructor(data = {}) {
    this.id = data.id || generateUUID();
    this.userId = data.userId || '';
    this.leaveType = data.leaveType || '';
    this.startDate = data.startDate || '';
    this.endDate = data.endDate || '';
    this.duration = data.duration || 0; // in days
    this.reason = data.reason || '';
    this.status = data.status || 'pending'; // 'pending' | 'approved' | 'rejected'
    this.approvedBy = data.approvedBy || null;
    this.approvalDate = data.approvalDate || null;
    this.rejectionReason = data.rejectionReason || null;
    this.createdAt = data.createdAt || Date.now();
  }

  /**
   * Validate leave application data
   * @returns {object} Validation result with isValid and errors
   */
  validate() {
    const errors = [];

    // Validate userId
    if (!isRequired(this.userId)) {
      errors.push('User ID is required');
    }

    // Validate leave type
    if (!isRequired(this.leaveType)) {
      errors.push('Leave type is required');
    }

    // Validate common leave types
    const validLeaveTypes = ['sick', 'casual', 'vacation', 'personal', 'emergency', 'unpaid'];
    if (this.leaveType && !validLeaveTypes.includes(this.leaveType.toLowerCase())) {
      errors.push('Invalid leave type');
    }

    // Validate start date
    if (!isValidDate(this.startDate)) {
      errors.push('Invalid start date');
    }

    // Validate end date
    if (!isValidDate(this.endDate)) {
      errors.push('Invalid end date');
    }

    // Validate date range
    if (this.startDate && this.endDate && !isValidDateRange(this.startDate, this.endDate)) {
      errors.push('End date must be on or after start date');
    }

    // Validate reason
    if (!isRequired(this.reason)) {
      errors.push('Reason is required');
    }

    // Validate duration
    if (this.duration <= 0) {
      errors.push('Duration must be greater than 0');
    }

    // Validate status
    if (!['pending', 'approved', 'rejected'].includes(this.status)) {
      errors.push('Status must be "pending", "approved", or "rejected"');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate leave duration in days
   * @returns {number} Number of days
   */
  calculateDuration() {
    if (!this.startDate || !this.endDate) {
      return 0;
    }

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    
    return diffDays;
  }

  /**
   * Auto-calculate and set duration
   */
  setDuration() {
    this.duration = this.calculateDuration();
  }

  /**
   * Approve leave application
   * @param {string} approverId - ID of approver
   */
  approve(approverId) {
    this.status = 'approved';
    this.approvedBy = approverId;
    this.approvalDate = Date.now();
    this.rejectionReason = null;
  }

  /**
   * Reject leave application
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
      leaveType: this.leaveType,
      startDate: this.startDate,
      endDate: this.endDate,
      duration: this.duration,
      reason: this.reason,
      status: this.status,
      approvedBy: this.approvedBy,
      approvalDate: this.approvalDate,
      rejectionReason: this.rejectionReason,
      createdAt: this.createdAt
    };
  }

  /**
   * Create Leave instance from plain object
   * @param {object} data - Plain object data
   * @returns {Leave}
   */
  static fromJSON(data) {
    return new Leave(data);
  }

  /**
   * Check if leave is pending
   * @returns {boolean}
   */
  isPending() {
    return this.status === 'pending';
  }

  /**
   * Check if leave is approved
   * @returns {boolean}
   */
  isApproved() {
    return this.status === 'approved';
  }

  /**
   * Get formatted leave type
   * @returns {string}
   */
  getFormattedLeaveType() {
    return this.leaveType.charAt(0).toUpperCase() + this.leaveType.slice(1);
  }

  /**
   * Check if leave is in the future
   * @returns {boolean}
   */
  isFuture() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(this.startDate);
    return start > today;
  }

  /**
   * Check if leave is currently active
   * @returns {boolean}
   */
  isActive() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    return today >= start && today <= end && this.status === 'approved';
  }
}

export default Leave;
