/**
 * User Model
 */
import { generateUUID } from '../utils/uuid.js';
import { isValidEmail, validatePassword, validateUsername, isRequired } from '../utils/validation.js';

class User {
  constructor(data = {}) {
    this.id = data.id || generateUUID();
    this.username = data.username || '';
    this.email = data.email || '';
    this.passwordHash = data.passwordHash || '';
    this.userType = data.userType || 'employee'; // 'employee' | 'admin'
    this.role = data.role || '';
    this.permissions = data.permissions || [];
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
    this.lastLogin = data.lastLogin || null;
  }

  /**
   * Validate user data
   * @returns {object} Validation result with isValid and errors
   */
  validate() {
    const errors = [];

    // Validate username
    const usernameValidation = validateUsername(this.username);
    if (!usernameValidation.isValid) {
      errors.push(usernameValidation.error);
    }

    // Validate email
    if (!isValidEmail(this.email)) {
      errors.push('Invalid email format');
    }

    // Validate user type
    if (!['employee', 'admin'].includes(this.userType)) {
      errors.push('User type must be either "employee" or "admin"');
    }

    // Validate role
    if (!isRequired(this.role)) {
      errors.push('Role is required');
    }

    // Validate permissions array
    if (!Array.isArray(this.permissions)) {
      errors.push('Permissions must be an array');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate password (for new users or password changes)
   * @param {string} password - Plain text password
   * @returns {object} Validation result
   */
  static validatePassword(password) {
    return validatePassword(password);
  }

  /**
   * Convert to plain object for storage
   * @returns {object}
   */
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      passwordHash: this.passwordHash,
      userType: this.userType,
      role: this.role,
      permissions: this.permissions,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLogin: this.lastLogin
    };
  }

  /**
   * Create User instance from plain object
   * @param {object} data - Plain object data
   * @returns {User}
   */
  static fromJSON(data) {
    return new User(data);
  }

  /**
   * Get user display name
   * @returns {string}
   */
  getDisplayName() {
    return this.username || this.email;
  }

  /**
   * Check if user has specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean}
   */
  hasPermission(permission) {
    return this.permissions.includes(permission);
  }

  /**
   * Update last login timestamp
   */
  updateLastLogin() {
    this.lastLogin = Date.now();
    this.updatedAt = Date.now();
  }
}

export default User;
