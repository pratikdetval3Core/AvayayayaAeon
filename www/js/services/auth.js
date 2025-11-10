/**
 * Authentication Service
 * Handles user authentication, session management, and permissions
 */
import User from '../models/User.js';
import { databaseService } from './database.js';
import { storageService } from './storage.js';
import { isValidEmail, validatePassword } from '../utils/validation.js';
import { ROLE_PERMISSIONS, permissionChecker } from '../utils/permissions.js';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.permissionMap = this.initializePermissionMap();
  }

  /**
   * Initialize role-to-permission mapping
   * @returns {object} Permission map
   */
  initializePermissionMap() {
    return ROLE_PERMISSIONS;
  }

  /**
   * Hash password using simple hashing (in production, use bcrypt or similar)
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    // Simple hash for demonstration - in production use bcrypt or Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  /**
   * Verify password against hash
   * @param {string} password - Plain text password
   * @param {string} hash - Stored password hash
   * @returns {Promise<boolean>} True if password matches
   */
  async verifyPassword(password, hash) {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  }

  /**
   * Sign up a new user
   * @param {object} userData - User registration data
   * @returns {Promise<object>} Result with success status and user data or error
   */
  async signup(userData) {
    try {
      // Validate required fields
      if (!userData.username || !userData.email || !userData.password) {
        return {
          success: false,
          error: 'Username, email, and password are required'
        };
      }

      // Validate email format
      if (!isValidEmail(userData.email)) {
        return {
          success: false,
          error: 'Invalid email format'
        };
      }

      // Validate password strength
      const passwordValidation = validatePassword(userData.password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.errors.join(', ')
        };
      }

      // Check if email already exists
      await databaseService.ensureDB();
      const existingUsers = await databaseService.getByIndex(
        databaseService.stores.USERS,
        'email',
        userData.email
      );

      if (existingUsers && existingUsers.length > 0) {
        return {
          success: false,
          error: 'Email already registered'
        };
      }

      // Hash password
      const passwordHash = await this.hashPassword(userData.password);

      // Determine permissions based on role
      const permissions = this.getPermissionsForRole(userData.role || 'employee');

      // Create new user
      const newUser = new User({
        username: userData.username,
        email: userData.email,
        passwordHash: passwordHash,
        userType: userData.userType || 'employee',
        role: userData.role || 'employee',
        permissions: permissions,
        isActive: true
      });

      // Validate user data
      const validation = newUser.validate();
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Save user to database
      await databaseService.add(databaseService.stores.USERS, newUser.toJSON());

      // Return success (don't auto-login, require explicit login)
      return {
        success: true,
        message: 'Account created successfully. Please log in.',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          userType: newUser.userType,
          role: newUser.role
        }
      };
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: 'Failed to create account. Please try again.'
      };
    }
  }

  /**
   * Log in a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<object>} Result with success status and user data or error
   */
  async login(email, password) {
    try {
      // Validate inputs
      if (!email || !password) {
        return {
          success: false,
          error: 'Email and password are required'
        };
      }

      if (!isValidEmail(email)) {
        return {
          success: false,
          error: 'Invalid email format'
        };
      }

      // Static demo credentials (fallback if database is empty)
      const staticCredentials = [
        {
          email: 'admin@company.com',
          password: 'Admin@123',
          user: {
            id: 'static_admin_001',
            username: 'admin',
            email: 'admin@company.com',
            firstName: 'Admin',
            lastName: 'User',
            userType: 'admin',
            role: 'admin',
            permissions: ['all'],
            isActive: true,
            lastLogin: Date.now()
          }
        },
        {
          email: 'john.doe@company.com',
          password: 'Employee@123',
          user: {
            id: 'static_emp_001',
            username: 'john.doe',
            email: 'john.doe@company.com',
            firstName: 'John',
            lastName: 'Doe',
            userType: 'employee',
            role: 'employee',
            permissions: ['view_own_data', 'submit_attendance', 'submit_invoice', 'apply_leave', 'submit_kpi'],
            isActive: true,
            lastLogin: Date.now()
          }
        }
      ];

      // Check static credentials first
      const staticMatch = staticCredentials.find(cred => cred.email === email && cred.password === password);
      if (staticMatch) {
        const sessionData = staticMatch.user;
        storageService.setSession(sessionData);
        this.currentUser = sessionData;
        permissionChecker.setCurrentUser(sessionData);

        return {
          success: true,
          message: 'Login successful (demo mode)',
          user: sessionData
        };
      }

      // Find user by email in database
      await databaseService.ensureDB();
      const users = await databaseService.getByIndex(
        databaseService.stores.USERS,
        'email',
        email
      );

      if (!users || users.length === 0) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      const userData = users[0];
      const user = User.fromJSON(userData);

      // Check if user is active
      if (!user.isActive) {
        return {
          success: false,
          error: 'Account is deactivated. Please contact administrator.'
        };
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Update last login
      user.updateLastLogin();
      await databaseService.update(databaseService.stores.USERS, user.toJSON());

      // Create session
      const sessionData = {
        id: user.id,
        username: user.username,
        email: user.email,
        userType: user.userType,
        role: user.role,
        permissions: user.permissions,
        lastLogin: user.lastLogin
      };

      storageService.setSession(sessionData);
      this.currentUser = user;
      
      // Update permission checker with current user
      permissionChecker.setCurrentUser(sessionData);

      return {
        success: true,
        message: 'Login successful',
        user: sessionData
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    }
  }

  /**
   * Log out current user
   * @returns {boolean} True if logout successful
   */
  logout() {
    try {
      storageService.clearSession();
      this.currentUser = null;
      permissionChecker.setCurrentUser(null);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  /**
   * Get current authenticated user
   * @returns {object|null} Current user data or null
   */
  getCurrentUser() {
    if (this.currentUser) {
      return this.currentUser;
    }

    const sessionUser = storageService.getCurrentUser();
    if (sessionUser) {
      this.currentUser = sessionUser;
      permissionChecker.setCurrentUser(sessionUser);
      return sessionUser;
    }

    return null;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user is authenticated
   */
  isAuthenticated() {
    return storageService.isAuthenticated();
  }

  /**
   * Check if current user has specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean} True if user has permission
   */
  hasPermission(permission) {
    const user = this.getCurrentUser();
    if (!user) {
      return false;
    }

    return permissionChecker.hasPermission(permission);
  }
  
  /**
   * Check if user has any of the specified permissions
   * @param {string[]} permissions - Array of permissions to check
   * @returns {boolean} True if user has at least one permission
   */
  hasAnyPermission(permissions) {
    const user = this.getCurrentUser();
    if (!user) {
      return false;
    }

    return permissionChecker.hasAnyPermission(permissions);
  }
  
  /**
   * Check if user has all of the specified permissions
   * @param {string[]} permissions - Array of permissions to check
   * @returns {boolean} True if user has all permissions
   */
  hasAllPermissions(permissions) {
    const user = this.getCurrentUser();
    if (!user) {
      return false;
    }

    return permissionChecker.hasAllPermissions(permissions);
  }

  /**
   * Get permissions for a specific role
   * @param {string} role - User role
   * @returns {string[]} Array of permissions
   */
  getPermissionsForRole(role) {
    return this.permissionMap[role] || [];
  }

  /**
   * Refresh current session
   * @returns {boolean} True if session refreshed successfully
   */
  refreshSession() {
    return storageService.refreshSession();
  }

  /**
   * Check if session is expiring soon
   * @returns {boolean} True if session expires within 1 hour
   */
  isSessionExpiringSoon() {
    return storageService.isSessionExpiringSoon();
  }

  /**
   * Get session expiration time
   * @returns {number|null} Timestamp of expiration or null
   */
  getSessionExpiration() {
    return storageService.getSessionExpiration();
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
